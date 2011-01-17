/*
 * a patched animate mechanism for jQuery using CSS3 transtion power
 * 
 * this plugin is big, but it adds around 40 lines of js to existing jQuery code
 * unlike other solutions out there it works with all properties that you can possibly animate
 * and will eventually be compatible with cssHooks!
 * 
 * current limitations:
 * - doesn't work with option.queue == false
 * - easing are not implemented yet
 * 
 * latest version and complete README available on Github:
 * https://github.com/lrbabe/jquery.transition.js
 * 
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
(function($) {
  
var div = document.createElement('div'),
  divStyle = div.style,
  jQuery = $,
  // copy those local vars from effects.js
  elemdisplay = {},
  rfxtypes = /^(?:toggle|show|hide)$/,
  rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i;

$.support.transition = 
  divStyle.MozTransition === ''? {name: 'MozTransition', end: 'transitionend'} :
  // Will ms add a prefix to the transitionend event?
  (divStyle.MsTransition === ''? {name: 'MsTransition', end: 'msTransitionend'} :
  (divStyle.WebkitTransition === ''? {name: 'WebkitTransition', end: 'webkitTransitionEnd'} :
  (divStyle.OTransition === ''? {name: 'OTransition', end: 'oTransitionEnd'} :
  (divStyle.transition === ''? {name: 'transition', end: 'transitionend'} :
  false))));
  
// Animate needs to take care of transition-property, transition-duration and transitionEnd binding
// TODO: single var per scope ; never use jQuery.each to iterate over prop ; cache more jQuery.vars
$.fn.animate = function( prop, speed, easing, callback ) {
  var optall = jQuery.speed(speed, easing, callback),
  	// TRANSITION++
  	trans = jQuery.support.transition;

  if ( jQuery.isEmptyObject( prop ) ) {
    return this.each( optall.complete );
  }

  return this[ optall.queue === false ? "each" : "queue" ](function() {
    // XXX 'this' does not always have a nodeName when running the
    // test suite

    var opt = jQuery.extend({}, optall), p,
      isElement = this.nodeType === 1,
      hidden = isElement && jQuery(this).is(":hidden"),
      self = this,
      // TRANSITION++
      props = [],
      cssHooks = jQuery.cssHooks,
      // we could cache jQuery.support as well for jQuery.support.inlineBlockNeedsLayout
      // we could also cache jQuery.camelCase and jQuery.style
      transition = trans,
      hook;

    for ( p in prop ) {
      name = jQuery.camelCase( p );

      if ( p !== name ) {
        prop[ name ] = prop[ p ];
        delete prop[ p ];
        p = name;
      }
      
      // TRANSITION++
      // collect the properties to be added to elem.style.transitionProperty
      if (transition) {
      	// We are doing the exact same conversion once again after the second loop.
      	// One of them can probably be spared.
      	hook = cssHooks[p];
      	props.push(hook? hook.affectedProperty.replace(/([A-Z])/g, '-$1').toLowerCase() || p : p);
      }

      if ( prop[p] === "hide" && hidden || prop[p] === "show" && !hidden ) {
        return opt.complete.call(this);
      }

      if ( isElement && ( p === "height" || p === "width" ) ) {
        // Make sure that nothing sneaks out
        // Record all 3 overflow attributes because IE does not
        // change the overflow attribute when overflowX and
        // overflowY are set to the same value
        opt.overflow = [ this.style.overflow, this.style.overflowX, this.style.overflowY ];

        // Set display property to inline-block for height/width
        // animations on inline elements that are having width/height
        // animated
        if ( jQuery.css( this, "display" ) === "inline" &&
            jQuery.css( this, "float" ) === "none" ) {
          if ( !jQuery.support.inlineBlockNeedsLayout ) {
            this.style.display = "inline-block";

          } else {
            var display = defaultDisplay(this.nodeName);

            // inline-level elements accept inline-block;
            // block-level elements need to be inline with layout
            if ( display === "inline" ) {
              this.style.display = "inline-block";

            } else {
              this.style.display = "inline";
              this.style.zoom = 1;
            }
          }
        }
      }

      if ( jQuery.isArray( prop[p] ) ) {
        // Create (if needed) and add to specialEasing
        (opt.specialEasing = opt.specialEasing || {})[p] = prop[p][1];
        prop[p] = prop[p][0];
      }
    }

    if ( opt.overflow != null ) {
      this.style.overflow = "hidden";
    }

    opt.curAnim = jQuery.extend({}, prop);
    
    // TRANSITION++
    if ( transition ) {
    	this.style[transition.name + 'Duration'] = opt.duration +'ms';
      this.style[transition.name + 'Property'] = props.join();
      props = {};
    }

    jQuery.each( prop, function( name, val ) {
      var e = new jQuery.fx( self, opt, name );

      if ( rfxtypes.test(val) ) {
        e[ val === "toggle" ? hidden ? "show" : "hide" : val ]( prop );

      } else {
        var parts = rfxnum.exec(val),
          start = e.cur();

        if ( parts ) {
          var end = parseFloat( parts[2] ),
            unit = parts[3] || "px";

          // We need to compute starting value
          if ( unit !== "px" ) {
            jQuery.style( self, name, (end || 1) + unit);
            start = ((end || 1) / e.cur()) * start;
            jQuery.style( self, name, start + unit);
          }

          // If a +=/-= token was provided, we're doing a relative animation
          if ( parts[1] ) {
            end = ((parts[1] === "-=" ? -1 : 1) * end) + start;
          }

          e.custom( start, end, unit );

        } else {
          e.custom( start, val, "" );
        }
      }
      // TRANSITION++
      // collects fx objects to use fx.step( gotoEnd ) on transitionEnd
      if ( transition ) {
      	// the rotate.js cssHooks affects the transform property.
      	// the developer needs to tell us, so that we can detect the transition end of that hook.
      	// he/she will also take care of browser normalization.
      	// note: this breaks if different hooks affect the same property, but this is unlikely to happen
				hook = cssHooks[name];
				// affectedProperty could also be named "targetProp", "transitionEquivalent", or anything, really.
      	props[hook? hook.affectedProperty || name : name] = e;
      }
    });
    
    // TRANSITION++
    if ( transition ) {
    	jQuery.event.add( this, transition.end +'.animate', function( e ) {
    		// and this should call fx.step( gotoEnd ), one property at a time.
    		props[jQuery.camelCase(e.originalEvent.propertyName)].step( true, transition );
    	});
    }
    
    // For JS strict compliance
    return true;
  });
};

// the timers function need to be called at all time, not only when the gotoEnd option is used
// TODO: can't the reverse for be simplified to 'for ( var i = timers.length; i -- )'?
$.fn.stop = function( clearQueue, gotoEnd ) {
	var timers = jQuery.timers,
		// TRANSITION++
		transition = jQuery.support.transition;

	if ( clearQueue ) {
		this.queue([]);
	}

	this.each(function() {
		// go in reverse order so anything added to the queue during the loop is ignored
		// TRANSITION++
		for ( var i = timers.length - 1, _transition = transition; i >= 0; i-- ) {
			if ( timers[i].elem === this ) {
				// TRANSITION++
				if ( gotoEnd || _transition ) {
					// force the next step to be the last
					// when using transition, this is also used to stop the animation halfway through
					timers[i]( gotoEnd, _transition );
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
};

// Fix cur to be cssHooks compatible, see #7912
$.fx.prototype.cur = function() {
	if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) ) {
		return this.elem[ this.prop ];
	}

	var r = jQuery.css( this.elem, this.prop ),
		parsed;
	return r === "" || r === "auto"? 0 : isNaN( parsed = parseFloat(r) )? r : parsed;
}

// custom can be simplified
// Here we're taking a code fork approach, jQuery.support.transition is hence looked up only once when the library is loaded
if ($.support.transition)
$.fx.prototype.custom = function( from, to, unit ) {
  var self = this;
  function t( gotoEnd, transition ) {
    return self.step( gotoEnd, transition );
  }
  t.elem = self.elem;
  
  // use the power of cssHooks
	jQuery.style(self.elem, self.prop, to + unit);
  
  jQuery.timers.push(t);
};

// - add a transition parameter to avoid lookups to jQuery.support.transition in unsupported browsers
// - handle the case of animations stopped halfway through in browsers supporting transition
// - cleanup the element after a transition
// TODO: single var ; elem and options should have their own var in all case
$.fx.prototype.step = function( gotoEnd, transition ) {
  var t = jQuery.now(), done = true,
  // TRANSITION++
  // we could cache jQuery.support as well for jQuery.support.shrinkWrapBlocks
  //transition = jQuery.support.transition, // this lookup  can negatively impact perfs on unsupported browsers
  style = jQuery.style,
  prop = this.prop,
  hook;

  // TRANSITION++
  if ( transition || gotoEnd || t >= this.options.duration + this.startTime ) {
    if ( !transition ) {
      this.now = this.end;
      this.pos = this.state = 1;
      this.update();

    // Stop a transition halfway through
    } else if ( !gotoEnd ) {
    	// using affectedProperty could be useful here as well, to avoid jQuery.style and cssHooks call
	    if ( hook = jQuery.cssHooks[prop] ) {
	    	prop = hook.affectedProperty || prop;
	    }
	    // yes, stoping a transition halfway through should be as simple as setting a property to its current value.
	    // Try to call window.getComputedStyle() only once per element (in tick()?)
	    this.elem.style[prop] = window.getComputedStyle(this.elem)[prop];
    }

    this.options.curAnim[ this.prop ] = true;

    for ( var i in this.options.curAnim ) {
      if ( this.options.curAnim[i] !== true ) {
        done = false;
      }
    }

    if ( done ) {
      // Reset the overflow
      if ( this.options.overflow != null && !jQuery.support.shrinkWrapBlocks ) {
        var elem = this.elem,
          options = this.options;

        jQuery.each( [ "", "X", "Y" ], function (index, value) {
          elem.style[ "overflow" + value ] = options.overflow[index];
        } );
      }

      // Hide the element if the "hide" operation was done
      if ( this.options.hide ) {
        jQuery(this.elem).hide();
      }

      // Reset the properties, if the item has been hidden or shown
      if ( this.options.hide || this.options.show ) {
        for ( var p in this.options.curAnim ) {
          jQuery.style( this.elem, p, this.options.orig[p] );
        }
      }
      
      // TRANSITION++
      if ( transition ) {
      	this.elem.style[transition.name + 'Duration'] = '';
      	this.elem.style[transition.name + 'Property'] = '';
      	jQuery.event.remove( this.elem, transition.end +'.animate' );
      }

      // Execute the complete function
      this.options.complete.call( this.elem );
    }

    return false;

	} else {
    var n = t - this.startTime;
    this.state = n / this.options.duration;

    // Perform the easing function, defaults to swing
    var specialEasing = this.options.specialEasing && this.options.specialEasing[this.prop];
    var defaultEasing = this.options.easing || (jQuery.easing.swing ? "swing" : "linear");
    this.pos = jQuery.easing[specialEasing || defaultEasing](this.state, n, 0, 1, this.options.duration);
    this.now = this.start + ((this.end - this.start) * this.pos);

    // Perform the next step of the animation
    this.update();
  }

  return true;
};

// Copy this local method from effects.js
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

})(jQuery);