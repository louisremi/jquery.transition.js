/* Cases where transition is disabled:
 * - in incompatible browsers (Opera 11 included)
 * - when the animated object is not an element
 * - when there is a special easing
 * - when there is a step function
 * - when jQuery.fx.off is true (should work out of the box)
 *
 * jQuery.fx.stop() will stop animations instead of pausing them (undocumented method and behavior anyway).
 */
(function( jQuery ) {

var elemdisplay = {},
	iframe, iframeDoc,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
	timerId,
	effectsTimestamp,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	],
	fxNow,
	requestAnimationFrame = window.webkitRequestAnimationFrame ||
	    window.mozRequestAnimationFrame ||
	    window.oRequestAnimationFrame;

// TRANSITION++
// Following feature test code should be moved to support.js
var div = document.createElement('div'),
	divStyle = div.style,
	trans = "Transition";
// Only test for transition support in Firefox and Webkit 
// as we know for sure that Opera has too much bugs (see http://csstransition.net)
// and there's no guarantee that first IE implementation will be bug-free
jQuery.support.transition =
	'Moz'+trans in divStyle ? 'Moz'+trans:
	'Webkit'+trans in divStyle ? 'Webkit'+trans:
	false;

jQuery.fn.extend({
	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback),
			// Fix #7917, synchronize animations.
			_startTime = createFxNow();

		if ( jQuery.isEmptyObject( prop ) ) {
			return this.each( optall.complete, [ false ] );
		}
		
		// Do not change referenced properties as per-property easing will be lost
		prop = jQuery.extend( {}, prop );
		
		return this[ optall.queue === false ? "each" : "queue" ](function() {
			// XXX 'this' does not always have a nodeName when running the
			// test suite

			if ( optall.queue === false ) {
				jQuery._mark( this );
			}

			var self = this,
				// cache jQuery properties to minimize lookups (and filesize)
				extend = jQuery.extend,
				style = jQuery.style,
				support = jQuery.support,
				css = jQuery.css,
				fx = jQuery.fx,
				startTime = _startTime,
				// cache end
				opt = extend({}, optall), p,
				isElement = self.nodeType === 1,
				hidden = isElement && jQuery(self).is(":hidden"),
				thisStyle = self.style,
				name, val, easing,
				display,
				e,
				parts, start, end, unit,
				// TRANSITION++
				cssProps = jQuery.cssProps,
				// disable transition if a step option is supplied
				supportTransition = !opt.step && support.transition,
				transition,
				transitions = [],
				hook, real, lower;
			self.now = null;
			// jQuery.now() is called only once for all animated properties of all elements
			if (!startTime) {
				_startTime = startTime = jQuery.now();
			}

			// will store per property easing and be used to determine when an animation is complete
			opt.animatedProperties = {};
			// TRANSITION++
			// transition is enabled per property, when:
			// - there is no step function for the animation
			// - there is no special easing for the property
			opt.transition = {};

			for ( p in prop ) {

				// property name normalization
				name = jQuery.camelCase( p );
				if ( p !== name ) {
					prop[ name ] = prop[ p ];
					delete prop[ p ];
					p = name;
				}

				val = prop[ name ];
				
				// easing resolution: per property > opt.specialEasing > opt.easing > 'swing' (default)
				if ( jQuery.isArray( val ) ) {
					opt.animatedProperties[ name ] = val[ 1 ];
					val = prop[ name ] = val[ 0 ];
				} else {
					opt.animatedProperties[ name ] = opt.specialEasing && opt.specialEasing[ name ] || opt.easing || 'swing';
				}
				
				// TRANSITION++
				// prevent transition when a special easing is supplied
				transition = supportTransition && isElement && (
					// we could use a hash to convert the names
					opt.animatedProperties[ name ] == 'swing' ? 'ease':
					opt.animatedProperties[ name ] == 'linear' ? easing:
					false
				);

				// collect the properties to be added to elem.style.transition...
				if ( transition ) {
					real = cssProps[p] || p;

					lower = real.replace(/([A-Z])/g, '-$1').toLowerCase();

					transition =
						lower +" "+
						opt.duration +"ms "+
						transition;

					opt.transition[p] = {
						lower: lower,
						real: real
					};

					transitions.push(transition);
				}

				if ( val === "hide" && hidden || val === "show" && !hidden ) {
					return opt.complete.call(self);
				}

				if ( isElement && ( p === "height" || p === "width" ) ) {
					// Make sure that nothing sneaks out
					// Record all 3 overflow attributes because IE does not
					// change the overflow attribute when overflowX and
					// overflowY are set to the same value
					opt.overflow = [ thisStyle.overflow, thisStyle.overflowX, thisStyle.overflowY ];

					// Set display property to inline-block for height/width
					// animations on inline elements that are having width/height
					// animated
					if ( css( self, "display" ) === "inline" &&
							css( self, "float" ) === "none" ) {
						if ( !support.inlineBlockNeedsLayout ) {
							thisStyle.display = "inline-block";

						} else {
							display = defaultDisplay(self.nodeName);

							// inline-level elements accept inline-block;
							// block-level elements need to be inline with layout
							if ( display === "inline" ) {
								thisStyle.display = "inline-block";

							} else {
								thisStyle.display = "inline";
								thisStyle.zoom = 1;
							}
						}
					}
				}
			}
			
			if ( opt.overflow != null ) {
				thisStyle.overflow = "hidden";
			}

			for ( p in prop ) {
				e = new fx( self, opt, p );

				val = prop[p];

				if ( rfxtypes.test(val) ) {
					e[ val === "toggle" ? hidden ? "show" : "hide" : val ]( startTime );

				} else {
					parts = rfxnum.exec(val);
					start = e.cur();

					if ( parts ) {
						end = parseFloat( parts[2] );
						unit = parts[3] || ( jQuery.cssNumber[ name ] ? "" : "px" );

						// We need to compute starting value
						if ( unit !== "px" ) {
							style( self, p, (end || 1) + unit);
							start = ((end || 1) / e.cur()) * start;
							style( self, p, start + unit);
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] ) {
							end = ((parts[1] === "-=" ? -1 : 1) * end) + start;
						}

						e.custom( startTime, start, end, unit );

					} else {
						e.custom( startTime, start, val, "" );
					}
				}
			}

			// TRANSITION++
			if ( supportTransition && transitions.length ) {
				transition = thisStyle[supportTransition];
				thisStyle[supportTransition] = transitions.join() + (transition ? ',' + transition : '');
			}

			// For JS strict compliance
			return true;
		});
	},

	stop: function( clearQueue, gotoEnd ) {
		if ( clearQueue ) {
			this.queue([]);
		}

		this.each(function() {
			var timers = jQuery.timers,
				i = timers.length,
				supportTransition = jQuery.support.transition;
				// clear marker counters if we know they won't be
				if ( !gotoEnd ) {
					jQuery._unmark( true, this );
				}
			// go in reverse order so anything added to the queue during the loop is ignored
			while ( i-- ) {
				if ( timers[i].elem === this ) {
					if ( gotoEnd || supportTransition ) {
						// force the next step to be the last
						timers[i](gotoEnd);
					}

					timers.splice(i, 1);
				}
			}
		});

		// start the next in the queue if the last step wasn't forced
		if ( !gotoEnd ) {
			this.dequeue();
		}
		
		return this;
	}

});

