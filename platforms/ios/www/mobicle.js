(function($) {
    var mobileReady = function() {
        var ParticleAPI = null;
        var accessToken = window.localStorage.getItem('access_token');
        $('body').on('load_page_about', function(e, page, url) {
            $('#pagetitle').text('About Mobicle');
        });
        $('body').on('load_page_index', function(e, page, url) {
            ParticleAPI.updateDevices();
            $('#refreshbutton:not(.processed)').addClass('processed').click(function() {
                ParticleAPI.updateDevices();
            });
            
            var eventSubscribeURL = ParticleAPI.baseUrl + "devices/events?access_token=" + ParticleAPI.accessToken;
            ParticleAPI.allEvents(eventSubscribeURL);
            $('#addEventPublishButton:not(.processed)').addClass('processed').click(function() {
                $('#addEventPublishButtonPopup').popup();
                //Handle form submit
                $('#addEventPublishButtonForm').addClass('addEventPublishButtonForm');
                $('#addEventPublishButtonForm:not(.processed)').addClass('processed').submit(function() {
                    if ($("input[type=submit][clicked=true]", this).val() == 'submit')
                        ParticleAPI.addEventButton($(this).getValues());
                    $('#addEventPublishButtonPopup').popup('close');
                    return false;
                });
                $('#addEventPublishButtonPopup').popup('open');
            });

            $('#addEventPublishButtonPopup').on('popupafterclose', function() {
                $('[name=buttonName]').val('');
                $('[name=eventName]').val('');
                $('[name=eventData]').val('');
                $('[name=eventTTL]').val('');
            });

            $('#addEventButton:not(.processed)').addClass('processed').click(function() {
                $('#addEventPopup').popup().css({
                    "padding" : "20px"
                });
                $('#addEventMonitor:not(.processed)').addClass('processed').submit(function(){
                    if ($("input[type=submit][clicked=true]", this).val() == 'submit'){
                        ParticleAPI.addEventMonitor($(this).getValues());
                    }
                    $('#addEventPopup').popup('close');
                    $('#deviceEventsList').listview().listview('refresh');
                    return false;
                });
                $('#addEventPopup').popup('open');
            });

        });

        $('body').on('load_page_device', function(e, page, url) {
            //TODO: move particle cleanup to some type of unload hook
            if ( typeof ParticleAPI.updatingDevices !== 'undefined') {
                ParticleAPI.activeRequests.deviceList = false;
                ParticleAPI.updatingDevices.abort();
            }

            //Cancel interval for checking Particle device online status
            if (ParticleAPI.intervals.deviceList != false) {
                window.clearTimeout(ParticleAPI.intervals.deviceList);
                ParticleAPI.intervals.deviceList = false;
            }
            // if(isset(ui)){
                // console.log(ui);
                // var url=$(ui.toPage).attr('data-url');
                // console.log(url);
                // console.log(getUrlParameter('deviceid', url));
            // }
            var device = ParticleAPI.updateDevice(getUrlParameter('deviceid', url), page);
            var eventSubscribeURL = ParticleAPI.baseUrl + "devices/"+device.id+"/events?access_token=" + ParticleAPI.accessToken;
            console.log(eventSubscribeURL);
            ParticleAPI.allEvents(eventSubscribeURL);
            if (!$(device.page).hasClass('processed')) {
                $('.addButtonPopup', device.page).popup();
                $('.addButtonPopup', device.page).on('popupafterclose', function() {
                    // $('[name=buttonFunctionList]').val('_none');
                    $('[name=buttonName]', device.page).val('');
                    $('[name=buttonArguments]', device.page).val('');
                });
                $('.addButtonButton', device.page).click(function() {
                    //Handle form submit
                    // $('[name=buttonFunctionList] option').eq(1).prop('selected', true);
                    $('[name="buttonFunctionList"]', device.page).val($('[name="buttonFunctionList"] option', device.page).eq(1).val()).selectmenu("refresh");
                    $('.addButtonPopup', device.page).removeClass('ui-popup-hidden').popup('open');
                });
                $('.addButtonForm', device.page).submit(function() {
                    var op = $("input[type=submit][clicked=true]", this).val();
                    var vals = $(this).getValues();
                    switch(op) {
                    case "submit":
                        device.addButton(vals);
                        break;
                    case "delete":
                        device.deleteButton(vals);
                        break;
                    }
                    $('.addButtonPopup', device.page).popup('close');
                    return false;
                });
            }
            device.loaded(function(device) {
                var select = $('select.buttonFunctionList', device.page);
                $('.deviceFunctionList li:not([data-role=list-divider])', device.page).each(function() {
                    var option = $('<option></option>').text($(this).text()).val($(this).text());
                    select.append(option);
                });
                select.selectmenu().selectmenu('refresh', true);
                $(device.page).addClass('processed');
                // console.log(select);
                //Handle submit button clicks on forms.  Intercepts prior to form submit
            });

        });
        $('body').pagecontainer({
            show : function(e, ui) {
                var url=ui.toPage[0].baseURI;
                var page = url.replace(/\?.*/, '').split('/').pop().replace('.html', '');
                if (page == ''){
                    page = 'index';
                }
                if (page.length > 0) {
                    $('body').trigger('load_page_' + page, [ui.toPage, url]);
                }
            },
            beforechange: function(e, ui){
                $('body').trigger('pageunload');
            }
        });

        if ( typeof accessToken == 'undefined' || accessToken == null) {
            var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
            form.on("submit", function(e) {
                e.preventDefault();
                $.post($(this).attr('action'), $(this).serialize(), function(result) {
                    if ( typeof result.access_token != 'undefined') {
                        window.localStorage.setItem('access_token', result.access_token);
                        //window.location.href = 'deviceList.html';
                        ParticleAPI = new Particle(result.access_token);
                        $('body').pagecontainer('change', '/');
                        window.location.reload(true);
                    } else {
                        var invalidLoginDiv = $('<label style="color: red;">Invalid Login</label>');
                        form.append(invalidLoginDiv);
                    }

                }).fail(function() {
                    var invalidLoginDiv = $('<label>Invalid Login. Please try again.</label>');
                    form.append(invalidLoginDiv);
                });
                return false;
            });
            form.append('<input type="hidden" name="client_id" value="particle">').append('<input type="hidden" name="client_secret" value="particle">').append('<input type="hidden" name="grant_type" value="password">').append('<label for="username">Particle Account Email:</label>').append('<input type="email" name="username" id="username"></input>').append('<label for="password">Particle Account Password:</label>').append('<input type="password" name="password" id="password"></input>').append('<input type="submit" value="Sign In"></input>');

            var loginHeader = $('<div></div>').css({
                'text-align' : 'center'
            });
            var particleLogo = $('<img src="img/particle.png" style="width:200px;height:200px;"></img>').appendTo(loginHeader);

            var formWrapper = $('<div id="loginWrapper"></div>').css({
                padding : '20px'
            }).append(loginHeader).append(form);
            //$('body').pagecontainer('getActivePage').empty();
            //$.mobile.activePage.append(formWrapper);
            formWrapper.appendTo($('body').pagecontainer('getActivePage'));
            //formWrapper.trigger('create');

            form.trigger('create');
            intCount = 0;
            formWrapper.popup({
                dismissible : false
            });
            var formint = window.setInterval(function() {
                if (!formWrapper.parent().hasClass('ui-popup-hidden') || intCount > 20) {
                    window.clearInterval(formint);
                } else {
                    formWrapper.popup('open');
                    intCount++;
                }
            }, 500);
            //formWrapper.popup('open');

        } else {
            ParticleAPI = new Particle(accessToken);
            var page = window.location.pathname.split('/').pop().replace('.html', '');
            if (page == '')
                page = 'index';
            $('body').trigger('load_page_' + page, [$('body').pagecontainer( "getActivePage" )]);
        }
        $("[data-role='panel']").panel().trigger("create");
        $("[data-role='header'], [data-role='footer']").toolbar();
        $('#log').listview({
            autodividers : true,
            autodividersSelector : function(elt) {
                return elt.find('.device-name').text() + ' - ' + elt.find('.activity-type').text();
            }
        }).listview('refresh');

        $('#logoutbutton').click(function() {
            window.localStorage.clear();
            window.location.reload(true);
        });
    };
    $(document).ready(function() {
        if ( typeof window.isphone !== 'undefined')
            return;
        window.isphone = false;
        if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
            window.isphone = true;
        }

        if (window.isphone) {
            document.addEventListener("deviceReady", mobileReady, false);
        } else {
            $('a[href="index.html"]').attr('href', '/');
            window.setTimeout(mobileReady, 50);

        }
    });
    function Particle(accessToken) {
        this.baseUrl = 'https://api.particle.io/v1/';
        this.publishEventBaseUrl = this.baseUrl + 'devices/events';
        this.accessToken = accessToken;
        //TODO change eventMonitor to object Array.
        //eventMonitor Object properties = {id(String), notify(String), notifyVar(String)}
        this.eventMonitor = [];
        this.eventPublish = [];
        // this.events = {};
        this.eventSource = false;
        this.intervals = {
            deviceList : false
        };
        this.activeRequests = {
            deviceList : false
        };
        this.eventListeners = {};
        this.devices = {};
    }


    Particle.prototype.on = function(e, c) {
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        this.eventListeners[e].push(c);
    };
    Particle.prototype.off = function(e, c) {
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        this.eventListeners[e] = $.grep(this.eventListeners[e], function(v) {
            return (v !== c);
        });
    };
    Particle.prototype.trigger = function() {
        var args = [];
        var e = arguments[0];
        var retVal = true;
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        for (var i in arguments)
        	if (i !== 0)
            	args.push(arguments[i]);
        $.each(this.eventListeners[e], function(i,f) {
        	// console.log(f);
            if (f.apply(this, args) === false)
                retVal = false;
        });
        return retVal;
    };
    Particle.prototype.logOut = function() {
        window.localStorage.removeItem('access_token');
        window.location.reload(true);
        $.ready();
    };

    Particle.prototype.updateDevices = function(list) {
        $('#pagetitle').text('Device List');
        var ParticleAPI = this;
        if (ParticleAPI.activeRequests.deviceList === true)
            return;
        $('#overlay').css({
            display : 'block'
        });
        $.mobile.loading("show", {
            text : "loading...",
            textVisible : true,
            theme : $.mobile.loader.prototype.options.theme,
            textonly : false,
            html : ""
        });
        var devices = null;
        //window.clearTimeout(ParticleAPI.intervals.deviceList);
        ParticleAPI.activeRequests.deviceList = true;
        ParticleAPI.updatingDevices = $.ajax({
            timeout : 2000,
            url : this.baseUrl + 'devices?access_token=' + this.accessToken
        }).done(function(devices) {
            if (ParticleAPI.activeRequests.deviceList !== true)
                return;
            $.each(devices, function() {
                var device = this;
                var li = $('#' + device.id);

                //New Device
                if (li.length == 0) {
                    var name = device.name == null ? "Unnamed Device" : device.name;
                    var li = $("<li></li>").appendTo("#deviceListView").attr("id", device.id);
                }

                //Device is not connected
                if (!device.connected) {
                    li.text(device.name);
                    if (li.children('a').length) {
                        li.empty().removeClass('connected');
                    }
                }
                //Device is connected
                else {
                    if (!li.children('a').length) {
                        li.text('');
                        var hrefLink = $('<a href= device.html?deviceid=' + device.id + '>' + device.name + '</a>').addClass('ui-btn ui-btn-icon-right ui-icon-carat-r');
                        // hrefLink.click(function() {
                            // if(ParticleAPI.eventSource){
                                // ParticleAPI.eventSource.close();
                                // ParticleAPI.eventSource = false;
                            // }
                        // });
                        hrefLink.text(device.name);
                        li.append(hrefLink).removeClass('ui-li-static').removeClass('ui-body-inherit').addClass('connected');
                    }
                }
            });
            $('#deviceListView').listview().listview('refresh');
            ParticleAPI.activeRequests.deviceList = false;
            $('#overlay').css({
                display : 'none'
            });
            $.mobile.loading("hide");
            ParticleAPI.updateEvents();
            // ParticleAPI.intervals.deviceList = window.setTimeout(function(){
            // ParticleAPI.updateDevices();
            // }, 2000);
        }).fail(function() {
            window.location = window.location;
        });
    };

    Particle.prototype.updateEvents = function() {
        $('#addEventPublishButtonPopup').popup();
        this.initStorage('eventPublish', 'event_publish_buttons', 'addEventButton');
        this.initStorage('eventMonitor', 'event_monitors', 'addEventMonitor');
    };

    Particle.prototype.initStorage = function(prop, store, method) {
        var tmp=this[prop];
        if (this[prop] = window.localStorage.getItem(store)) {
            this[prop] = $.grep($.parseJSON(this[prop]), function(v) {
                return v !== false;
            });
            for(var i in this[prop]) this[method](i, false);
            this.trigger(prop + '_loaded', this[prop]);
        }else{
            this[prop]=tmp;
        }
    };

    Particle.prototype.addEventButton = function(vals, i) {
        var particle = this;
        if ( typeof vals !== "object") {
            if (isset(particle.eventPublish[vals])) {
                i = vals;
                vals = particle.eventPublish[vals];
            } else
                return;
        } else if ( typeof i === 'undefined') {
            i = this.eventPublish.length;
            this.eventPublish.push(vals);
            var json = JSON.stringify(this.eventPublish);
            window.localStorage.setItem('event_publish_buttons', json);
        }

        //Check to see if parent list view has child with this id already.  If so we are editing
        var li = $('#eventPublishButtonList li[data-button-index="' + i + '"]');
        if (li.length) {
            //We are editing.

            li.find('a.publisher').text(vals.buttonName).attr('data-eventName', vals.eventName).attr('data-eventData', vals.eventData).attr('data-eventTTL', vals.eventTTL);

            this.eventPublish[i] = vals;

            var json = JSON.stringify(this.eventPublish);

            window.localStorage.setItem('event_publish_buttons', json);

        } else {
            var li = $('<li></li>').attr("data-button-index", i);
            var button = $('<a></a>').text(vals.buttonName).attr('data-eventName', vals.eventName).attr('data-eventData', vals.eventData).attr('data-eventTTL', vals.eventTTL).click(function() {
                particle.publishEvent($(this).attr('data-eventName'), $(this).attr('data-eventData'), $(this).attr('eventTTL'));
                return false;
            }).appendTo(li).addClass('publisher');
            var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li).addClass('edit').click(function() {
                $('#addEventPublishButtonForm:not(.processed)').addClass('processed').submit(function() {
                    var op = $("input[type=submit][clicked=true]").val();
                    switch(op) {
                    case "submit":
                        particle.addEventButton($(this).getValues(), i);
                        break;
                    case "delete":
                        li.remove();
                        particle.eventPublish[i] = false;
                        break;
                    }
                    $('#addEventPublishButtonPopup').popup('close');
                    return false;
                });
                $.each(vals, function(n, v) {
                    $('#addEventPublishButtonForm [name=' + n + ']').val(v);

                });
                $('#addEventPublishButtonPopup').popup('open');
            });
            $('#eventPublishButtonList').append(li);
            li.parent().listview().listview('refresh');
        }
    };

    Particle.prototype.addEventMonitor = function(i, add) {
    	//This came from initStorage
        if(typeof(i) !== 'object'){
        	var event = this.eventMonitor[i];
        	console.log(event);
        }
        //This came from add new event popup.
        else{
        	var event = {};
			event.id = i.eventID;
			event.notify = i.checkboxNotify;
			event.notifyVar = i.notificationVar;
        } 

		
		if (event.notify == "on") {
			var notifyHandler = function(e, event, value) {
				console.log('value: '+value);
				console.log('event: '+event);
				if (value == event.notifyVar) {
					//trigger notification
					if (window.isphone) {
						cordova.plugins.notification.local.schedule({
							id : 1,
							text : event.id+": "+event.notifyVar
						});
					}
				}
			};
			this.off('eventFire', notifyHandler);
			this.on('eventFire', notifyHandler);
		}

        var p = this;
        //Check to see if the event already exists.  If so return
        if ($('#deviceEventsList li[data-event-index="'+i+'"]').length) return;

        if ( typeof add == 'undefined') {
            //Save the events to the device events array.
            // p.events[event] = event;
            //TODO check this to be sure it still works after eventMonitor converted to Object Array.
            p.eventMonitor.push(event);
            var json = JSON.stringify(p.eventMonitor);
            console.log('json strigified eventMonitor: ');
            console.log(json);
            window.localStorage.setItem('event_monitors', json);
        }
        //Create the li an list view for the new event
        var collapsibleli = $('<li data-role="collapsible" data-iconpos="right" data-shadow="false" class ="ui-collapsible ui-collapsible-inset ui-collapsible-themed-content ui-collapsible-collapsed" data-corners="false"></li>').css({
            "padding" : "0px"
        }).attr('data-event-index', i).attr('data-event-id', event.id);

        var h2 = $('<h2 class="ui-collapsible-heading" data-corners="false"></h2>').text(event.id).css('margin', '0px').appendTo(collapsibleli);

        var ul = $('<ul data-role="listview" data-corners="false"></ul>').attr("id", event.id + "-list").listview();
        collapsibleli.append(ul).appendTo($('#deviceEventsList')).collapsible({
            refresh : true
        });
        var pHeight = h2.parent().height();
        h2.height(pHeight);

        //On hold listener for delete
        var timeoutId = 0;

        collapsibleli.mousedown(function() {
            timeoutId = setTimeout(function() {
                clearTimeout(timeoutId);
                $('#removeEventPopup').popup().css({
                    padding : '20px'
                });
                $('#eventID').text(event.id);
                $('#removeEventForm').submit(function() {
                    if($("input[type=submit][clicked=true]", this).val() == 'remove'){
                        
                        p.eventMonitor[i]=false;
                        collapsibleli.remove();
                        //TODO check to make sure this still works after eventMonitor is converted to an object array
                        var json = JSON.stringify(p.eventMonitor);
                        console.log('json strigified eventMonitor: ');
            			console.log(json);
                        window.localStorage.setItem('event_monitors', json);
                        $('#deviceEventsList').listview().listview('refresh');
                    }
                    $('#removeEventPopup').popup('close');
                    return false;
                });
                $('#removeEventPopup').popup('open');

            }, 500);
        }).bind('mouseup mouseleave', function() {
            clearTimeout(timeoutId);
        });

        ul.listview().listview('refresh');
        $('#deviceEventsList').listview().listview('refresh');

        //Add the listener for the event
        p.addEventListener(i);
    };

    Particle.prototype.initializeEvents = function() {
        
        var particle=this;
        
        for (var i in this.eventMonitor) {
        	//TODO change eventString to reference eventMonitor object id property.
            var eventString = this.eventMonitor[i].id;
            this.eventSource.addEventListener(eventString, function(e){
                Particle.prototype.eventHandler.call(particle, e);
                
            }, false);
        }
    };
    Particle.prototype.eventHandler=function(e){
    	console.log('eventHandler');
    	console.log(e);
        var eventStrings={};
        var event;
        //TODO change eventString to reference eventMonitor object id property.
        for(i in this.eventMonitor){
        	eventStrings[this.eventMonitor[i].id]=i;
        	event = this.eventMonitor[i];
        	console.log(this.eventMonitor[i]);
        } 
        var eventString = e.type;
        var i=eventStrings[eventString];
        var data = JSON.parse(e.data);
        //Create li to add to collapsable list view
        $('<li></li>').text(eventString + ": " + data.data).appendTo($('#' + eventString + '-list'));
        //Update header row text for collapsable list view
        $('#deviceEventsList li[data-event-index="'+i+'"] h2 a').text(eventString + ' - Last Reported Value: ' + data.data);
        $('#deviceEventsList li[data-event-index="'+i+'"] list').listview().listview('refresh');
        logEntry('Global', 'event', eventString + ': ' + data.data);
        this.trigger('eventFire', event, data.data);
    };
    Particle.prototype.addEventListener = function(i) {
    	//TODO change eventString to reference eventMonitor object id property.
    	console.log(i);
    	var eventString=i.id;
        var particle = this;

        //create event source object if it does not exist already
        if (!particle.eventSource) {
            var eventSubscribeURL = this.baseUrl + "devices/events?access_token=" + this.accessToken;
            particle.eventSource = new EventSource(eventSubscribeURL);
            particle.eventSource.onopen = function() {
                particle.initializeEvents();
            };
            particle.eventSource.onerror = function() {
            };
        } else if (particle.eventSource.readyState == 1) {
            this.eventSource.addEventListener(eventString, function(e){
                particle.eventHandler.call(particle, e);
            }, false);
        }

        $('#deviceEventsList').listview().listview('refresh');
    };

    Particle.prototype.publishEvent = function(eventName, eventData, eventTTL) {
        //publishEventBaseUrl

        var particle = this;
        $.post(particle.publishEventBaseUrl, {
            name : eventName,
            data : eventData,
            private : 'true',
            ttl : eventTTL,
            access_token : particle.accessToken
        }).success(function(data) {
        });
    };

    Particle.prototype.removeEventPublishButton = function(vals) {
        //Get instance of device object
        var particle = this;
        //Get instance of LI parent before deleting
        var liParent = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).parent();
        //Get index of LI so we can reference that index in the buttons array
        var liIndex = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).index() - 1;
        //Remove the LI from the view
        $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).remove();
        //Remove button from array
        particle.eventPublish.splice(liIndex, 1);
        //Save array
        var json = JSON.stringify(particle.eventPublish);
        window.localStorage.setItem('event_publish_buttons', json);
        //refresh button list view
        liParent.listview().listview('refresh');
    };

    Particle.prototype.updateDevice = function(deviceID, page) {
        if (!isset(this.devices[deviceID])) {
            this.devices[deviceID] = new Device(this, deviceID);
        }
        this.devices[deviceID].update(page);
        return this.devices[deviceID];
    };

    function Device(api, did) {
        this.api = api;
        this.id = did;
        this.baseUrl = this.api.baseUrl + 'devices/' + this.id;
        this.urlTail = "?access_token=" + this.api.accessToken;
        this._loaded = [];
        this.isLoaded = false;
        this.buttons = [];
        this.eventButtons = [];
        // this.events = {};
        this.functions = [];
        this.variables = [];
        currentDevice = this;
        this.updateVaraiablesTimeout;
        this.updateVaraiablesRequest;
        this.stop=false;
        var device=this;
        $('body').on('pageunload', function(){
           device.stop=true;
           if(isset(device.updateVariablesRequest)) device.updateVariablesRequest.abort();
           window.clearTimeout(device.updateVaraiablesRequest);
        });
        this.isnew = true;
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

    Device.prototype.update = function(page) {
        var device = this;
        device.page=page;
        this.stop=false;
        $('#overlay').css({
            display : 'block'
        });
        $.mobile.loading("show", {
            text : "loading...",
            textVisible : true,
            theme : $.mobile.loader.prototype.options.theme,
            textonly : false,
            html : ""
        });

        $.ajax({
            timeout : 2000,
            url : this.baseUrl + this.urlTail
        }).done(function(data) {
            $('#pagetitle').text(data.name);
            device.data = data;
            device.updateFunctions();
            device.updateVariables();
            //window.localStorage.setItem('device_'+device.id+'_buttons','');
            var buttons = window.localStorage.getItem('device_' + device.id + '_buttons');
            if (buttons) {
                device.buttons = $.parseJSON(buttons);
                for (var i = 0; i < device.buttons.length; i++) {
                    device.addButton(device.buttons[i], false);
                }
            }
            device.loaded();
            $('#overlay').css({
                display : 'none'
            });
            $.mobile.loading("hide");
        }).fail(function() {
            // window.location = window.location;
            // device.update();
            $('body').pagecontainer('change', '/');
            $('#overlay').css({
                display : 'none'
            });
            $.mobile.loading("hide");
        });
    };

    Device.prototype.updateFunctions = function() {
        var device = this;
        $('.deviceFunctionList li:not([data-role=list-divider])', device.page).remove();
        
        $.each(this.data.functions, function(key, func) {
            device.functions.push(func);

            var functionLI = $("<li></li>").appendTo($('.deviceFunctionList', device.page)).text(func).attr('id', func).click(function() {
            	var f=$('.callFunctionPopup', device.page).attr('data-device-function');
            	if(f!==func){
            		$('[name = "functionArgument"]', device.page).val('');
            		$('.callFunctionPopup', device.page).attr('data-device-function', func);
            	}
            	
                $('.callFunctionPopup', device.page).popup().css({
                    "padding" : "20px"
                });
                $('.callFunctionPopup', device.page).popup('open');
            });
            
        });
        $('.callFunctionConfirm:not(.processed)', device.page).addClass('processed').click(function() {
        	var f=$('.callFunctionPopup', device.page).attr('data-device-function');
            device.callFunction(f, $('[name = "functionArgument"]', device.page).val());
            $('.callFunctionPopup', device.page).popup('close');
        });
        $('.callFunctionCancel:not(.processed)', device.page).addClass('processed').click(function() {
            $('.callFunctionPopup', device.page).popup('close');
        });
        $('.deviceFunctionList', device.page).listview().listview('refresh');
    };

    Device.prototype.updateVariables = function() {
        var device = this;
        var hasVars=false;
        for(var i in this.data.variables) {
            hasVars=true;
            this.variables.push(i);
            var id = this.id + i;
            if (!$('.deviceVariablesList', device.page).find($('#' + id)).length) {
                $('<li id="' + id + '"></li>').appendTo($('.deviceVariablesList', device.page));
            }
        }

        if(hasVars) this.updateVariable(0);

        $('.deviceVariablesList', device.page).listview().listview('refresh');

    };
    Device.prototype.updateVariable = function(i, to) {
        var device = this;
        var timeout = ($('.deviceVariablesList', device.page).find($('#' + device.id + device.variables[i])).length<1) ? 10 : 3000;

        device.updateVaraiablesRequest = $.ajax({
            timeout : 3000,
            url : device.baseUrl + "/" + device.variables[i] + device.urlTail
        }).done(function(data) {
            if($("li#" + device.id + data.name).length<1) return;
            $("li#" + device.id + data.name).text(data.name + ": " + data.result);
            if(device.stop) return;
            device.updateVaraiablesTimeout = window.setTimeout(function() {
                var newI = (device.variables.length - 1) == i ? 0 : i + 1;
                device.updateVariable(newI);
            }, timeout);
        }).fail(function() {
            if(device.stop) return;
            device.updateVaraiablesTimeout = window.setTimeout(function() {
                device.updateVariable(i);
            }, timeout);
        });

    };

    Device.prototype.callFunction = function(f, v, el) {
        var device = this;
        $.post(this.baseUrl + "/" + f, {
            arg : v,
            access_token : device.api.accessToken
        }).success(function(data) {
            logEntry(device.data.name, 'function call', f + ': ' + data.return_value);
            if ( typeof el !== 'undefined') {
                $(el).text($(el).parent().attr('id') + '  -  Last Response: ' + data.return_value);
            }
        });
    };

    Device.prototype.addButton = function(vals, add) {
        var device = this;
        var id = vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_');

        //Check to see if parent list view has child with this id already.  If so we are editing
        if ($('.deviceButtonList', device.page).find($('#' + id)).length) {
            //We are editing.
            //Get instance of old LI so we can replace with the new one
            var oldLI = $('#' + id);
            var newLI = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                device.callFunction(vals.buttonFunctionList, vals.buttonArguments, this);
                return false;
            }).appendTo(newLI);
            var edit = $('<a></a>').addClass("ui-btn-icon-notext ui-icon-gear").css({
                "width" : "3.5em"
            }).appendTo(newLI);
            //Edit Button click handler
            edit.click(function() {
                var buttonIndex = newLI.index();
                var b = device.buttons[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('[name=' + name + ']', device.page).val(value);
                });
                $('.addButtonPopup', device.page).popup('open');
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
                window.localStorage.setItem('device_' + this.id + '_buttons', json);
            }
            var li = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                device.callFunction(vals.buttonFunctionList, vals.buttonArguments, this);
                return false;
            }).appendTo(li);
            var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
            li.appendTo('.deviceButtonList', device.page);
            //Edit Button click handler
            $('#addButtonPopup').popup();
            edit.click(function() {
                var buttonIndex = li.index();
                var b = device.buttons[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('.addButtonPopup', device.page).attr("data-history", "false").popup();
                    $('[name=' + name + ']', device.page).val(value);

                });
                $('.addButtonPopup', device.page).popup('open');
            });
            li.parent().listview().listview('refresh');
        }

    };
    Device.prototype.deleteButton = function(vals) {
        //Get instance of device object
        var device = this;
        //Get instance of LI parent before deleting
        var liParent = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_'), device.page).parent();
        //Get index of LI so we can reference that index in the buttons array
        var liIndex = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_'), device.page).index() - 1;
        //Remove the LI from the view
        $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_'), device.page).remove();
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
    jQuery.fn.live = function(events, data, callback) {
        if ( typeof callback === 'undefined') {
            callback = data;
            data = {};
        }
        jQuery(document).on(events, jQuery(this).selector, data, callback);
    };
    $("form input[type=submit]").live('click', function() {
        $("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr("clicked", "true");
    });
    
    Particle.prototype.allEvents=function(url){
        var lastEvent='';
        var oReq = new XMLHttpRequest();
                var event={};
        oReq.onreadystatechange = function(){
            if(this.readyState>2){
                var recent=this.responseText.replace(lastEvent, '');
                lastEvent=this.responseText;
                var parts=recent.split("\n");
                for(var i=0;i<parts.length;i++){
                    if(parts[i].indexOf("event:") == 0) event.type = parts[i].replace('event:', '').trim();
                    else if(parts[i].indexOf("data:") == 0){
                        event.data = parts[i].replace('data:', '').trim();
                        console.log(event);
                    }
                }
            }
        };
        oReq.open('get', url, true);
        oReq.send();
    };
    
})(jQuery);
function logEntry(d, t, v) {
    $('#log').prepend('<li><span class="device-name" style="display:none;">' + d + '</span><span class="activity-type" style="display:none;">' + t + '</span><span class="activity-value">' + v + '</span></li>').listview('refresh');
}

function isset(v) {
    return ( typeof v !== 'undefined');
}

function getUrlParameter(sParam, url) {
    var url = isset(url)?'?'+url.split('?').pop():window.location.search;
    var sPageURL = decodeURIComponent(url.substring(1)),
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