(function($) {
	$(document).ready(function() {
		var accessToken = getUrlParameter('access_token');
		var requestURL = 'https://api.particle.io/v1/devices?access_token=' + accessToken;
		$('<ul data-role="listview" id="deviceListView"></ul>').appendTo('body');
		$.get(requestURL, function(e) {
		}).done(function(devices) {
			$.each(devices, function() {
				var device = this;
				var name = device.name == null ? "Unnamed Device" : device.name;
				var li = $("<li></li>");
				li.text(name).appendTo("#deviceListView").attr("id", device.id);
				if (device.connected == true) {
					li.addClass("connected").click(function() {
						window.location.href = 'device.html?deviceid=' + device.id + '&access_token='+accessToken;
					});
				} else {
					//Device not connected
				}
			});
			window.setInterval(function() {
				reloadDevices(requestURL);
			}, 2000);
		});
	});
})(jQuery);

function reloadDevices(url) {
	$.get(url, function() {
	}).done(function(devices) {
		$('#statusLabel').text("Device List Loaded");
		//For Each loop to load each device's information
		$.each(devices, function() {
			var device = this;
			if (device.connected == true) {
				$('#' + device.id).addClass("connected").click(function() {
					window.location.href = 'device.html?deviceid=' + device.id + '&access_token='+accessToken;
				});
			} else {
				//Device not connected so we really dont need to do anything but display it to the user.
				$('#' + device.id).removeClass('connected').unbind();
			}

		});
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

