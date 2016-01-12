(function($){
    function mobileReady(){
        var UI=new ParticleUI(API());
        UI.init();
    }
    $(document).ready(function() {
        if ( typeof window.isphone !== 'undefined')
            return;
        window.isphone = (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1);
        if (window.isphone) {
            document.addEventListener("deviceReady", mobileReady, false);
        } else {
            $('a[href="index.html"]').attr('href', '/');
            window.setTimeout(mobileReady, 50);
        }
    });
    
    
    ParticleUI=function(api){
        this.api=api;
        this.devices={};
        this.initialized={};
    };
    ParticleUI.prototype.init=function(){
        var UI=this;
        $('body').pagecontainer({
            show : function(e, ui) {
                UI.pageLoad(ui.toPage.attr('id'), ui.toPage[0].baseURI);
            },
            beforechange: function(e, ui){
                $('body').trigger('pageunload');
            }
        });
        
        if(!this.api.accessToken){
            this.login();
        }else{
            var page = window.location.hash.split('#').pop() || 'home';
            this.pageLoad(page, window.location.pathname+window.location.search);
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
            UI.api.storage.clear();
            window.location.reload(true);
        });
    };
    ParticleUI.prototype.pageLoad=function(page, url){
        var method='load'+ucfirst(page);
        var page=$('body').pagecontainer( "getActivePage" );
        page.attr('data-url', url);
        if(this[method]){
            this[method](url);
        }
    };
    ParticleUI.prototype.loadAbout=function(){
        $('#pagetitle').text('About Mobicle');
    };
    ParticleUI.prototype.loadHome=function(){
        var ui=this;
        var api=this.api;
        var page=$('body').pagecontainer( "getActivePage" );
        if(!$(page).find('[data-role="content"]').hasClass('processed')){
            this.api.on({
                'deviceFetch': function(e, device){
                    console.log('test');
                    if(isset(ui.devices[device.id])){
                        if(ui.devices[device.id].connected!=device.connected){
                            if(device.connected){
                                ui.devices[device.id].ui.removeClass('titleWrapper').addClass('connected').html('<a href="?deviceid=' + device.id + '#device">' + name + '</a>');
                            }else{
                                ui.devices[device.id].ui.removeClass().addClass('titleWrapper').html('');
                            }
                        };
                    }else{
                        var name=device.name || 'Unnamed Device';
                        ui.devices[device.id]=device;
                        var html={
                            _type: 'li',
                            id: device.id,
                            classes: ['titleWrapper'],
                        };
                        if(device.connected){
                            html.classes=['connected', 'ui-btn', 'ui-btn-icon-right', 'ui-icon-carat-r'];
                            html.a={_type:'a', href: '?deviceid=' + device.id + '#device', _content: name, classes:['titleWrapper']};
                        }
                        ui.devices[device.id].ui=api.theme.render(html, $("#deviceListView"));
                        ui.devices[device.id].ui.setTitle=function(newDevice){
                            if(ui.devices[device.id].ui.is('.titleWrapper')) ui.devices[device.id].ui.text(newDevice.name || 'Unnamed Device');
                            else ui.devices[device.id].ui.find('.titleWrapper').text(newDevice.name || 'Unnamed Device');
                        };
                    }
                    ui.devices[device.id].ui.setTitle(device);
                    $('#deviceListView').listview().listview('refresh');
                },
                
                'eventsFetchAll eventsFetchDevice': function(e, event){
                    //console.log(data);
                    if(!isset(event)) return;
                    var collapsibleli = $('#deviceEventsList li[data-event-name="' + event.name + '"][data-event-device="' + event.data.coreid + '"]');
                    
                    if(collapsibleli.length==0){
                        var lihtml = {
                            _type: 'collapsibleLi',
                            css: {padding: '0px'},
                            'data-event-name': event.name,
                            'data-event-device': event.data.coreid,
                            'data-corners': "false",
                            h2:{
                                _type: 'h2',
                                css: {margin: '0px'},
                                classes: ['ui-collapsible-heading'],
                                'data-corners': "false",
                                _content: event.name + ' - Last Reported Value: ' + event.data.data
                            },
                            ul:{
                                _type: 'ul',
                                'data-corners': "false",
                                id: event.name,
                                row: {
                                    _type: 'li',
                                    _content: event.name + ": " + event.data.data
                                }
                            }
                        };
                        collapsibleli=api.theme.render(lihtml, $('#deviceEventsList'));
                        var h2=collapsibleli.find('h2');
                        h2.height(h2.parent().height());
                    }else{
                        $('<li></li>').text(event.name + ": " + event.data.data).appendTo(collapsibleli.find('ul'));
                        collapsibleli.find('h2 a').text(event.name + ' - Last Reported Value: ' + event.data.data);
                    }
                    
                    collapsibleli.find('ul').listview().listview('refresh');
                    $('#deviceEventsList').listview().listview('refresh');
                }
            });
            $(page).find('[data-role="content"]').addClass('processed');
        }
        
        //TODO: Finish event publisher
        $('#refreshbutton').off().click(function() {
            api.updateDevices();
            api.updateEvents();
        }).click();  
    };
    ParticleUI.prototype.loadDevice=function(url){
        var api=this.api;
        var deviceID = getUrlParameter('deviceid', url);
        var page=$('body').pagecontainer( "getActivePage" );
        if(!$(page).hasClass('processed')){
            $('.addButtonPopup', page).popup();
            $('.addButtonPopup', page).on('popupafterclose', function() {
                $('[name=buttonName]', page).val('');
                $('[name=buttonArguments]', page).val('');
            });
            $('.addButtonButton', page).click(function() {
                $('[name="buttonFunctionList"]', page).val($('[name="buttonFunctionList"] option', page).eq(1).val()).selectmenu("refresh");
                $('.addButtonPopup', page).removeClass('ui-popup-hidden').popup('open');
            });
            $('.addButtonForm', page).submit(function() {
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
                $('.addButtonPopup', page).popup('close');
                return false;
            });
            
            api.on('deviceFetch', function() {
                
                var device=api.devices[deviceID];
                if(!isset(device)) return;
                device.page=page;
                device.updateFunctions();
                
                var select = $('select.buttonFunctionList', page);
                $('.deviceFunctionList li:not([data-role=list-divider])', page).each(function() {
                    var option = $('<option></option>').text($(this).text()).val($(this).text());
                    select.append(option);
                });
                select.selectmenu().selectmenu('refresh', true);
            });
            $(page).addClass('processed');
        }
        $('#refreshbutton').off().click(function() {
            api.updateDevice(deviceID);
            api.updateEvents(deviceID);
        }).click();
    };
    ParticleUI.prototype.login=function(){
        var api=this.api;
        var formWrapper = api.theme.render(this.loginForm(), $('body').pagecontainer('getActivePage'));
        
        var form=formWrapper.find('form');
        
        var failed=function(){
            if($('#login_failed').length==0){
                api.theme.render({_type:'label', id:'login_failed', _content:'Invalid Login. Please try again.'}, form);
            }
            $('#login_failed').shake();
        };
        
        api.on('tokenCreate', function(e, data){
            if(!isset(data.access_token)) return failed();
            window.location.reload(true);
        }).on('tokenCreate_fail', failed);
        
        formWrapper.popup({
            dismissible : false
        });
        
        intCount = 0;
        var formint = window.setInterval(function() {
            if (!formWrapper.parent().hasClass('ui-popup-hidden') || intCount > 20) {
                window.clearInterval(formint);
            } else {
                formWrapper.popup('open');
                intCount++;
            }
        }, 500);
    };
    ParticleUI.prototype.loginForm=function(){
        var api=this.api;
        return {
            _type: 'div',
            id: 'loginWrapper',
            css: {padding:'20px'},
            loginHeader:{
                _type: 'div',
                css: {textAlign:'center'},
                banner: {
                    _type: 'img',
                    src: 'img/particle.png',
                    css: {width:'200px',height:'200px'}
                }
            },
            loginForm:{
                _type: 'form',
                username: {
                    _type: 'input',
                    _label: 'Username'
                },
                password: {
                    _type: 'password',
                    _label: 'Password'
                },
                submit: {
                    _type: 'submit'
                },
                cancel: {
                    _type: 'submit',
                    value: 'Cancel'
                },
                events: {
                    submit: function(e){
                        e.preventDefault();
                        api.logIn($(this).find('#username').val(), $(this).find('#password').val());
                    }
                }
            }
        };
    };
    Device.prototype.addButton=function(vals, add){
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
            this.api.storage.set('device_'+this.id+'_buttons', this.buttons);
            newLI.parent().listview().listview('refresh');
        } else {
            if ( typeof add === 'undefined') {
                this.buttons.push(vals);
                this.api.storage.set('device_'+this.id+'_buttons', this.buttons);
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
    Device.prototype.updateFunctions = function() {
        var device = this;
        $('.deviceFunctionList li:not([data-role=list-divider])', device.page).remove();
        
        for(var key in this.functions){
            var func=this.functions[key];
            console.log([key, func]);
            var functionLI = $("<li></li>").appendTo($('.deviceFunctionList', device.page)).text(func).attr('id', func).click(function() {
                var f=$('.callFunctionPopup', device.page).attr('data-device-function');
                var func=$(this).attr('id');
                if(f!==func){
                    console.log([f, func]);
                    $('[name = "functionArgument"]', device.page).val('');
                    $('.callFunctionPopup', device.page).attr('data-device-function', func);
                }
                
                $('.callFunctionPopup', device.page).popup().css({
                    "padding" : "20px"
                });
                $('.callFunctionPopup', device.page).popup('open');
            });
            
        };
        $('.callFunctionConfirm:not(.processed)', device.page).addClass('processed').click(function() {
            var f=$('.callFunctionPopup', device.page).attr('data-device-function');
            device.api.do('functionCall', {device_id: device.id, function_name: f, arg: $('[name = "functionArgument"]', device.page).val()});
            $('.callFunctionPopup', device.page).popup('close');
        });
        $('.callFunctionCancel:not(.processed)', device.page).addClass('processed').click(function() {
            $('.callFunctionPopup', device.page).popup('close');
        });
        $('.deviceFunctionList', device.page).listview().listview('refresh');
    };
})(jQuery);
