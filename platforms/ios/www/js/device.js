(function($) {
	$('body').on('pagecontainerchange', function(a, b) {
		console.log(b);

		var page = b.toPage;
		if ( typeof b.absUrl == 'undefined') {
			if (b.options.dataUrl.indexOf('device.html') < 0)
				return;
		} else {
			if (b.absUrl.indexOf('device.html') < 0)
				return;
		}

		page.children().remove();
		console.log("device document ready");
		var accessToken = window.localStorage.getItem('access_token');
		var deviceID = getUrlParameter("deviceid");
		console.log(deviceID);
		var deviceInfoURL = "https://api.particle.io/v1/devices/" + deviceID + "?access_token=" + accessToken;
		//Create header with device name
		var header = $('<h1></h1>').appendTo(page);
		//Create list for holding device attributes(functions, variables, events)
		var deviceAttrList = $('<ul data-role="listview" data-inset="true" id="deviceAttrList"></ul>').appendTo(page);
		$('<li data-role="list-divider" id="deviceAttrList">Functions</li>').appendTo(deviceAttrList);

		$.get(deviceInfoURL, function() {
		}).done(function(deviceInfo) {
			header.text(deviceInfo.name);
			//Register functions in list
			$.each(deviceInfo.functions, function() {
				var deviceFunction = this;
				var functionLI = $("<li></li>").appendTo(deviceAttrList).text(deviceFunction).click(function() {
					var userInput = prompt("Enter function Argument");
					if (userInput) {
						var functionURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + deviceFunction;
						$.post(functionURL, {
							arg : userInput,
							access_token : accessToken
						}, function() {

						}).success(function(data) {
							console.log(data);
						});
					}
				});
			});
			$('#deviceAttrList').listview().listview('refresh');

			//add view for device variables in list
			$('<li data-role="list-divider">Variables</li>').appendTo(deviceAttrList);
			var deviceVariables = deviceInfo.variables;
			for (var key in deviceVariables) {
				var variableLI = $('<li></li>');
				variableLI.appendTo(deviceAttrList).attr("id", deviceID + key);
				var variableRequestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + key + "?access_token=" + accessToken;
				$.get(variableRequestURL, function(deviceVar) {

				}).done(function(deviceVar) {
					var varText = deviceVar.name + ": " + deviceVar.result;
					$("li#" + deviceID + deviceVar.name).text(varText);
					var variableReRequestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + deviceVar.name + "?access_token=" + accessToken;
					window.setInterval(function() {
						reloadDeviceVariables(variableReRequestURL);
					}, 2000);
				}).fail(function() {
					console.log("get for variable failed");
				});
				$('#deviceAttrList').listview().listview('refresh');

			}

			//Add view for device events
			//Register for Server Sent Events
			$('<li data-role="list-divider">Events</li>').appendTo(deviceAttrList);
			$('#deviceAttrList').listview().listview('refresh');
			var eventSubscribeURL = "https://api.particle.io/v1/devices/" + deviceID + "/events?access_token=" + accessToken;
			var source = new EventSource(eventSubscribeURL);
			source.onopen = function() {
				console.log("Server Event stream open");
				source.addEventListener('Input_1', function(e) {
					var data = JSON.parse(e.data);
					console.log("Input 1 action");
					$('<li></li>').text('Input 1: ' + data.data).appendTo(deviceAttrList);
					$('#deviceAttrList').listview().listview('refresh');
				}, false);
				source.addEventListener('RFID', function(e) {
					var data = JSON.parse(e.data);
					$('<li></li>').text('RFID Fob ID: ' + data.data).appendTo(deviceAttrList);
					$('#deviceAttrList').listview().listview('refresh');
				}, false);
				source.addEventListener('Motion', function(e) {
					var data = JSON.parse(e.data);
					$('<li></li>').text('Motion: ' + data.data).appendTo(deviceAttrList);
					$('#deviceAttrList').listview().listview('refresh');
				}, false);
				source.addEventListener('KeyFobAction', function(e) {
					var data = JSON.parse(e.data);
					$('<li></li>').text('KeyFob Event: ' + data.data).appendTo(deviceAttrList);
					$('#deviceAttrList').listview().listview('refresh');
				}, false);
				source.addEventListener('KeepAlive', function(e) {
					var data = JSON.parse(e.data);
					$('<li></li>').text('KeepAlive Event: ' + data.data).appendTo(deviceAttrList);
					$('#deviceAttrList').listview().listview('refresh');
				}, false);
			};
			source.onerror = function() {
				console.log("error on Server Event Stream");
			};
		});
		$('#deviceAttrList').listview().listview('refresh');

	});
})(jQuery);

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

function reloadDeviceVariables(url) {
	var args = url.split("/");
	var deviceID = args[5];
	$.get(url, function(deviceVar) {
		var varText = deviceVar.name + ": " + deviceVar.result;
		$("li#" + deviceID + deviceVar.name).text(varText);
		console.log("reloaded var: " + varText);
	});

}
