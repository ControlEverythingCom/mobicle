(function($){
    $(document).ready(function(){
        console.log('ready');
        var api=new Particle();
        API(api);
    });
})(jQuery);
function API(){
    if(typeof myApi === 'undefined') myApi=new Particle();
    return myApi;
}