jQuery.extend( jQuery.fx.prototype, {

	// Get the current size
	cur: function() {
		var elem = this.elem,
			prop = this.prop,
			r,
			parsed;
		if ( elem[prop] != null && (!elem.style || elem.style[prop] == null) ) {
			return elem[ prop ];
		}

		r = jQuery.css( elem, prop );
		// Empty strings, null, undefined and "auto" are converted to 0,
		// complex values such as "rotate(1rad)" are returned as is,
		// simple values such as "10px" are parsed to Float.
		return isNaN( parsed = parseFloat( r ) ) ? !r || r === "auto" ? 0 : r : parsed;
	},

	// Start an animation from one number to another
	custom: function( startTime, from, to, unit ) {
		var self = this,
			fx = jQuery.fx,
			prop = self.prop,
			// TRANSITION++
			transition = self.options.transition,
			timers = jQuery.timers,
			hook;

		self.startTime = startTime;
		self.start = from;
		self.end = to;
		self.unit = unit || self.unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		self.now = self.start;
		self.pos = self.state = 0;

		function t( gotoEnd ) {
			return self.step( gotoEnd );
		}

		t.elem = self.elem;

		if ( transition[prop] ) {
			//timers.push(t);
			// explicitely set the property to it's current computed value to workaround bugzil.la/571344
			self.elem.style[transition[prop].real] = jQuery.css( self.elem, prop );

			// Don't set the style immediatly, the transition property has not been filled yet
			setTimeout(function() {
				jQuery.style( self.elem, prop, to + self.unit );

				// use a setTimeout to detect the end of a transition
				// the transitionend event is unreliable
				transition[prop].timeout = setTimeout(function() {
					//timers.splice(timers.indexOf(t), 1);
					self.step(true);
				// add an unperceptible delay to help some tests pass in Firefox
				}, self.options.duration + 30);
			}, 0);

		} else if ( t( false, startTime ) && timers.push(t) && !timerId ) {
			// Use requestAnimationFrame instead of setInterval if available
			if ( requestAnimationFrame ) {
				timerId = 1;
				raf = function() {
					// When timerId gets set to null at any point, this stops
					if ( timerId ) {
						requestAnimationFrame( raf );
						fx.tick();
					}
				};
				requestAnimationFrame( raf );
			} else {
				timerId = setInterval( fx.tick, fx.interval );
			}
		}
	},

	// Each step of an animation
	step: function( gotoEnd ) {
		var t = fxNow || createFxNow(),
			done = true,
			elem = this.elem,
			options = this.options,
			duration = options.duration,
			// TRANSITION++
			prop = this.prop,
			transition = options.transition[this.prop],
			supportTransition,
			hook,
			i, p, style;
		
		if ( transition || gotoEnd || t >= duration + this.startTime ) {
			if ( !transition ) {
				this.now = this.end;
				this.pos = this.state = 1;
				this.update();

			// TRANSITION++
			} else {
				clearTimeout(transition.timeout);
				// Stop a transition halfway through
				if ( !gotoEnd ) {
					// yes, stoping a transition halfway through should be as simple as setting a property to its current value.
					// Try to call window.getComputedStyle() only once per element (in tick()?)
					this.elem.style[transition.real] = jQuery.css( this.elem, transition.real );
				}
			}

			options.animatedProperties[ this.prop ] = true;

			for ( i in options.animatedProperties ) {
				if ( options.animatedProperties[i] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				// Reset the overflow
				if ( options.overflow != null && !jQuery.support.shrinkWrapBlocks ) {

					jQuery.each( [ "", "X", "Y" ], function (index, value) {
						elem.style[ "overflow" + value ] = options.overflow[index];
					} );
				}

				// Hide the element if the "hide" operation was done
				if ( options.hide ) {
					jQuery(elem).hide();
				}

				// Reset the properties, if the item has been hidden or shown
				if ( options.hide || options.show ) {
					style = jQuery.style;
					for ( var p in options.animatedProperties ) {
						style( elem, p, options.orig[p] );
					}
				}

				// TRANSITION++
				// cleanup the transition property
				
				if ( (supportTransition = elem.nodeType === 1 && jQuery.support.transition) ) {
					transition = ',' + elem.style[supportTransition];
					for ( p in options.transition ) {
						transition = transition.split( options.transition[p].lower ).join('_');
					}
					elem.style[supportTransition] = transition.replace(/, ?_[^,]*/g, '').substr(1);
				}

				// Execute the complete function
				options.complete.call( elem );
				
			}

			return false;

		} else {
			// classical easing cannot be used with an Infinity duration
			if (duration == Infinity) {
				this.now = t;
			} else {
				var n = t - this.startTime;

				this.state = n / duration;
				// Perform the easing function, defaults to swing
				this.pos = jQuery.easing[options.animatedProperties[this.prop]](this.state, n, 0, 1, duration);
				this.now = this.start + ((this.end - this.start) * this.pos);
			}
			// Perform the next step of the animation
			this.update();
		}

		return true;
	}
//};
});

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout( clearFxNow, 0 );
	return ( fxNow = jQuery.now() );
}

function clearFxNow() {
	fxNow = undefined;
}

})( jQuery );