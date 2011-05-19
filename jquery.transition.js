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
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
	timerId,
	effectsTimestamp/*,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	]*/;

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
	/*show: function( speed, easing, callback ) {
		var elem, display;

		if ( speed || speed === 0 ) {
			return this.animate( genFx("show", 3), speed, easing, callback);

		} else {
			for ( var i = 0, j = this.length; i < j; i++ ) {
				elem = this[i];
				display = elem.style.display;

				// Reset the inline display of this element to learn if it is
				// being hidden by cascaded rules or not
				if ( !jQuery._data(elem, "olddisplay") && display === "none" ) {
					display = elem.style.display = "";
				}

				// Set elements which have been overridden with display: none
				// in a stylesheet to whatever the default browser style is
				// for such an element
				if ( display === "" && jQuery.css( elem, "display" ) === "none" ) {
					jQuery._data(elem, "olddisplay", defaultDisplay(elem.nodeName));
				}
			}

			// Set the display of most of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < j; i++ ) {
				elem = this[i];
				display = elem.style.display;

				if ( display === "" || display === "none" ) {
					elem.style.display = jQuery._data(elem, "olddisplay") || "";
				}
			}

			return this;
		}
	},

	hide: function( speed, easing, callback ) {
		if ( speed || speed === 0 ) {
			return this.animate( genFx("hide", 3), speed, easing, callback);

		} else {
			for ( var i = 0, j = this.length; i < j; i++ ) {
				var display = jQuery.css( this[i], "display" );

				if ( display !== "none" && !jQuery._data( this[i], "olddisplay" ) ) {
					jQuery._data( this[i], "olddisplay", display );
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < j; i++ ) {
				this[i].style.display = "none";
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,

	toggle: function( fn, fn2, callback ) {
		var bool = typeof fn === "boolean";

		if ( jQuery.isFunction(fn) && jQuery.isFunction(fn2) ) {
			this._toggle.apply( this, arguments );

		} else if ( fn == null || bool ) {
			this.each(function() {
				var state = bool ? fn : jQuery(this).is(":hidden");
				jQuery(this)[ state ? "show" : "hide" ]();
			});

		} else {
			this.animate(genFx("toggle", 3), fn, fn2, callback);
		}

		return this;
	},

	fadeTo: function( speed, to, easing, callback ) {
		return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, easing, callback);
	},*/

	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback),
			// Fix #7917, synchronize animations.
			_startTime = effectsNow();

		if ( jQuery.isEmptyObject( prop ) ) {
			return this.each( optall.complete );
		}

		return this[ optall.queue === false ? "each" : "queue" ](function() {
			// XXX 'this' does not always have a nodeName when running the
			// test suite

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

				val = prop[p];

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

				// easing resolution: per property > opt.specialEasing > opt.easing > 'swing' (default)
				if ( jQuery.isArray( val ) ) {
					easing = val[1];
					val = val[0];
				} else {
					easing = opt.specialEasing && opt.specialEasing[p] || opt.easing || 'swing';
				}
				opt.animatedProperties[p] = easing;

				// TRANSITION++
				// prevent transition when a special easing is supplied
				transition = supportTransition && isElement && (
					// we could use a hash to convert the names
					easing == 'swing' ? 'ease':
					easing == 'linear' ? easing:
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

/*function genFx( type, num ) {
	var obj = {};

	jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice(0,num)), function() {
		obj[ this ] = type;
	});

	return obj;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show", 1),
	slideUp: genFx("hide", 1),
	slideToggle: genFx("toggle", 1),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.extend({
	speed: function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
		},
		fx = jQuery.fx;

		opt.duration = fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			opt.duration in fx.speeds ? fx.speeds[opt.duration] : fx.speeds._default;

		// Queueing
		opt.old = opt.complete;
		opt.complete = function() {
			if ( opt.queue !== false ) {
				jQuery(this).dequeue();
			}
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ) {
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		options.orig = options.orig || {};
	}

});*/

jQuery.extend( jQuery.fx.prototype, {
/*jQuery.fx.prototype = {
	// Simple function for setting a style value
	update: function() {
		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		(jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );
	},*/

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

		function t( gotoEnd, now ) {
			return self.step( gotoEnd, now );
		}

		t.elem = self.elem;

		if ( transition[prop] ) {
			timers.push(t);

			// explicitely set the property to it's current computed value to workaround bugzil.la/571344
			self.elem.style[transition[prop].real] = jQuery.css( self.elem, prop );

			// Don't set the style immediatly, the transition property has not been filled yet
			setTimeout(function() {
				jQuery.style( self.elem, prop, to + self.unit );

				// use a setTimeout to detect the end of a transition
				// the transitionend event is unreliable
				transition[prop].timeout = setTimeout(function() {
					timers.splice(timers.indexOf(t), 1);
					self.step(true);
				// add an unperceptible delay to help some tests pass in Firefox
				}, self.options.duration + 30);
			}, 0);

		} else if ( t( false, startTime ) && timers.push(t) && !timerId ) {
			timerId = setInterval(fx.tick, fx.interval);
		}
	},

	/*// Simple 'show' function
	show: function( startTime ) {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		this.custom( startTime, this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur() );

		// Start by showing the element
		jQuery( this.elem ).show();
	},

	// Simple 'hide' function
	hide: function( startTime ) {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom( startTime, this.cur(), 0 );
	},*/

	// Each step of an animation
	step: function( gotoEnd, t ) {
		var done = true,
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
					for ( p in options.animatedProperties ) {
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

jQuery.extend( jQuery.fx, {
	tick: function() {
		var timers = jQuery.timers,
			i = 0,
			now = jQuery.now();

		// don't cache timers.length since it might change at any time.
		for ( ; i < timers.length; i++ ) {
			if ( !timers[i]( false, now ) ) {
				timers.splice(i--, 1);
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
	}/*,

	interval: 13,

	stop: function() {
		clearInterval( timerId );
		timerId = null;
	},

	speeds: {
		slow: 600,
		fast: 200,
		// Default speed
		_default: 400
	},

	step: {
		opacity: function( fx ) {
			jQuery.style( fx.elem, "opacity", fx.now );
		},

		_default: function( fx ) {
			if ( fx.elem.style && fx.elem.style[ fx.prop ] != null ) {
				fx.elem.style[ fx.prop ] = (fx.prop === "width" || fx.prop === "height" ? Math.max(0, fx.now) : fx.now) + fx.unit;
			} else {
				fx.elem[ fx.prop ] = fx.now;
			}
		}
	}*/
});

/*if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}*/

function defaultDisplay( nodeName ) {
	if ( !elemdisplay[ nodeName ] ) {
		var elem = jQuery("<" + nodeName + ">").appendTo("body"),
			display = elem.css("display");

		elem.remove();

		if ( display === "none" || display === "" ) {
			display = "block";
		}

		elemdisplay[ nodeName ] = display;
	}

	return elemdisplay[ nodeName ];
}

// Function to synchronize now() values between animations
function effectsNow() {
	if ( !effectsTimestamp ) {
		effectsTimestamp = jQuery.now();
		setTimeout(function() {
			effectsTimestamp = null;
		}, 0);
	}
	return effectsTimestamp;
}

})( jQuery );