(function($) {

	$(document).ready(function() {
		console.log("document ready");
		var ParticleAPI = null;
		var accessToken = window.localStorage.getItem('access_token');
		
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
			console.log("accessToken found");
			ParticleAPI = new Particle(accessToken);
			var page = window.location.pathname.split('/').pop().replace('.html', '');
			if (window.location.pathname.indexOf('html') < 0 || page === 'index') {
				console.log("pathname does not contain html");
				$('body').pagecontainer('change', 'deviceList.html');
			} else {
				
				console.log(page);
				var event = 'load_page_'+page;
				console.log(event);
				$('body').trigger(event);
				// $('body').pagecontainer('change', 'deviceList.html');
			}
		}

		$('body').on('load_page_deviceList', function(a, b) {
			ParticleAPI.updateDevices();
			$('#logoutbutton').click(ParticleAPI.logOut);
			if(!Particle.intervals.deviceList){
				Particle.intervals.deviceList = window.setInterval(ParticleAPI.updateDevices(), 2000);
			}
			
		});

		$('body').on('load_page_device', function(a, b) {
			//Cancel interval for checking Particle device online status
			if(Particle.intervals.deviceList != false){
				window.clearInterval(Particle.intervals.deviceList);
				Particle.intervals.deviceList = false;
			}
			var device = ParticleAPI.updateDevice(getUrlParameter('deviceid'));
			$('#devicelistbutton').click(function() {
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
 				//Handle submit button clicks on forms.  Intercepts prior to form submit
				$("form input[type=submit]").click(function() {
					$("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
					$(this).attr("clicked", "true");
				});

				//Handle form submit
				$('#addButtonForm').submit(function() {

					var val = $("input[type=submit][clicked=true]").val();
					switch(val) {
					case "submit":
						console.log("form submit");
						var vals = $(this).getValues();
						device.addButton(vals);
						$('#addButtonPopup').popup('close');
						return false;
						break;
					case "delete":
						console.log("form delete");
						var vals = $(this).getValues();
						device.deleteButton(vals);
						$('#addButtonPopup').popup('close');
						return false;
						break;
					case "cancel":
						console.log("form cancel");
						$('#addButtonPopup').popup('close');
						return false;
						break;
					}

				});
			});
			$('#addButtonPopup').on('popupafterclose', function() {
				$('[name=buttonFunctionList]').val('_none');
				$('[name=buttonName]').val('');
				$('[name=buttonArguments]').val('');
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

		
	});

	function Particle(accessToken) {
		this.baseUrl = 'https://api.particle.io/v1/';
		this.accessToken = accessToken;
		this.intervals = {deviceList:false};
	}


	Particle.prototype.logOut = function() {
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
		this.events = [];
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
			var events = window.localStorage.getItem('device_'+device.id+'_events');
			console.log(events);
			console.log(device.id);
			if(events){
				device.events = $.parseJSON(events);
				console.log(device.events);
				for(var i = 0; i < device.events.length; i++){
					device.addEvent(device.events[i], false);
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
				if (userInput){
					device.callFunction(func, userInput);
				}
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
		$('#addEventButton').click(function() {
			var userInput = prompt("Enter event Argument");
			//Check to see if user entered anything
			if (userInput) {
				device.addEvent(userInput);
			}
		});
		$('#deviceEventsList').listview().listview('refresh');
	};

	Device.prototype.addEvent = function(event, add) {
		console.log("adding event: "+event);
		var device = this;
		//Check to see if the event already exists.  If so return
		if($('#deviceEventsList').find($('#event')).length){
			console.log("event already added");
			return;
		}

		if ( typeof add == 'undefined') {
			//Save the events to the device events array.
			device.events.push(event);
			var json = JSON.stringify(device.events);
			window.localStorage.setItem('device_' + device.id + '_events', json);
			console.log("saved: ");
			console.log(window.localStorage.getItem('device_' + device.id + '_events'));
		}
		//Create the li an list view for the new event
		var collapsibleli = $('<li data-role="collapsible" data-iconpos="right" data-shadow="false" class ="ui-collapsible ui-collapsible-inset ui-collapsible-themed-content ui-collapsible-collapsed" data-corners="false"></li>').css({
			"padding" : "0px"
		}).attr("id", event);

		var h2 = $('<h2 class="ui-collapsible-heading" data-corners="false"></h2>').text(event).css('margin', '0px').appendTo(collapsibleli);

		var ul = $('<ul data-role="listview" data-corners="false"></ul>').attr("id", event + "list").listview();
		collapsibleli.append(ul).appendTo($('#deviceEventsList')).collapsible({
			refresh : true
		});
		var pHeight = h2.parent().height();
		h2.height(pHeight);
		
		//On hold listener for delete
		var timeoutId = 0;

		collapsibleli.mousedown(function() {
			timeoutId = setTimeout(function(){
				console.log("On Mouse hold");
				clearTimeout(timeoutId);
				var r = window.confirm("Remove "+ event+" Monitor?");
				if(r){
					console.log("removing event");
					var index = $('#'+event).index() -1;
					console.log(index);
					$('#'+event).remove();
					device.events.splice(index, 1);
					console.log(device.events);
					var json = JSON.stringify(device.events);
					console.log(json);
					window.localStorage.setItem('device_' + device.id + '_events', json);
					$('#deviceEventsList').listview().listview('refresh');
				}
			}, 1000);
		}).bind('mouseup mouseleave', function() {
			clearTimeout(timeoutId);
		}); 

		
		ul.listview().listview('refresh');
		$('#deviceEventsList').listview().listview('refresh');

		//Add the listener for the event
		device.addEventListener(event);
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
		var eventSubscribeURL = this.baseUrl + "/events" + device.urlTail;
		var source = new EventSource(eventSubscribeURL);
		console.log("adding event: " + eventString + " to Listener");
		source.onopen = function() {
			source.addEventListener(eventString, function(e) {
				console.log(eventString + " fired");
				var data = JSON.parse(e.data);
				$('<li></li>').text(eventString + ": " + data.data).appendTo($('#'+eventString+'list'));
				$('#'+eventString+'list').listview().listview('refresh');
			}, false);
			source.onerror = function() {
				console.log("error on Server Event Stream");
			};
		};
		$('#deviceEventsList').listview().listview('refresh');
	};
	Device.prototype.addButton = function(vals, add) {
		var device = this;
		var id = vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_');

		//Check to see if parent list view has child with this id already.  If so we are editing
		if ($('#deviceButtonList').find($('#' + id)).length) {
			//We are editing.
			console.log("editing button");
			//Get instance of old LI so we can replace with the new one
			var oldLI = $('#' + id);
			var newLI = $('<li></li>').attr("id", id);
			var button = $('<a></a>').text(vals.buttonName).click(function() {
				device.callFunction(vals.buttonFunctionList, vals.buttonArguments);
				return false;
			}).appendTo(newLI);
			var edit = $('<a></a>').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(newLI);
			//Edit Button click handler
			edit.click(function() {
				var buttonIndex = newLI.index();
				var b = device.buttons[buttonIndex - 1];
				$.each(b, function(name, value) {
					$('[name=' + name + ']').val(value);
					$('#addButtonPopup').popup('open');
				});
			});
			var index = oldLI.index() - 1;
			oldLI.replaceWith(newLI);

			this.buttons.splice(index, 1, vals);
			var json = JSON.stringify(this.buttons);
			window.localStorage.setItem('device_' + this.id + '_buttons', json);
			newLI.parent().listview().listview('refresh');
		} else {
			if ( typeof add === 'undefined') {
				this.buttons.push(vals);
				var json = JSON.stringify(this.buttons);
				console.log(json);
				window.localStorage.setItem('device_' + this.id + '_buttons', json);
			}
			var li = $('<li></li>').attr("id", id);
			var button = $('<a></a>').text(vals.buttonName).click(function() {
				device.callFunction(vals.buttonFunctionList, vals.buttonArguments);
				return false;
			}).appendTo(li);
			var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
			li.appendTo('#deviceButtonList');
			//Edit Button click handler
			edit.click(function() {

				var buttonIndex = li.index();
				var b = device.buttons[buttonIndex - 1];
				$.each(b, function(name, value) {
					$('[name=' + name + ']').val(value);
					$('#addButtonPopup').popup('open');
				});
			});
			li.parent().listview().listview('refresh');
		}

	};
	Device.prototype.deleteButton = function(vals) {
		//Get instance of device object
		var device = this;
		console.log("Delete Button function");
		//Get instance of LI parent before deleting
		var liParent = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).parent();
		console.log(liParent);
		//Get index of LI so we can reference that index in the buttons array
		var liIndex = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).index() - 1;
		console.log(liIndex);
		//Remove the LI from the view
		$('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).remove();
		//Remove button from array
		device.buttons.splice(liIndex, 1);
		//Save array
		var json = JSON.stringify(this.buttons);
		window.localStorage.setItem('device_' + this.id + '_buttons', json);
		//refresh button list view
		liParent.listview().listview('refresh');
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