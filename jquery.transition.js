/*
 * a patched animate mechanism for jQuery using CSS3 transtion power
 * 
 * this plugin is big, but it adds around 30 lines of code to existing jQuery code
 * unlike other solutions out there it works with all properties that you can possibly animate
 * and will eventually be compatible with cssHooks!
 * 
 * limitations:
 * - doesn't work with option.queue == false
 * - easing are not implemented yet
 * 
 * latest version and complete README available on Github:
 * https://github.com/lrbabe/jquery.transition.js
 * 
 * Copyright (c) 2010 Louis-Rémi Babé twitter.com/louis_remi
 * Licensed under the MIT license.
 * 
 * This saved you an hour of work? 
 * Send me music http://www.amazon.fr/wishlist/HNTU0468LQON
 *
 */
(function($, originalCustom, originalStop) {
  
var div = document.createElement('div'),
  divStyle = div.style,
  jQuery = $,
  // copy those local vars from effects.js
  elemdisplay = {},
  rfxtypes = /^(?:toggle|show|hide)$/,
  rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i;

$.support.transition = 
  divStyle.MozTransition === ''? {name: 'MozTransition', end: 'transitionend'} :
  // this might or might not work in the future
  (divStyle.MsTransition === ''? {name: 'MsTransition', end: 'msTransitionEnd'} :
  (divStyle.WebkitTransition === ''? {name: 'WebkitTransition', end: 'webkitTransitionEnd'} :
  (divStyle.OTransition === ''? {name: 'OTransition', end: 'oTransitionEnd'} :
  (divStyle.Transition === ''? {name: 'Transition', end: 'transitionEnd'} :
  false))));
  
// Fix cur to be cssHooks compatible
$.fx.prototype.cur = function() {
	if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) ) {
		return this.elem[ this.prop ];
	}

	var r = jQuery.css( this.elem, this.prop ),
		parsed = parseFloat( r );
	return isNaN( parsed )? r : parsed;
}
  
// Animate needs a small patch to take care of transition-property and transition-duration
// TODO: single var ; never use jQuery.each to iterate over prop 
$.fn.animate = function( prop, speed, easing, callback ) {
  var optall = jQuery.speed(speed, easing, callback);

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
      // we could cache jQuery.support as well for jQuery.support.inlineBlockNeedsLayout
      // we could also cache jQuery.camelCase and jQuery.style
      transition = jQuery.support.transition,
      hook;

    for ( p in prop ) {
      name = jQuery.camelCase( p );

      if ( p !== name ) {
        prop[ name ] = prop[ p ];
        delete prop[ p ];
        p = name;
      }
      
      // TRANSITION++
      props.push(p);

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
				hook = jQuery.cssHooks[name];
      	// affectedProperty could also be named "targetProp", "transitionEquivalent", or anything, really.
      	props[hook? hook.affectedProperty || name : name] = e;
      }
    });
    
    // TRANSITION++
    if ( transition ) {
    	jQuery.event.add( this, transition.end +'.animate', function( e ) {
    		// and this should call fx.step( gotoEnd ), one property at a time.
    		props[jQuery.camelCase(e.originalEvent.propertyName)].step( true );
    	});
    }
    
    // For JS strict compliance
    return true;
  });
};

// custom can be simplified
if ($.support.transition)
$.fx.prototype.custom = function( from, to, unit ) {
  var self = this;
  function t( gotoEnd ) {
    return self.step(gotoEnd);
  }
  t.elem = self.elem;
  
  //console.info(this.prop)
  //console.warn(this.elem.WebkitTransitionProperty, this.elem.WebkitTransitionDuration)
  
  // use the power of cssHooks
  setTimeout(function() {
  	jQuery.style(self.elem, self.prop, to + unit);
  });
  
  
  jQuery.timers.push(t);
};

// in step, only the part taking care of animation stopped halfway through need to be forked
// TODO: single var ; elem and options should have their own var in all case
$.fx.prototype.step = function( gotoEnd ) {
  var t = jQuery.now(), done = true,
  // TRANSITION++
  // we could cache jQuery.support as well for jQuery.support.shrinkWrapBlocks
  transition = jQuery.support.transition,
  style = jQuery.style,
  prop = this.prop,
  hook;

  if ( gotoEnd || t >= this.options.duration + this.startTime ) {
    // TRANSITION++
    if ( !transition ) {
      this.now = this.end;
      this.pos = this.state = 1;
      this.update();
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

  } else if ( transition ) {
    // using affectedProperty could be useful here as well, to avoid jQuery.style and cssHooks call
    if ( hook = jQuery.cssHooks[prop] ) {
    	prop = hook.affectedProperty || prop;
    }
    // yes, stoping a transition halfway through should be as simple as setting a property to its current value.
    this.elem.style[prop] = this.elem.style[prop];
  
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

})(jQuery, jQuery.fx.prototype.custom, jQuery.fn.stop);