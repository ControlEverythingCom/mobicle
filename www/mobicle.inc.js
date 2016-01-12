function eventStream(path, callback){
    var xhr = new XMLHttpRequest();
    xhr.fetched='';
    xhr.onreadystatechange=function(){
        if(xhr.readyState>2 && xhr.status==200){
            var newFetched=xhr.responseText;
            var lastFetch=xhr.responseText.replace(xhr.fetched, '');
            xhr.fetched=newFetched;
            callback(lastFetch, xhr);
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
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
(function($){
    $.fn.live = function(events, data, callback) {
        if ( typeof callback === 'undefined') {
            callback = data;
            data = {};
        }
        $(document).on(events, $(this).selector, data, callback);
    };
    $("form input[type=submit]").live('click', function() {
        $("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
        $(this).attr("clicked", "true");
    });
    $.fn.shake = function (options) {
        // defaults
        var settings = {
            'shakes': 2,
            'distance': 10,
            'duration': 400
        };
        // merge options
        if (options) {
            $.extend(settings, options);
        }
        // make it so
        var pos;
        return this.each(function () {
            $this = $(this);
            // position if necessary
            pos = $this.css('position');
            if (!pos || pos === 'static') {
                $this.css('position', 'relative');
            }
            // shake it
            for (var x = 1; x <= settings.shakes; x++) {
                $this.animate({ left: settings.distance * -1 }, (settings.duration / settings.shakes) / 4)
                    .animate({ left: settings.distance }, (settings.duration / settings.shakes) / 2)
                    .animate({ left: 0 }, (settings.duration / settings.shakes) / 4);
            }
        });
    };
})(jQuery);