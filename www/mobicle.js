(function($) {

    $(document).ready(function() {

        console.log("document ready");
        var ParticleAPI = null;
        var accessToken = window.localStorage.getItem('access_token');

        $('body').on('load_page_index', function(a, b) {
            console.log('index page loaded');
            if ( typeof accessToken == 'undefined' || accessToken == null) {
                console.log("accessToken not found");
                var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
                form.on("submit", function(e) {
                    e.preventDefault();
                    $.post($(this).attr('action'), $(this).serialize(), function(result) {
                        // console.log(result);

                        if ( typeof result.access_token != 'undefined') {
                            window.localStorage.setItem('access_token', result.access_token);
                            //window.location.href = 'deviceList.html';
                            ParticleAPI = new Particle(result.access_token);
                            $('body').pagecontainer('change', 'deviceList.html');
                            window.location.reload(true);
                        } else {
                            console.log('bad login');
                            var invalidLoginDiv = $('<label>Invalid Login</label>');
                            form.append(invalidLoginDiv);
                        }

                    }).fail(function() {
                        console.log('failed login');
                        var invalidLoginDiv = $('<label style="color: red;">Invalid Login. Please try again.</label>');
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
                    console.log('STUPID INTERVALS');
                }, 500);
                //formWrapper.popup('open');

            } else {
                console.log("accessToken found");
                ParticleAPI = new Particle(accessToken);
                var page = window.location.pathname.split('/').pop().replace('.html', '');
                if (window.location.pathname.indexOf('html') < 0 || page === 'index') {
                    console.log("pathname does not contain html");
                    $('body').pagecontainer('change', 'deviceList.html');
                } else {
                    var event = 'load_page_' + page;
                    $('body').trigger(event);
                    console.log(event);
                    $('body').pagecontainer('change', 'deviceList.html');
                }
            }
        });

        $('body').on('load_page_deviceList', function(a, b) {
            ParticleAPI.updateDevices();
            $('#refreshbutton:not(.processed)').addClass('processed').click(function() {
                ParticleAPI.updateDevices();
            });
            $('#logoutbutton:not(.processed)').addClass('processed').click(function() {
                console.log("Logging out");
                window.localStorage.removeItem('access_token');
                window.location.reload(true);
            });

            $('#addEventPublishButton:not(.processed)').addClass('processed').click(function() {
                console.log("addEventPublishButton clicked");
                $('#addEventPublishButtonPopup').popup();
                //Handle form submit
                $('#addEventPublishButtonForm').addClass('addEventPublishButtonForm');
                $('#addEventPublishButtonForm:not(.processed)').addClass('processed').submit(function() {

                    var val = $("input[type=submit][clicked=true]").val();
                    switch(val) {
                    case "submit":
                        console.log("Add Event form submit");
                        var vals = $(this).getValues();
                        ParticleAPI.addEventButton(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "delete":
                        console.log("form delete");
                        var vals = $(this).getValues();
                        ParticleAPI.deleteButton(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "cancel":
                        console.log("form cancel");
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    }

                });
                $('#addEventPublishButtonPopup').popup('open');
            });

            $('#addEventPublishButtonPopup').on('popupafterclose', function() {
                console.log('addEventPublishButtonPopup closed');
                $('[name=buttonName]').val('');
                $('[name=eventName]').val('');
                $('[name=eventData]').val('');
                $('[name=eventTTL]').val('');
            });

            $('#addEventButton:not(.processed)').addClass('processed').click(function() {
                console.log("addEventMonitorButton clicked");

                $('#addEventPopup').popup().css({
                    "padding" : "20px"
                });
                $('#addEventConfirmButton:not(.processed)').addClass('processed').click(function() {
                    console.log('Adding event');
                    ParticleAPI.addEventMonitor($('#eventIDToAdd').val());
                    $('#addEventPopup').popup('close');
                    $('#deviceEventsList').listview().listview('refresh');
                });
                $('#addEventCancelButton:not(.processed)').addClass('processed').click(function() {
                    $('#addEventPopup').popup('close');
                });
                $('#addEventPopup').popup('open');

                // var userInput = prompt("Enter event Argument");
                // //Check to see if user entered anything
                // if (userInput) {
                // device.addEvent(userInput);
                // }
            });

        });

        $('body').on('load_page_device', function(a, b) {
            $('#logoutbutton:not(.processed)').addClass('processed').click(function() {
                console.log("Logging out");
                window.localStorage.removeItem('access_token');
                window.location.reload(true);
            });
            if ( typeof ParticleAPI.updatingDevices !== 'undefined') {
                ParticleAPI.activeRequests.deviceList = false;
                ParticleAPI.updatingDevices.abort();
            }
            console.log('load_page_device');
            //Cancel interval for checking Particle device online status
            if (ParticleAPI.intervals.deviceList != false) {
                console.log("clearing updateDevice interval");
                window.clearTimeout(ParticleAPI.intervals.deviceList);
                ParticleAPI.intervals.deviceList = false;
            }
            var device = ParticleAPI.updateDevice(getUrlParameter('deviceid'));
            console.log(device);
            $('#devicelistbutton').click(function() {
                console.log("deviceListButton");
                if ( typeof device.updateVaraiablesRequest !== 'undefined') {
                    device.updateVaraiablesRequest.abort();
                    window.clearTimeout(device.updateVaraiablesTimeout);
                }
                delete device;
                $('body').pagecontainer('change', 'deviceList.html');
            });

            $('#addButtonButton').click(function() {
                $('#addButtonPopup').popup();
                //Handle form submit
                $('#addButtonForm:not(.processed)').addClass('processed').submit(function() {

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
                $('#addButtonPopup').removeClass('ui-popup-hidden').popup('open');
                console.log("popup called");
                console.log($('#addButtonPopup'));
            });

            device.loaded(function(device) {
                var select = $('#buttonFunctionList');
                select.empty();
                $('#deviceFunctionList li:not([data-role=list-divider])').each(function() {
                    var option = $('<option></option>').text($(this).text()).val($(this).text());
                    select.append(option);
                });
                select.selectmenu();
                select.selectmenu('refresh', true);
                // console.log(select);
                //Handle submit button clicks on forms.  Intercepts prior to form submit
            });
            $('#addButtonPopup').on('popupafterclose', function() {
                console.log("addButtonPopup closed");
                // $('[name=buttonFunctionList]').val('_none');
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
                console.log(event + ' triggered');
                $('body').trigger(event, a, b);
            }
        });

        if ( typeof accessToken == 'undefined' || accessToken == null) {
            console.log("accessToken not found");
            var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
            form.on("submit", function(e) {
                e.preventDefault();
                $.post($(this).attr('action'), $(this).serialize(), function(result) {
                    // console.log(result);

                    if ( typeof result.access_token != 'undefined') {
                        window.localStorage.setItem('access_token', result.access_token);
                        //window.location.href = 'deviceList.html';
                        ParticleAPI = new Particle(result.access_token);
                        $('body').pagecontainer('change', 'deviceList.html');
                        window.location.reload(true);
                    } else {
                        console.log('bad login');
                        var invalidLoginDiv = $('<label style="color: red;">Invalid Login</label>');
                        form.append(invalidLoginDiv);
                    }

                }).fail(function() {
                    console.log('failed login');
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
                console.log('STUPID INTERVALS');
            }, 500);
            //formWrapper.popup('open');

        } else {
            console.log("accessToken found");
            ParticleAPI = new Particle(accessToken);
            var page = window.location.pathname.split('/').pop().replace('.html', '');
            if (window.location.pathname.indexOf('html') < 0 || page === 'index') {
                console.log("pathname does not contain html");
                $('body').pagecontainer('change', 'deviceList.html');
            } else {
                var event = 'load_page_' + page;
                $('body').trigger(event);
                console.log(event);
                // $('body').pagecontainer('change', 'deviceList.html');
            }
        }
        $("[data-role='panel']").panel().trigger("create");
        $("[data-role='header'], [data-role='footer']").toolbar();
        $('#log').listview({
            autodividers : true,
            autodividersSelector : function(elt) {
                return elt.find('.device-name').text() + ' - ' + elt.find('.activity-type').text();
            }
        }).listview('refresh');
    });

    function Particle(accessToken) {
        this.baseUrl = 'https://api.particle.io/v1/';
        this.publishEventBaseUrl = this.baseUrl + 'devices/events';
        this.accessToken = accessToken;
        this.eventMonitor = [];
        this.eventPublish = [];
        this.events = {};
        this.intervals = {
            deviceList : false
        };
        this.activeRequests = {
            deviceList : false
        };
    }


    Particle.prototype.logOut = function() {
        console.log("Logging out");
        window.localStorage.removeItem('access_token');
        window.location.reload(true);
        $.ready();
        // $('body').pagecontainer('change', 'index.html');
    };

    Particle.prototype.updateDevices = function(list) {
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
        console.log("updateDevices");
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
                        // hrefLink.text(device.name);
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
            console.log('oops update devices');
            window.location = window.location;
        });
    };

    Particle.prototype.updateEvents = function() {
        var particle = this;
        var eventButtons = window.localStorage.getItem('event_publish_buttons');
        var eventMonitors = window.localStorage.getItem('event_monitors');

        if (eventButtons) {
            particle.eventPublish = $.parseJSON(eventButtons);
            for (var i = 0; i < particle.eventPublish.length; i++) {
                particle.addEventButton(particle.eventPublish[i], false);
            }
        }

        if (eventMonitors) {
            particle.eventMonitor = $.parseJSON(eventMonitors);
            for (var i = 0; i < particle.eventMonitor.length; i++) {
                particle.addEventMonitor(particle.eventMonitor[i], false);
            }
        }
    };
    Particle.prototype.addEventButton = function(vals, add) {
        console.log(vals);
        var particle = this;
        var id = vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_');

        //Check to see if parent list view has child with this id already.  If so we are editing
        if ($('#eventPublishButtonList').find($('#' + id)).length) {
            //We are editing.
            console.log("editing button");
            //Get instance of old LI so we can replace with the new one
            var oldLI = $('#' + id);
            var newLI = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                particle.publishEvent(vals.eventName, vals.eventData, vals.eventTTL);
                return false;
            }).appendTo(newLI);
            var edit = $('<a></a>').addClass("ui-btn-icon-notext ui-icon-gear").css({
                "width" : "3.5em"
            }).appendTo(newLI);
            //Edit Button click handler
            edit.click(function() {
                var buttonIndex = newLI.index();
                var b = particle.eventPublish[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('[name=' + name + ']').val(value);
                });
                $('#addEventPublishButtonPopup').popup('open');
            });
            var index = oldLI.index() - 1;
            oldLI.replaceWith(newLI);

            this.eventMonitor.splice(index, 1, vals);
            var json = JSON.stringify(this.eventMonitor);
            window.localStorage.setItem('event_publish_buttons', json);
            newLI.parent().listview().listview('refresh');
        } else {
            if ( typeof add === 'undefined') {
                this.eventMonitor.push(vals);
                var json = JSON.stringify(this.eventMonitor);
                window.localStorage.setItem('event_publish_buttons', json);
            }
            var li = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                particle.publishEvent(vals.eventName, vals.eventData, vals.eventTTL);
                return false;
            }).appendTo(li);
            var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
            li.appendTo('#eventPublishButtonList');
            //Edit Button click handler
            edit.click(function() {
                $('#addEventPublishButtonPopup').popup();
                //Handle form submit
                $('#addEventPublishButtonForm:not(.processed)').addClass('processed').submit(function() {

                    var val = $("input[type=submit][clicked=true]").val();
                    switch(val) {
                    case "submit":
                        console.log("form submit");
                        var vals = $(this).getValues();
                        device.addEventButton(vals);
                        console.log(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "delete":
                        console.log("form delete");
                        var vals = $(this).getValues();
                        // device.deleteButton(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "cancel":
                        console.log("form cancel");
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    }

                });
                var buttonIndex = li.index();
                var b = device.buttons[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('[name=' + name + ']').val(value);

                });
                $('#addEventPublishButtonPopup').popup('open');
            });
            li.parent().listview().listview('refresh');
        }
    };
    Particle.prototype.addEventMonitor = function(event, add) {
        console.log('addEventMonitor');
        console.log(add);
        var p = this;
        //Check to see if the event already exists.  If so return
        if ($('#deviceEventsList').find($('#' + event)).length) {
            return;
        }

        if ( typeof add == 'undefined') {
            console.log('saving event monitor');
            //Save the events to the device events array.
            p.events[event] = event;
            p.eventMonitor.push(event);
            var json = JSON.stringify(p.eventMonitor);
            window.localStorage.setItem('event_monitors', json);
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
            timeoutId = setTimeout(function() {
                console.log("On Mouse hold");
                clearTimeout(timeoutId);
                $('#removeEventPopup').popup().css({
                    padding : '20px'
                });
                $('#eventID').text(event);
                $('#removeEventConfirmButton').click(function() {
                    console.log("removing event: " + event);
                    delete p.eventMonitor[event];
                    console.log(p.eventMonitor);
                    $('#' + event).remove();
                    var json = JSON.stringify(p.eventMonitor);
                    window.localStorage.setItem('event_monitors', json);
                    $('#deviceEventsList').listview().listview('refresh');
                    $('#removeEventPopup').popup('close');
                });
                $('#removeEventCancelButton').click(function() {
                    $('#removeEventPopup').popup('close');
                });
                $('#removeEventPopup').popup('open');

            }, 500);
        }).bind('mouseup mouseleave', function() {
            clearTimeout(timeoutId);
        });

        ul.listview().listview('refresh');
        $('#deviceEventsList').listview().listview('refresh');

        //Add the listener for the event
        p.addEventListener(event);
    };

    Particle.prototype.addEventListener = function(eventString) {
        //TODO finish this.
        console.log("Particle.addEventListener");
        console.log(this.accessToken);
        var particle = this;
        var eventSubscribeURL = this.baseUrl + "devices/events?access_token=" + this.accessToken;
        var source = new EventSource(eventSubscribeURL);
        source.onopen = function() {
            source.addEventListener(eventString, function(e) {
                console.log(eventString + " fired");
                var data = JSON.parse(e.data);
                $('<li></li>').text(eventString + ": " + data.data).appendTo($('#' + eventString + 'list'));
                $('#' + eventString + ' h2 a').text(eventString + ' - Last Reported Value: ' + data.data);
                $('#' + eventString + 'list').listview().listview('refresh');
                logEntry('Global', 'event', eventString + ': ' + data.data);
            }, false);
        };
        source.onerror = function() {
            console.log("error on Server Event Stream");
        };
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
            console.log("Function Return: " + data);
        });
    };

    Particle.prototype.removeEventPublishButton = function(vals) {
        //Get instance of device object
        var particle = this;
        console.log("Delete Button function");
        console.log(vals);
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
        this.eventButtons = [];
        this.events = {};
        this.functions = [];
        currentDevice = this;
        this.updateVaraiablesTimeout
        this.updateVaraiablesRequest
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
        $.ajax({
            timeout : 2000,
            url : this.baseUrl + this.urlTail
        }).done(function(data) {
            $('#pagetitle').text(data.name);
            device.data = null;
            device.data = data;
            device.updateFunctions();
            device.updateVariables();
            device.updateEvents();
            //window.localStorage.setItem('device_'+device.id+'_buttons','');
            var buttons = window.localStorage.getItem('device_' + device.id + '_buttons');
            if (buttons) {
                device.buttons = $.parseJSON(buttons);
                for (var i = 0; i < device.buttons.length; i++) {
                    device.addButton(device.buttons[i], false);
                }
            }
            var events = window.localStorage.getItem('device_' + device.id + '_events');
            if (events) {
                device.events = $.parseJSON(events);
                console.log(events);
                for (i in device.events) {
                    device.addEvent(i, false);
                }
                // for (var i = 0; i < device.events.length; i++) {
                //
                // if ($('#deviceEventsList').find($('#'+device.events[i])).length) {
                // }else{
                // device.addEvent(device.events[i], false);
                // }
                //
                // }
            }
            device.loaded();
            console.log('loaded called');
        }).fail(function() {
            window.location = window.location;
            device.update();
        });
    };

    Device.prototype.updateFunctions = function() {
        var device = this;
        $('#deviceFunctionList li:not([data-role=list-divider])').remove();
        $.each(this.data.functions, function(key, func) {
            device.functions.push(func);

            var functionLI = $("<li></li>").appendTo($('#deviceFunctionList')).text(func).attr('id', func).click(function() {
                $('#callFunctionPopup').popup().css({
                    "padding" : "20px"
                });
                $('#callFunctionConfirm:not(.processed)').addClass('processed').click(function() {
                    device.callFunction(func, $('#functionArgument').val());
                    $('#callFunctionPopup').popup('close');
                });
                $('#callFunctionCancel:not(.processed)').addClass('processed').click(function() {
                    $('#callFunctionPopup').popup('close');
                });
                $('#callFunctionPopup').popup('open');

                // var userInput = prompt("Enter function Argument");
                // if (userInput) {
                // device.callFunction(func, userInput);
                // }
            });
        });
        $('#deviceFunctionList').listview().listview('refresh');
    };

    Device.prototype.updateVariables = function() {
        var device = this;
        $.each(this.data.variables, function(key, value) {
            //Make sure the variable is not already in the list
            if (!$('#deviceVariablesList').find($('#' + device.id + key)).length) {
                $('<li></li>').appendTo($('#deviceVariablesList')).attr("id", device.id + key);
            }
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
        device.updateVaraiablesRequest = $.ajax({
            timeout : 10000,
            url : device.baseUrl + "/" + key + device.urlTail
        }).done(function(data) {
            // console.log($("li#" + device.id + data.name));
            $("li#" + device.id + data.name).text(data.name + ": " + data.result);
            logEntry(device.data.name, 'variable', data.name + ': ' + data.result);
            device.updateVaraiablesTimeout = window.setTimeout(function() {
                device.updateVariable(key);
            }, 10000);
        }).fail(function() {
            device.updateVaraiablesTimeout = window.setTimeout(function() {
                device.updateVariable(key);
            }, 10000);
        });

    };
    Device.prototype.updateEvents = function() {
        var device = this;
        $('#addEventButton:not(.processed)').addClass('processed').click(function() {

            $('#addEventPopup').popup().css({
                "padding" : "20px"
            });
            $('#addEventConfirmButton:not(.processed)').addClass('processed').click(function() {
                console.log('Adding event');
                device.addEvent($('#eventIDToAdd').val());
                $('#addEventPopup').popup('close');
                $('#deviceEventsList').listview().listview('refresh');
            });
            $('#addEventCancelButton:not(.processed)').addClass('processed').click(function() {
                $('#addEventPopup').popup('close');
            });
            $('#addEventPopup').popup('open');

            // var userInput = prompt("Enter event Argument");
            // //Check to see if user entered anything
            // if (userInput) {
            // device.addEvent(userInput);
            // }
        });
        $('#deviceEventsList').listview().listview('refresh');
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
        console.log(vals);
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
                window.localStorage.setItem('device_' + this.id + '_buttons', json);
            }
            var li = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                device.callFunction(vals.buttonFunctionList, vals.buttonArguments, this);
                return false;
            }).appendTo(li);
            var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
            li.appendTo('#deviceButtonList');
            //Edit Button click handler
            edit.click(function() {
                $('#addButtonPopup').popup();
                $('#addButtonForm:not(.processed)').addClass('processed').submit(function() {
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
                var buttonIndex = li.index();
                var b = device.buttons[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('#addButtonPopup').attr("data-history", "false").popup();
                    $('[name=' + name + ']').val(value);

                });
                $('#addButtonPopup').popup('open');
            });
            li.parent().listview().listview('refresh');
        }

    };

    Device.prototype.addEventButton = function(vals, add) {
        console.log(vals);
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
                device.publishEvent(vals.eventName, vals.eventData, vals.eventTTL);
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
                    $('[name=' + name + ']').val(value);
                });
                $('#addEventPublishButtonPopup').popup('open');
            });
            var index = oldLI.index() - 1;
            oldLI.replaceWith(newLI);

            this.eventButtons.splice(index, 1, vals);
            var json = JSON.stringify(this.eventButtons);
            window.localStorage.setItem('device_' + this.id + '_eventButtons', json);
            newLI.parent().listview().listview('refresh');
        } else {
            if ( typeof add === 'undefined') {
                this.buttons.push(vals);
                var json = JSON.stringify(this.buttons);
                window.localStorage.setItem('device_' + this.id + '_buttons', json);
            }
            var li = $('<li></li>').attr("id", id);
            var button = $('<a></a>').text(vals.buttonName).click(function() {
                device.publishEvent(vals.eventName, vals.eventData, vals.eventTTL);
                return false;
            }).appendTo(li);
            var edit = $('<a></a>').text('edit').addClass("ui-btn-icon-notext ui-icon-gear").appendTo(li);
            li.appendTo('#deviceButtonList');
            //Edit Button click handler
            edit.click(function() {
                $('#addEventPublishButtonPopup').popup();
                //Handle form submit
                $('#addEventPublishButtonForm:not(.processed)').addClass('processed').submit(function() {

                    var val = $("input[type=submit][clicked=true]").val();
                    switch(val) {
                    case "submit":
                        console.log("form submit");
                        var vals = $(this).getValues();
                        // device.publishEvent(vals);
                        console.log(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "delete":
                        console.log("form delete");
                        var vals = $(this).getValues();
                        // device.deleteButton(vals);
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    case "cancel":
                        console.log("form cancel");
                        $('#addEventPublishButtonPopup').popup('close');
                        return false;
                        break;
                    }

                });
                var buttonIndex = li.index();
                var b = device.buttons[buttonIndex - 1];
                $.each(b, function(name, value) {
                    $('[name=' + name + ']').val(value);

                });
                $('#addEventPublishButtonPopup').popup('open');
            });
            li.parent().listview().listview('refresh');
        }

    };

    Device.prototype.deleteButton = function(vals) {
        //Get instance of device object
        var device = this;
        console.log("Delete Button function");
        console.log(vals);
        //Get instance of LI parent before deleting
        var liParent = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).parent();
        //Get index of LI so we can reference that index in the buttons array
        var liIndex = $('#' + vals.buttonName.replace(/[^0-9a-zA-Z]/g, '_')).index() - 1;
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
})(jQuery);
function logEntry(d, t, v) {
    $('#log').prepend('<li><span class="device-name" style="display:none;">' + d + '</span><span class="activity-type" style="display:none;">' + t + '</span><span class="activity-value">' + v + '</span></li>').listview('refresh');
}

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

/*
 {"prevPage":{"0":{},"length":1},
 "toPage":{"0":{"jQuery111307613389508333057":238},"length":1},
 "options":{
 "type":"get",
 "reloadPage":false,
 "reload":false,
 "showLoadMsg":true,
 "loadMsgDelay":50,
 "reverse":true,
 "changeHash":false,
 "fromHashChange":true,
 "allowSamePageTransition":false,
 "hash":"#/Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html",
 "url":"file:///Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html",
 "title":"My Devices","transition":"fade","pageUrl":"/Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html",
 "direction":"back","fromPage":{"0":{},"length":1},
 "target":"file:///Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html",
 "deferred":{},"absUrl":"file:///Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html"},

 "absUrl":"file:///Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html"
 }2015 - 11 - 06 09:06:59.529 Mobicle[13693:641408] b.absUrl: file:///Users/travis/Library/Developer/CoreSimulator/Devices/EDDC1A37-2E21-4729-8D5A-5A3516BA1CC6/data/Containers/Bundle/Application/2C93ED4B-102D-4356-A619-9F4A56BF780E/Mobicle.app/www/deviceList.html
 */