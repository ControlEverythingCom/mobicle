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

(function($) {
	$(document).ready(function() {
		console.log("index document ready");
		
		// if(typeof window.localStorage == 'undefined'){
			// console.log('running on browser');
			// window.localStorage={
				// getItem: function(name){
					// Cookies.getItem(name);
				// },
				// setItem: function(name, variable){
					// Cookies.setItem(name, variable);
				// }
			// };
		// }else{
			// console.log('running on cordova app');
		// }		
		
		var accessToken = window.localStorage.getItem('access_token');

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
		} else {
			window.location.href = '/deviceList.html';
		}
	});
})(jQuery);

function signInSubmit(e) {
	console.log('signInSubmit');
	e.preventDefault();
	$.post($(this).attr('action'), $(this).serialize(), function(result) {
		console.log(result);
		if ( typeof result.access_token != 'undefined') {
			window.localStorage.setItem('access_token', result.access_token);
			window.location.href = 'deviceList.html';
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