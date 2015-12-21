(function($){
    Particle=function(accessToken) {
        this.baseUrl = 'https://api.particle.io/';
        this.apiVersion = 'v1';
        this.accessToken = isset(accessToken)?accessToken:false;
        this.data={};
    };
    Particle.prototype.on = function(e, c) {
        this.eventListeners = this.eventListeners || {};
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        this.eventListeners[e].push(c);
    };
    Particle.prototype.off = function(e, c) {
        this.eventListeners = this.eventListeners || {};
        if (!isset(this.eventListeners[e]))
            this.eventListeners[e] = [];
        this.eventListeners[e] = $.grep(this.eventListeners[e], function(v) {
            return (v !== c);
        });
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
        $.each(this.eventListeners[e], function(f) {
            if (f.apply(this, args) === false)
                retVal = false;
        });
        return retVal;
    };
    Particle.prototype.save=function(){
        if(this.accessToken){
            var json=JSON.stringify(this);
            window.localStorage.setItem('Particle_access_token', this.accessToken);
            window.localStorage.setItem('Particle_'+this.accessToken, json);
        }
    };
    Particle.prototype.get=function(accessToken){
        return window.localStorage.getItem('Particle_'+accessToken);
    };
    Particle.prototype.commands={
        
      //Token commands
      tokenCreate:{
          type: 'post',
          path: 'oauth/token',
          args: {client_id:'particle', client_secret: 'particle', grant_type: 'password', username: 'particle_username', password: 'particle_password'}
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
          path_args: ['token']
      },
      
      //Device commands
      deviceList:{
          type:'get',
          api:true,
          path:'devices'
      },
      deviceFetch:{
          type:'get',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id']
      },
      deviceUpdate:{
          type:'put',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id']
      },
      deviceRename:{
          type:'put',
          api:true,
          path:'devices/:device_id',
          path_args:['device_id'],
          //args: {name:'new_name'}
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
          path_args:['device_id', 'function_name']
          //args: {arg: 'argument for function', format: 'raw'}
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
    Particle.prototype.parseEvents=function(response){
        var events=[];
        var lines=response.split("\n");
        for(var i=0;i<lines.length;i++){
            if(lines[i].substr(0, lines[i].indexOf(':'))=='data'){
                events.push({
                   name: lines[i-1].split(':')[1].trim(),
                   data: $.parseJSON(lines[i].substr(lines[i].indexOf(':')+1).trim())
                });
            }
        }
        return events;
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
            for(var i in this.commands[command].path_args) base_url=base_url.replace(':'+i, args[0][i]);
        }
        $.support.cors = true;
        switch(this.commands[command].type){
            case 'post':
            case 'get':
            case 'delete':
                $.ajax({
                    type: this.commands[command].type.toUpperCase(),
                    url: base_url,
                    data: args[0],
                    crossDomain: true,
                }).done(function(data, status, xhr){
                    if(isset(args[1])) args[1](data, status, xhr);
                }).always(function(data, status, error){
                    api.trigger(command, data, status, error);
                });
                break;
            case 'eventStream':
                base_url+='?'+$.param(args[0]);
                eventStream(base_url, function(data){
                    if(isset(api.commands[command].parser)) var response=api[api.commands[command].parser](data);
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
    Particle.prototype.updateDevices = function() {
        var api=this;
        this.do('deviceList', {}, function(data){
           api.devices={};
           for(var i in data) api.devices[data[i].id]=new Device(api, data[i].id, data[i]); 
        });
    };
    Particle.prototype.updateEvents = function(deviceid){
        var api=this;
        if(isset(deviceid)) this.do('eventsFetchDevice', {device_id:deviceid}, function(data){});
        else this.do('eventsFetchAll', {});
    };

    Particle.prototype.publishEvent = function(eventName, eventData, eventTTL) {
        this.do('eventPublish', {name:eventName, data:eventData, ttl:eventTTL});
    };

    Particle.prototype.updateDevice = function(deviceID) {
        if (!isset(this.devices[deviceID])) {
            this.devices[deviceID] = new Device(this, deviceID);
        }else{
            this.devices[deviceID].fetchSelf();
        }
    };
    Device=function(api, deviceID, deviceObj){
        this.api=api;
        this.id=deviceID;
        if(isset(deviceObj)){
            for(var i;i<deviceObj.length;i++) this[i]=deviceObj[i];
        }else{
            this.fetchSelf();
        }
    };
    Device.prototype.fetchSelf=function(){
        var device=this;
        this.api.do('deviceFetch', {device_id:this.id}, function(data){
            for(var i;i<data.length;i++) device[i]=data[i];
        });
    };
})(jQuery);
