/* Another polyfill for CSS3 Transitions.
 * This one parses a stylesheet looking for transitions happening on :hover and :focus and convert them to jQuery code.
 * 
 * Limitations:
 * - Only works for a limited set of selectors
 * - Only works when the rule containing the transition property list and the rule declaring the :hover style have similar selectors
 * - Doesn't work with "transition-property: all;"
 */
(function($, window, document, undefined) {

var div = document.createElement("div"),
	divStyle = div.style,
	propertyName = "transition",
	// with leading upper-case
	suffix = "Transition",
	testProperties = [
		"O" + suffix,
		// "ms", not "Ms"
		"ms" + suffix,
		"Webkit" + suffix,
		"Moz" + suffix,
		// prefix-less property
		propertyName
	],
	i = testProperties.length,
	supportTransition,
	self = this;

// test different vendor prefixes of this property
while ( i-- ) {
	if ( testProperties[i] in divStyle ) {
		supportTransition = testProperties[i];
		continue;
	}
}

if ( !supportTransition || $.hoverTransition.test ) {
	$(function() {
		var docSS = document.styleSheets,
			i = docSS.length,
			rules, j, curRule, curSelectorText,
			transition, selectors, k, curSelector,
			transitionSelector = {}, pseudoSelector = {},
			split, pseudo,
			selector;

		// Loop through all stylesheets
		while ( i-- ) {
			// if the stylesheet gives us security issues and is readOnly, exit here
			//if ( docSS[i].readOnly ) { continue };
			rules = docSS[i].rules || docSS[i].cssRules;
			j = rules.length;

			// Loop through all rules
			while ( j-- ) {
				curRule = rules[j];
				curSelectorText = curRule.selectorText;
				// Search for a transition property list
				transition = curRule.style.transition || curRule.style["transition-property"];
				// Turn a list of transition properties into a hash of properties
				transition = transition ?
					transition.replace(/(^|,)\s*([\w-]*)[^,]*/g, "$1$2").split():
					0;
				selectors = curSelectorText.split(",");
				k = selectors.length;

				// Loop through all the selectors of the current rule
				while ( k-- ) {
					curSelector = $.trim( selectors[k] );
					// If there is a transition in the current rule, add its selector to the transitionSelector list
					if ( transition ) {
						transitionSelector[curSelector] = transition;
					}
					// If there is a :hover, :focus or :target pseudo-class in the selector, add it to the listeners list
					split = curSelector.split( pseudo =
						~curSelector.indexOf(":hover")? ":hover":
						~curSelector.indexOf(":focus")? ":focus":
						~curSelector.indexOf(":target")? ":target": ","
					);
					if ( split.length > 1 ) {
						// store selectors at the same place when when they exist for both :hover and :focus
						(pseudo == ":hover" || pseudo == ":focus") && pseudoSelector[split.join("")] ?
							pseudoSelector[split.join("")][0] += " " + pseudo:
							pseudoSelector[split.join("")] = [pseudo, curRule.style, split[0], split[1]];
					}
				}
			}
		}

		// Match selectors of rules containing transitions,
		// and selectors with :hover, :focus or :target pseudo-class.
		// Only looking for exact match!
		var listener, delegate, animated, style,
			props = {},
			hfEvents = [[], []];
		for ( selector in pseudoSelector ) {
			if ( ( transition = transitionSelector[selector] ) ) {
				split = pseudoSelector[selector];
				pseudo = split[0];
				style = split[1];
				animated = split[3]
				split = split[2];

				i = transition.length;
				while ( i-- ) {
					props[transition[i]] =
						// use camelCase property name
						style[transition[i].replace(/-([a-z])/g, function( all, letter ) {
							return letter.toUpperCase();
						})];
				}

				if ( ~pseudo.indexOf(":hover") && ( hfEvents[0].push("mouseenter"), hfEvents[1].push("mouseleave") ) 
					|| ~pseudo.indexOf(":focus") && ( hfEvents[0].push("focus"), hfEvents[1].push("blur") )
				) {
					// If the selector _starts_ with an #id, we can bind the listener to it
					listener = /^#[\w\-]* /.test(split) && ( split = split.split(" ") ) ?
						split[0]:
						// use the body otherwise
						document.body;
					delegate = typeof split != "string" ? split[1] : split;

					// mouseenter and focus listeners
					$(listener).delegate( delegate, hfEvents[0].join(" "), function() {
						var $animated = animated ? $(this).find(animated) : $(this),
							prop, save = {};
						// Save the initial style of the elements to be animated
						if ( !$.data( this, "initStyle" ) ) {
							for ( prop in props ) {
								save[prop] = $.css( $animated[0], prop );
							}
							$.data( this, "initStyle", save );
						}
						$animated.stop(true).animate( props );

					// mouseleave and blur listeners
					}).delegate( delegate, hfEvents[1].join(" "), function() {
						var self = this,
							init = $.data( this, "initStyle" ),
							$animated = animated ? $(this).find(animated) : $(this);
						if ( init ) {
							$animated
								.stop(true).animate( init )
								// Clear the saved style at the end of the animation
								.queue(function() {
									$.data( self, "initStyle", null );
								});
						}
					});
				}
			}
		}
	});
}
	
})(jQuery, window, document);
