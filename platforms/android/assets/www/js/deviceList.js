(function($) {
	$(document).ready(function() {
		console.log("deviceList document ready");
		var accessToken = window.localStorage.getItem('access_token');

		var requestURL = 'https://api.particle.io/v1/devices?access_token=' + accessToken;
		var listView = $('<ul data-role="listview" id="deviceListView" data-inset="true"></ul>').appendTo('body');
		$('<li data-role="list-divider">Devices</li>').appendTo(listView);
		$.get(requestURL, function(e) {
		}).done(function(devices) {
			$.each(devices, function() {
				var device = this;
				var name = device.name == null ? "Unnamed Device" : device.name;
				var li = $("<li></li>").appendTo("#deviceListView").attr("id", device.id);
				if (device.connected == true) {
					var hrefLink = '<a href= device.html?deviceid=' + device.id + '>' + name + '</a>';
					li.append(hrefLink);
				} else {
					//Device not connected
					li.text(name);
				}
				listView.listview().listview('refresh');
			});
			window.setInterval(function() {
				reloadDevices(requestURL, accessToken);
			}, 2000);
		});
		listView.listview().listview('refresh');
	});
})(jQuery);

function reloadDevices(url, accessToken) {
	$.get(url, function() {
	}).done(function(devices) {
		//For Each loop to load each device's information
		$.each(devices, function() {
			var device = this;

			//No device in list so create it
			if ( typeof $('#' + device.id) == 'undefined') {
				var name = device.name == null ? "Unnamed Device" : device.name;
				var li = $("<li></li>").appendTo("#deviceListView").attr("id", device.id);
			}

			if (device.connected == true) {

				if ($('#' + device.id + ' a').length>0) {
					
					//Do nothing.
				} else {
					var listItem = $('#' + device.id);
					var hrefLink = '<a href= device.html?deviceid=' + device.id + '>' + '</a>';
					listItem.text(device.name);
					listItem.append(hrefLink);
				}

			}
			//Device Not connected
			else {
				//Device not connected so we really dont need to do anything but display it to the user.
				$('#' + device.id + ' a').removeAttr("href");
				$('#' + device.id).text(device.name);
			}
		});
		$('#deviceListView').listview().listview('refresh');
	}).fail(function() {
		$('#statusLabel').text("Error loading Device List");
	});
	$.get(url, function(data) {

	});
}

var getUrlParameter = function getUrlParameter(sParam) {
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

var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicitly call 'app.receivedEvent(...);'
	onDeviceReady : function() {
		app.receivedEvent('deviceready');
		(function($) {
			console.log("deviceReady");
		})(jQuery);
	},
	// Update DOM on a Received Event
	receivedEvent : function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		listeningElement.setAttribute('style', 'display:none;');
		receivedElement.setAttribute('style', 'display:block;');

		console.log('Received Event: ' + id);
	}
};

