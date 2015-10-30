(function($) {
    
    $(document).ready(function(){
    	console.log("document ready");
        var ParticleAPI=null;
        var accessToken = window.localStorage.getItem('access_token');
        
        $('body').on('load_page_deviceList', function(a, b){
            ParticleAPI.updateDevices();
            $('#logoutbutton').click(ParticleAPI.logOut);
        });
        
        $('body').on('load_page_device', function(a, b){
            ParticleAPI.updateDevice(getUrlParameter('deviceid'));
            $('#devicelistbutton').click(function(){
            	$('body').pagecontainer('change', 'deviceList.html');
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
    
    Particle.prototype.logOut=function(){
    	console.log("Logging out");
    	window.localStorage.removeItem('access_token');
    	$('body').pagecontainer('change', 'index.html');
    };
    
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
        var that=this;
        $.get(this.baseUrl + 'devices/'+deviceID+'?access_token=' + this.accessToken).done(function(deviceInfo){
            $('#deviceName').text(deviceInfo.name);
            //List Functions
            $.each(deviceInfo.functions, function() {
                var deviceFunction = this;
                var functionLI = $("<li></li>").appendTo($('#deviceFunctionList')).text(deviceFunction).click(function() {
                    var userInput = prompt("Enter function Argument");
                    if (userInput) {
                        var functionURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + deviceFunction;
                        $.post(functionURL, {
                            arg : userInput,
                            access_token : that.accessToken
                        }).success(function(data) {
                            console.log(data);
                        });
                    }
                });
            });
            $('#deviceFunctionList').listview().listview('refresh');
            
            //List Variables
            var deviceVariables = deviceInfo.variables;
            $.each(deviceInfo.variables, function(key, value){
                var variableLI = $('<li></li>');
                variableLI.appendTo($('#deviceVariablesList')).attr("id", deviceID + key);
                var variableRequestURL = "https://api.particle.io/v1/devices/" + deviceID + "/" + key + "?access_token=" + that.accessToken;
                $.get(variableRequestURL).done(function(deviceVar) {
                    var varText = deviceVar.name + ": " + deviceVar.result;
                    $("li#" + deviceID + deviceVar.name).text(varText);
                }).fail(function() {
                    console.log("get for variable failed");
                });
                /*window.setInterval(function() {
                    that.reloadVariables(variableRequestURL);
                }, 2000);*/
            });
            $('#deviceVariablesList').listview().listview('refresh');
            
        }).fail(function(){});
        $('#eventListDivider,#addEventButton').click(function(){
        	var userInput = prompt("Enter function Argument");
            if (userInput) {
            	if(userInput){
            		that.addEventListener(userInput);
            	}
            }
        });
        $('#deviceEventsList').listview().listview('refresh');
    };
    Particle.prototype.reloadVariables=function(url){
        var args = url.split("/");
        var deviceID = args[5];
        $.get(url, function(deviceVar) {
            var varText = deviceVar.name + ": " + deviceVar.result;
            $("li#" + deviceID + deviceVar.name).text(varText);
        });
    };
    Particle.prototype.addEventListener=function(eventString){
    	console.log("adding event listener for event: "+eventString+" on device: "+deviceID);
    	var eventSubscribeURL = "https://api.particle.io/v1/devices/" + deviceID + "/events?access_token=" + this.accessToken;
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