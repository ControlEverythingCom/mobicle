(function($) {
    
    $(document).ready(function(){
        var currentDevice=null;
        var ParticleAPI=null;
        var accessToken = window.localStorage.getItem('access_token');
        
        $('body').on('load_page_deviceList', function(a, b){
            ParticleAPI.updateDevices();
        });
        
        $('body').on('load_page_device', function(a, b){
            ParticleAPI.updateDevice(getUrlParameter('deviceid'));
        });
        
        $('body').on('load_page_addButton', function(a, b){
            var select=$('#buttonFunctionList');
            $('#deviceFunctionList li:not([data-role=list-divider])').each(function(){
               $('<option></option>').text($(this).text()).val($(this).text()).appendTo(select);
            });
            $('#addButtonForm').submit(function(){
                var vals=$(this).getValues();
                var li=$('<li></li>');
                var button=$('<a></a>').text(vals.buttonName).click(function(){
                    currentDevice.callFunction(vals.buttonFunctionList, vals.buttonArguments);
                    return false;
                });
                button.before($('#addButtonWrapper'));
               return false; 
            });
            
        });
        $('body').pagecontainer({change:function(a,b){
            if(typeof b.absUrl == 'undefined'){
                var url=b.options.dataUrl;
            }else{
                var url=b.absUrl;
            }
            var l = document.createElement("a");
            l.href = url;
            var page=l.pathname.split('/').pop().replace('.html','');
            var event='load_page_'+page;
            
            $('body').trigger(event, a, b);
            console.log(event+' triggered');
        }});

        if ( typeof accessToken == 'undefined' || accessToken == null) {
            console.log("accessToken not found");
            var form = $('<form name="signInForm" id="signInForm" action="https://api.particle.io/oauth/token" method="POST"></form>');
            form.on("submit", function(e){
                e.preventDefault();
                $.post($(this).attr('action'), $(this).serialize(), function(result) {
                    console.log(result);
                    if ( typeof result.access_token != 'undefined') {
                        window.localStorage.setItem('access_token', result.access_token);
                        //window.location.href = 'deviceList.html';
                        
                        ParticleAPI=new Particle(result.access_token);
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
            ParticleAPI=new Particle(accessToken);
            if(window.location.pathname.indexOf('html')<0){
                $('body').pagecontainer('change', 'deviceList.html');
            }else{
                var page=window.location.pathname.split('/').pop().replace('.html','');
                var event='load_page_'+page;
                $('body').trigger(event);
            }
        }
    });
    
    function Particle(accessToken){
        this.baseUrl='https://api.particle.io/v1/';
        this.accessToken=accessToken;
    }
    Particle.prototype.updateDevices=function(list){
        var devices = null;
        $.get(this.baseUrl + 'devices?access_token=' + this.accessToken).done(function(devices){
            $.each(devices, function() {
                var device = this;
                var li = $('#' + device.id);
                //No device in list so create it
                if (li.length==0) {
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
        }).fail(function(){
            $('#statusLabel').text("Error loading Device List");
        });
    };
    Particle.prototype.updateDevice=function(deviceID){
        var device=new Device(this, deviceID);
        device.update();
    };
    
    function Device(api, did){
        this.api=api;
        this.id=did;
        this.baseUrl=this.api.baseUrl + 'devices/'+this.id;
        this.urlTail="?access_token="+this.api.accessToken;
        currentDevice=this;
    }
    Device.prototype.update=function(){
        var device=this;
        console.log(this.baseUrl+this.urlTail);
        $.get(this.baseUrl+this.urlTail).done(function(data){
            $('#deviceName').text(data.name);
            device.data=data;
            device.updateFunctions();
            device.updateVariables();
            device.updateEvents();
        });
    };
    Device.prototype.updateFunctions=function(){
        var device=this;
        $('#deviceFunctionList li:not([data-role=list-divider])').remove();
        $.each(this.data.functions, function(key, func) {
            var functionLI = $("<li></li>").appendTo($('#deviceFunctionList')).text(func).click(function() {
                var userInput = prompt("Enter function Argument");
                if (userInput) device.callFunction(func, userInput);
            });
        });
        $('#deviceFunctionList').listview().listview('refresh');
    };
    Device.prototype.updateVariables=function(){
        var device=this;
        $.each(this.data.variables, function(key, value){
            $('<li></li>').appendTo($('#deviceVariablesList')).attr("id", device.id + key);
            device.updateVariable(key);
        });
        $('#deviceVariablesList').listview().listview('refresh');
        if($('#deviceVariablesList li:not[data-role=list-divider]').length==0){
            window.setTimeout(function(){
                device.updateVariables();
            }, 10000);
        }
    };
    Device.prototype.updateVariable=function(key){
        var device=this;
        $.get(device.baseUrl + "/" + key + device.urlTail).done(function(data){
            $("li#" + device.id + data.name).text(data.name+": "+data.result);
        });
        window.setTimeout(function(){
            device.updateVariable(key);
        }, 10000);
    };
    Device.prototype.updateEvents=function(){
        
    };
    Device.prototype.callFunction=function(f,v){
        var device=this;
        $.post(this.baseUrl + "/" + f, {
            arg : v,
            access_token : device.api.accessToken
        }).success(function(data) {
            console.log(data);
        });
    };
    $.fn.getValues=function(){
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