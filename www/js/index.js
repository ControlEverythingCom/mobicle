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

// console.log=function(m){
// var $=jQuery;
// var log=$('#console');
// if(log.length==0){
// var log=$('<div></div>');
// log.attr('id', 'console');
// log.css({position:'fixed', bottom:0, width:'100%', height:'30%', overflow:'auto', background:'white'});
// $('body').append(log);
// }
// var message_wrapper=$('<div class="message"></div>');
// message_wrapper.text(JSON.stringify(m));
// log.append(message_wrapper);
// log.scrollTo(log.innerHeight());
// }

function popup() {
	var $ = jQuery;
	$.post("https://api.particle.io/oauth/token", {
		client_id : 'particle',
		client_secret : 'particle',
		grant_type : 'password',
		username : 'travis@controlanything.com',
		password : 'Spunky11'
	}, function() {
		console.log("Post request sent");
	}).success(function(data) {
		console.log(data);
		var output = '';
		output += '<li>' + "Success" + '</li>';
		$('#deviceList').append(output).listview('refresh');
	}).error(function(data) {
		console.log("POST request error");
	});
}

(function($) {
	$(document).ready(function() {
		$.post("https://api.particle.io/oauth/token", {
			client_id : 'particle',
			client_secret : 'particle',
			grant_type : 'password',
			username : 'travis@controlanything.com',
			password : 'Spunky11'
		}, function() {
			console.log("Post request sent");
		}).success(function(data) {
			$('#statusLabel').text("Getting Device List");
			accessToken = data.access_token;
			console.log(accessToken);
			var requestURL = 'https://api.particle.io/v1/devices?access_token=' + accessToken;

			$.get(requestURL, function() {
			}).done(function(devices) {
				$('#statusLabel').text("Device List Loaded");
				console.log(devices);
				$.each(devices, function() {
					var device = this;
					var name = device.name == null ? "Unnamed Device" : device.name;
					var li = $("<li></li>");
					li.text(name).appendTo("#deviceList");
					if(device.connected == true){
						li.addClass("connected").click(function(){
							$('#listOfDevices').css({display:"none"});
							$('#deviceView').css({display:"block"});
							$('#deviceNameHeader').text(device.name);
							var deviceInfoURL = "https://api.particle.io/v1/devices/"+device.id+"?access_token="+accessToken;
							$.get(deviceInfoURL, function(){
								
							}).done(function(deviceInfo){
								$.each(deviceInfo.functions, function(){
									var deviceFunction = this;
									var functionLI = $("<li></li>");
									functionLI.text(deviceFunction).appendTo('#deviceFunctionList').click(function(){
										var userInput = prompt("Enter function Argument");
										if(userInput){
											var functionURL = "https://api.particle.io/v1/devices/"+device.id+"/"+deviceFunction;
											$.post(functionURL,{
												arg:userInput,
												access_token:accessToken
											}, function(){
												
											}).success(function(data){
												console.log(data);
											});
										}
									});
								});
							}).fail(function(){
								console.log("Failed to load device info");
							});
						});
					}

				});

				console.log(devices);
			}).fail(function() {
				$('#statusLabel').text("Error loading Device List");
			});
			$.get(requestURL, function(data) {

			});

		}).error(function(data) {
			console.log("POST request error");
			$('#statusLabel').text("Error Connecting to Server");
		});
	});
})(jQuery);

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
