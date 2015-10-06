(function($) {
	//Master HTML Element 
	makeElement = function(options) {
		var defaults = {
			tag : 'div',
			attributes : {
			},
			classes : [],
			css : {

			}

		};

		var options = $.extend(defaults, options);

		var element = $('<' + options.tag + '></' + options.tag + '>');

		element.attr(options.attributes);
		element.addClass(classes);
		element.css(css);
		return element;
	};
	//Generic Input element
	makeInput = function(options) {
		var defaults = {
			tag : 'input',
			attributes : {
				type : 'text',
				value : ''
			},
			classes : ['ui-input-txt']
		};
		var opts = $.extend(defaults, options);
		return makeElement(opts);
	};

	makePassword = function(options) {
		var defaults = {
			attributes : {
				type : 'password'
			}
		};
		var opts = $.extend(defaults, options);
		return makeInput(opts);
	};
})(jQuery); 