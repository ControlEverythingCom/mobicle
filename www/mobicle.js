(function($) {

	$(document).ready(function() {
		var ParticleAPI = null;
		var accessToken = window.localStorage.getItem('access_token');

		$('body').on('load_page_deviceList', function(a, b) {
			ParticleAPI.updateDevices();
			$('#logoutbutton').click(ParticleAPI.logOut);
		});

		$('body').on('load_page_device', function(a, b) {
			var device = ParticleAPI.updateDevice(getUrlParameter('deviceid'));
			$('#devicelistbutton').click(function(){
            	$('body').pagecontainer('change', 'deviceList.html');
            });
			device.loaded(function(device) {
				var select = $('#buttonFunctionList');
				$('#deviceFunctionList li:not([data-role=list-divider])').each(function() {
					var option = $('<option></option>').text($(this).text()).val($(this).text());
					select.append(option);
				});
				select.selectmenu();
				select.selectmenu('refresh', true);
				console.log(select);
				$('#addButtonForm').submit(function() {
					var vals = $(this).getValues();
					device.addButton(vals);
					$('#addButtonPopup').popup('close');
					return false;
				});
			});
			$('#addButtonPopup').on('popupafterclose', function() {
				$('#buttonFunctionList').val('_none');
				console.log('set stuff');
			});
		});
		$('body').pagecontainer({
			change : function(a, b) {
				if ( typeof b.absUrl == 'undefined') {
					var url = b.options.dataUrl;
				} else {
					var url = b.absUrl;
				}
				var l = document.createElement("a");
				l.href = url;
				var page = l.pathname.split('/').pop().replace('.html', '');
				var event = 'load_page_' + page;

				$('body').trigger(event, a, b);
				console.log(event + ' triggered');
			}
		});

		if ( typeof accessToken == 'undefined' || accessToken == null) {
			console.log("accessToken not found");
			var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
			form.on("submit", function(e) {
				e.preventDefault();
				$.post($(this).attr('action'), $(this).serialize(), function(result) {
					console.log(result);
					if ( typeof result.access_token != 'undefined') {
						window.localStorage.setItem('access_token', result.access_token);
						//window.location.href = 'deviceList.html';

						ParticleAPI = new Particle(result.access_token);
						$('body').pagecontainer('change', 'deviceList.html');
					}
				});
				return false;
			});
			$('<input type="hidden" name="client_id" value="particle">').appendTo(form);
			$('<input type="hidden" name="client_secret" value="particle">').appendTo(form);
			$('<input type="hidden" name="grant_type" value="password">').appendTo(form);
			$('<label for="username">Email:</label>').appendTo(form);
			$('<input type="email" name="username" id="username"></input>').appendTo(form);
			$('<label for="password">Password:</label>').appendTo(form);
			$('<input type="password" name="password" id="password"></input>').appendTo(form);
			$('<input type="submit" value="Sign In"></input>').appendTo(form);
			form.appendTo($('body').pagecontainer('getActivePage'));
			form.trigger('create');
		} else {
			ParticleAPI = new Particle(accessToken);
			if (window.location.pathname.indexOf('html') < 0) {
				$('body').pagecontainer('change', 'deviceList.html');
			} else {
				var page = window.location.pathname.split('/').pop().replace('.html', '');
				var event = 'load_page_' + page;
				$('body').trigger(event);
			}
		}
	});

	function Particle(accessToken) {
		this.baseUrl = 'https://api.particle.io/v1/';
		this.accessToken = accessToken;
	}
	
	Particle.prototype.logOut=function(){
    	console.log("Logging out");
    	window.localStorage.removeItem('access_token');
    	$('body').pagecontainer('change', 'index.html');
    };


	Particle.prototype.updateDevices = function(list) {
		var devices = null;
		$.get(this.baseUrl + 'devices?access_token=' + this.accessToken).done(function(devices) {
			$.each(devices, function() {
				var device = this;
				var li = $('#' + device.id);
				//No device in list so create it
				if (li.length == 0) {
					var name = device.name == null ? "Unnamed Device" : device.name;
					var li = $("<li></li>").appendTo("#deviceListView").attr("id", device.id);
				}

				if (device.connected == true && !li.hasClass('connected')) {
					var hrefLink = $('<a href= device.html?deviceid=' + device.id + '>' + '</a>');
					hrefLink.text(device.name);
					li.append(hrefLink).addClass('connected');
				}
				//Device Not connected
				else {
					//Device not connected so we really dont need to do anything but display it to the user.
					li.text(device.name);
				}
			});
			$('#deviceListView').listview().listview('refresh');
		}).fail(function() {
			$('#statusLabel').text("Error loading Device List");
		});
	};
	Particle.prototype.updateDevice = function(deviceID) {
		var device = new Device(this, deviceID);
		device.update();
		return device;
	};

	function Device(api, did) {
		this.api = api;
		this.id = did;
		this.baseUrl = this.api.baseUrl + 'devices/' + this.id;
		this.urlTail = "?access_token=" + this.api.accessToken;
		this._loaded = [];
		this.isLoaded = false;
		this.buttons = [];
		currentDevice = this;
	}


	Device.prototype.loaded = function(f) {
		if ( typeof f === 'undefined') {
			this.isLoaded = true;
			for (var i = 0; i < this._loaded.length; i++) {
				var func = this._loaded[i];
				func(this);
			}
		} else {
			if (this.isLoaded)
				f(this);
			else
				this._loaded.push(f);
		}
	};
	Device.prototype.update = function() {
		var device = this;
		$.get(this.baseUrl + this.urlTail).done(function(data) {
			$('#deviceName').text(data.name);
			device.data = data;
			device.updateFunctions();
			device.updateVariables();
			device.updateEvents();
			//window.localStorage.setItem('device_'+device.id+'_buttons','');
			var buttons = window.localStorage.getItem('device_' + device.id + '_buttons');
			console.log(buttons);
			if (buttons) {
				device.buttons = $.parseJSON(buttons);
				for (var i = 0; i < device.buttons.length; i++) {
					device.addButton(device.buttons[i], false);
				}
			}
			device.loaded();
			console.log('loaded called');
		});
	};
	Device.prototype.updateFunctions = function() {
		var device = this;
		$('#deviceFunctionList li:not([data-role=list-divider])').remove();
		$.each(this.data.functions, function(key, func) {
			var functionLI = $("<li></li>").appendTo($('#deviceFunctionList')).text(func).click(function() {
				var userInput = prompt("Enter function Argument");
				if (userInput)
					device.callFunction(func, userInput);
			});
		});
		$('#deviceFunctionList').listview().listview('refresh');
	};
	Device.prototype.updateVariables = function() {
		var device = this;
		$.each(this.data.variables, function(key, value) {
			$('<li></li>').appendTo($('#deviceVariablesList')).attr("id", device.id + key);
			device.updateVariable(key);
		});
		$('#deviceVariablesList').listview().listview('refresh');
		/*if($('#deviceVariablesList li:not[data-role=list-divider]').length==0){
		 window.setTimeout(function(){
		 device.updateVariables();
		 }, 10000);
		 }*/
	};
	Device.prototype.updateVariable = function(key) {
		var device = this;
		$.get(device.baseUrl + "/" + key + device.urlTail).done(function(data) {
			$("li#" + device.id + data.name).text(data.name + ": " + data.result);
		});
		window.setTimeout(function() {
			device.updateVariable(key);
		}, 10000);
	};
	Device.prototype.updateEvents = function() {
		var device = this;
		$('#eventListDivider,#addEventButton').click(function() {
			var userInput = prompt("Enter function Argument");
			if (userInput) {
				if (userInput) {
					device.addEventListener(userInput);
				}
			}
		});
		$('#deviceEventsList').listview().listview('refresh');
	};
	Device.prototype.callFunction = function(f, v) {
		var device = this;
		$.post(this.baseUrl + "/" + f, {
			arg : v,
			access_token : device.api.accessToken
		}).success(function(data) {
			console.log(data);
		});
	};
	Device.prototype.addEventListener = function(eventString) {
		var device = this;
		var eventSubscribeURL = this.baseUrl + "/events"+device.urlTail;
		var source = new EventSource(eventSubscribeURL);
		console.log("adding event: "+eventString+" to Listener");
		source.onopen = function() {
			source.addEventListener(eventString, function(e) {
				console.log(eventString+" fired");
				var data = JSON.parse(e.data);
				$('<li></li>').text(eventString +": " + data.data).appendTo($('#deviceEventsList'));
				$('#deviceEventsList').listview().listview('refresh');
			}, false);
			source.onerror = function() {
				console.log("error on Server Event Stream");
			};
		};
		$('#deviceEventsList').listview().listview('refresh');
	};
	Device.prototype.addButton = function(vals, add) {
		var device = this;
		if ( typeof add === 'undefined') {
			this.buttons.push(vals);
			var json = JSON.stringify(this.buttons);
			console.log(json);
			window.localStorage.setItem('device_' + this.id + '_buttons', json);
		}
		var li = $('<li></li>');
		var button = $('<a></a>').text(vals.buttonName).click(function() {
			device.callFunction(vals.buttonFunctionList, vals.buttonArguments);
			return false;
		}).appendTo(li);
		var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
		li.insertBefore($('#addButtonWrapper'));
		//Edit Button click handler
		edit.click(function() {
			var buttonIndex = li.index();
			var b = device.buttons[buttonIndex - 1];
			$.each(b, function(name, value){
				$('#'+name).val(value);
				$('#addButtonPopup').popup('open');
			});
		});
		li.parent().listview().listview('refresh');
	};
	$.fn.getValues = function() {
		var paramObj = {};
		$.each($(this).serializeArray(), function(_, kv) {
			paramObj[kv.name] = kv.value;
		});
		return paramObj;
	};
})(jQuery);

function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
	    sURLVariables = sPageURL.split('&'),
	    sParameterName,
	    i;

	for ( i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};