/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var button = $('<button></button>');

function reloadDeviceVariables(url) {
	var args = url.split("/");
	var deviceID = args[5];
	console.log("Device ID: " + deviceID);
	$.get(url, function(deviceVar) {
		var varText = deviceVar.name + ": " + deviceVar.result;
		$("li#" + deviceID + deviceVar.name).text(varText);
		console.log(varText);
	});
}

function reloadDevices(url) {
	$.get(url, function() {
	}).done(function(devices) {
		$('#statusLabel').text("Device List Loaded");
		//For Each loop to load each device's information
		$.each(devices, function() {
			var device = this;
			if (device.connected == true) {
				$('#' + device.id).addClass('connected');
			} else {
				//Device not connected so we really dont need to do anything but display it to the user.
				$('#' + device.id).removeClass('connected');
			}

		});
	}).fail(function() {
		$('#statusLabel').text("Error loading Device List");
	});
	$.get(url, function(data) {

	});
}

(function($) {
	$(document).ready(function() {
		console.log("document ready");
		var accessToken = window.localStorage.getItem("access_token");
		if ( typeof accessToken == 'undefined' || accessToken == null) {
			console.log("accessToken not found");
			var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
			form.on("submit", signInSubmit);
			$('<input type="hidden" name="client_id" value="particle">').appendTo(form);
			$('<input type="hidden" name="client_secret" value="particle">').appendTo(form);
			$('<input type="hidden" name="grant_type" value="password">').appendTo(form);
			$('<label for="username">Email:</label>').appendTo(form);
			$('<input type="email" name="username" id="username"></input>').appendTo(form);
			$('<label for="password">Password:</label>').appendTo(form);
			$('<input type="password" name="password" id="password"></input>').appendTo(form);
			$('<input type="submit" value="Sign In"></input>').appendTo(form);
			form.appendTo('body');
		}else{
			window.location.href = 'deviceList.html?access_token='+accessToken+'&';
		}
	});
})(jQuery);

function signInSubmit(e){
	console.log('signInSubmit');
	e.preventDefault();
	$.post($(this).attr('action'), $(this).serialize(), function(result){
		console.log(result);
		if(typeof result.access_token != 'undefined'){
			//Cookies.set("access_token", result.access_token);
			// window.localStorage.setItem('access_token', result.access_token);
			var url = 'deviceList.html?access_token='+result.access_token+'&';
			console.log(url);
			window.location.href = url;
		}
	});
}

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

(function($) {
	$(document).on("mobileinit", function() {
		console.log("jQuery Mobile init");
	});
})(jQuery);
