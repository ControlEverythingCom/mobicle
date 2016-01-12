
//Simple singleton to make testing easier
function API(){
    if(typeof myApi === 'undefined') myApi=new Particle();
    return myApi;
}
(function($){
    Particle=function(accessToken) {
        this.theme=new ParticleTheme();
        this.baseUrl = 'https://api.particle.io/';
        this.apiVersion = 'v1';
        this.accessToken = isset(accessToken)?accessToken:false;
        this.devices={};
        this.streams={};
        $(document).trigger("ParticleCreate", this);
    };
    
    /*
     * Event handler methods
     */
    Particle.prototype.on = function(e, c) {
        var api=this;
        if(e.constructor === Object){
            $.each(e, function(k, v){
                api.on(k, v); 
            });
        }else if(e.indexOf(' ')>-1){
            $.each(e.split(' '), function(k,v){
                api.on(v, c);
            });
        }else{
            this.eventListeners = this.eventListeners || {};
            if (!isset(this.eventListeners[e]))
                this.eventListeners[e] = [];
            this.eventListeners[e].push(c);
        }
        return this;
    };
    Particle.prototype.off = function(e, c) {
        this.eventListeners = this.eventListeners || {};
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        this.eventListeners[e] = $.grep(this.eventListeners[e], function(v) {
            return (v !== c);
        });
        return this;
    };
    Particle.prototype.trigger = function() {
        this.eventListeners = this.eventListeners || {};
        var args = [];
        var e = arguments[0];
        var retVal = true;
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        for (var i in arguments)
        if (i !== 0)
            args.push(arguments[i]);
        $.each(this.eventListeners[e], function(k, f) {
            if (f.apply(this, args) === false)
                retVal = false;
        });
        return retVal;
    };
    
    Particle.prototype.commands={
        
      //Token commands
      tokenCreate:{
          type: 'post',
          path: 'oauth/token',
          args: {client_id:'particle', client_secret: 'particle', grant_type: 'password', username: 'particle_username', password: 'particle_password'},
          ui_disable: true
      },
      tokenList:{
          type: 'get',
          api:false,
          path: 'v1/access_tokens'
      },
      tokenDelete:{
          type: 'delete',
          path: 'access_tokens/:token',
          api: true,
          path_args: ['token'],
          ui_disable: true
      },
      
      //Device commands
      deviceList:{
          type:'get',
          api:true,
          path:'devices',
          ui_disable: true
      },
      deviceFetch:{
          type:'get',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id'],
          ui_disable: true
      },
      deviceUpdate:{
          type:'put',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id'],
          ui_disable: true
      },
      deviceRename:{
          type:'put',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id'],
          //args: {name:'new_name'},
          ui_disable: true
      },
      
      //Claim commands
      claimCodeCreate:{
          type:'get',
          api:true,
          path:'device_claims',
      },
      claimDevice:{
          type:'post',
          api:true,
          path:'devices'
      },
      claimTransfer:{
          type:'post',
          api:true,
          path:'devices',
          args:{request_Transfer:true, id:'device_id'}
      },
      
      //Variables/functions
      variableGet:{
          type:'get',
          api:true,
          path:'devices/:device_id/:variable_name',
          path_args:['device_id', 'variable_name']
      },
      functionCall:{
          type:'post',
          api:true,
          path:'devices/:device_id/:function_name',
          path_args:['device_id', 'function_name'],
          //args: {arg: 'argument for function', format: 'raw'},
          ui_disable: true
      },
      
      //Events
      eventsFetchAll:{
          type:'eventStream',
          api:true,
          path:'devices/events',
          parser:'parseEvents'
      },
      eventsFetchDevice:{
          type:'eventStream',
          api:true,
          path:'devices/:device_id/events',
          path_args:['device_id'],
          parser:'parseEvents'
      },
      eventPublish:{
          type:'post',
          api:true,
          path:'devices/events'
          //args: {name: 'event name', data:'event data', private:false, ttl:300}
      }
    };
    
    //API helper functions
    Particle.prototype.parseEvents=function(response, xhr){
        var lines=response.split("\n");
        var thisEvent={};
        for(var i=0;i<lines.length;i++){
            var delimeterPos=lines[i].indexOf(':');
            switch(lines[i].substr(0, delimeterPos)){
                case 'data':
                    thisEvent.data=$.parseJSON(lines[i].substr(delimeterPos+1).trim());
                    if(!isset(thisEvent.name)) thisEvent.name=xhr.lastEvent.name;
                    break;
                case 'event':
                    thisEvent.name=lines[i].substr(delimeterPos+1).trim();
                    break;
            };
        }
        xhr.lastEvent=thisEvent;
        if(isset(thisEvent.data) && isset(thisEvent.name)) return xhr.lastEvent;
    };
    
    Particle.prototype.do=function(){
        var command, args = [], i;
        for(i=0;i<arguments.length;i++){
            if(i===0) command=arguments[i];
            else args.push(arguments[i]);
        }
        if(!isset(this.commands[command])) return console.log('invalid command given '+command);
        if(!isset(args[0])) args[0]={};
        var api=this;
        var base_url=this.baseUrl;
        if(this.commands[command].api){
            base_url+= this.apiVersion+'/';
            if(!isset(args[0].access_token)) args[0].access_token=api.accessToken;
            if(args[0].access_token===false) return console.log('no valid access token for api');
        }
        if(isset(this.commands[command].args)) args[0]=$.extend(this.commands[command].args, args[0]);
        base_url+=this.commands[command].path;
        if(isset(this.commands[command].path_args)){
            for(var i in this.commands[command].path_args){
                var key=this.commands[command].path_args[i];
                base_url=base_url.replace(':'+key, args[0][key]);
                delete args[0][key];
            }
        }
        $.support.cors = true;
        switch(this.commands[command].type){
            case 'post':
            case 'get':
            case 'delete':
            case 'put': 
            
                if(this.commands[command].ui_disabled){
                    $("body").addClass('ui-disabled');
                    $.mobile.loading("show",{
                        text: command,
                        textVisible: true
                    });
                }
                $.ajax({
                    type: this.commands[command].type.toUpperCase(),
                    url: base_url,
                    data: args[0],
                    crossDomain: true,
                }).done(function(data, status, xhr){
                    if(isset(args[1])) args[1](data, status, xhr);
                    api.trigger(command, data, status, xhr);
                }).fail(function(xhr, status, error){
                    api.trigger(command+'_fail', xhr, status, error);
                }).always(function(data, status, error){
                    
                    $.mobile.loading("hide");
                    $("body").removeClass('ui-disabled');
                });
                break;
            case 'eventStream':
                base_url+='?'+$.param(args[0]);
                
                if(isset(this.streams[base_url])) return;
                this.streams[base_url]=true;
                
                eventStream(base_url, function(data, xhr){
                    if(isset(api.commands[command].parser)) var response=api[api.commands[command].parser](data, xhr);
                    else var response=data;
                    if(isset(args[1])) args[1](response);
                    api.trigger(command, response);
                });
                break;
        }
    };
    
    
    //Do helper functions
    Particle.prototype.logIn = function(name, pass){
        var api=this;
        this.do('tokenCreate', {username: name, password: pass}, function(data){api.accessToken=data.access_token;});
    };
    Particle.prototype.logOut = function() {
        var api=this;
        this.do('tokenDelete', {token: this.accessToken},function(data){if(data.ok) api.accessToken=false;});
    };
    
    Particle.prototype.updateEvents = function(deviceid){
        var api=this;
        if(isset(deviceid)) this.do('eventsFetchDevice', {device_id:deviceid}, function(data){});
        else this.do('eventsFetchAll', {});
    };

    Particle.prototype.publishEvent = function(eventName, eventData, eventTTL) {
        this.do('eventPublish', {name:eventName, data:eventData, ttl:eventTTL});
    };
    Particle.prototype.updateDevices = function() {
        var api=this;
        this.do('deviceList', {}, function(data){
           var old_devices=api.devices || {};
           api.devices={};
           for(var i in data){
               api.devices[data[i].id]=new Device(api, data[i].id, data[i]);
               api.trigger('deviceFetch', data[i]);
               if(isset(old_devices[data[i].id])) delete old_devices[data[i].id];
           }
           for(var i in old_devices){
               api.trigger('deviceRemove', old_devices[i]);
           }
        });
    };
    Particle.prototype.updateDevice = function(deviceID) {
        if (!isset(this.devices[deviceID])) {
            this.devices[deviceID] = new Device(this, deviceID);
            this.trigger('deviceFetch', this.devices[deviceID]);
        }else{
            this.devices[deviceID].fetchSelf();
        }
    };
    Particle.prototype.renameDevice = function(deviceId, name){
        var api=this;
        this.do('deviceRename', {device_id:deviceId, name:name}, function(){
            api.updateDevice(deviceId);
        });
    };
    Particle.prototype.setTheme = function(theme){
        this.theme=theme;
    };
    Device=function(api, deviceID, deviceObj){
        this.api=api;
        this.id=deviceID;
        if(isset(deviceObj)){
            for(var i in deviceObj) this[i]=deviceObj[i];
        }else{
            this.fetchSelf();
        }
    };
    Device.prototype.fetchSelf=function(){
        var device=this;
        this.api.do('deviceFetch', {device_id:this.id}, function(data){
            for(var i in data) device[i]=data[i];
        });
    };
})(jQuery);
