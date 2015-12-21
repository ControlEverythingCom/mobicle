// Object.prototype._extends=function(p){
    // for(i in p.prototype){
        // if(typeof this.constructor.prototype[i] == "undefined"){
            // this.constructor.prototype[i]=p.prototype[i];
        // }
    // }
// };
// Object.prototype._implements=function(o){
    // for(i in o.constructor.prototype){
        // if(typeof this[i] == "undefined"){
            // var method=o[i];
            // this[i]=function(){
                // return method.apply(o, arguments);
            // };
        // }
    // }
// };

/*
 * Extend any object with this class to add some basic event handling.
 * Basically like jQuery's "on", "off", and "trigger", but less global
 * e.g.
 * myClass.extends(EventHandlerTemplate);
 */
function EventHandlerTemplate(){
     this.eventListeners = {};
}
EventHandlerTemplate.prototype.on = function(e, c) {
    this.eventListeners = this.eventListeners || {};
    if (!isset(this.eventListeners[e]))
        this.eventListeners[e] = [];
    this.eventListeners[e].push(c);
};
EventHandlerTemplate.prototype.off = function(e, c) {
    this.eventListeners = this.eventListeners || {};
    if (!isset(this.eventListeners[e]))
        this.eventListeners[e] = [];
    this.eventListeners[e] = $.grep(this.eventListeners[e], function(v) {
        return (v !== c);
    });
};
EventHandlerTemplate.prototype.trigger = function() {
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
function eventStream(path, callback){
    var xhr = new XMLHttpRequest();
    var fetched='';
    xhr.onreadystatechange=function(){
        if(xhr.readyState>2 && xhr.status==200){
            var newFetched=xhr.responseText;
            var lastFetch=xhr.responseText.replace(fetched, '');
            var fetched=newFetched;
            callback(lastFetch);
        }
    };
    
    xhr.open('GET', path, true);
    xhr.send();
}
function logEntry(d, t, v) {
    $('#log').prepend('<li><span class="device-name" style="display:none;">' + d + '</span><span class="activity-type" style="display:none;">' + t + '</span><span class="activity-value">' + v + '</span></li>').listview('refresh');
}

function isset(v) {
    return ( typeof v !== 'undefined');
}

function getUrlParameter(key, url) {
    var url = isset(url)?'?'+url.split('?').pop():window.location.search;
    var sPageURL = decodeURIComponent(url.substring(1)),
        vars = sPageURL.split('&'),
        param,
        i;

    for ( i = 0; i < vars.length; i++) {
        param = vars[i].split('=');

        if (param[0] === key) return param[1] === undefined ? true : param[1];
    }
};