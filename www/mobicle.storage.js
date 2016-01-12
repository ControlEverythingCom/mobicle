(function($){
    Particle.prototype.storage={
        get: function(k, v){
            var val=window.localStorage.getItem(k);
            if(isset(val)){
                try{
                    var ret=$.parseJSON(val);
                } catch(e){
                    var ret=val;
                }
            }else if(isset(v)) ret=v;
            return ret;
        },
        set: function(k, v){
            return window.localStorage.setItem(k, JSON.stringify(v));
        },
        clear: function(){
            return window.localStorage.clear();
        }
    };
    $(document).on('ParticleCreate', function(e, api){
        if(api.accessToken) api.storage.set('access_token', api.accessToken);
        else api.accessToken = api.storage.get('access_token', false);
        api.on('tokenCreate', function(){api.storage.set('access_token', api.accessToken);});
    });
})(jQuery);
