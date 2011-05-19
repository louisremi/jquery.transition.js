The jQuery Transition project
=============================

This project aims at making it easier to use CSS3 Transitions in compatible browsers.
It is now composed of two different scripts:

- With `jquery.transition.js` you can write animations using the usual `.animate()` method of jQuery. Modern browsers will run the animation using CSS3, older browsers will fall-back to the classical javascript way.
- With `jquery.hoverTransition.js` you can write pure CSS3 Transitions triggered by `:hover` and `:focus` pseudo-classes. In older browsers, the CSS will be translated to jQuery animations, provided that your CSS conforms to simple rules described below.

jquery.transition.js
====================

How to use it?
--------------

Once the plugin has been loaded in the page, the job is done.
The full jQuery animation API is still available and functionnal, in both transitions compatible browsers and incompatible ones.

When are CSS Transitions used?
-----------------------------

The plugin uses feature detection to turn transitions ON in the following browsers:

- Chrome
- Safari 4+
- Firefox 4+
- iOS Safari
- Android browsers

Although CSS3 transitions are implemented in Opera, the implementation has too many bugs to be usable from the DOM API.

Note that transitions are turned OFF under certain circumstencies:

- when the animated object is not an element
- when a special easing is used
- when a step function is used

How different is it?
--------------------

Unlike other transition polyfills, this plugin is not a monkey patch over jQuery animation mechanism.
It is actually a patched version of effects.js (animation component), stripped from the redundant code to make it a lightweight plugin.

The main benefit is that the **full jQuery API** is available.
Even better, it has been designed to be compatible with cssHooks.
The first compatible one is [jquery.transform.js](http://github.com/lrbabe/jquery.transform.js).
Others will follow.

jquery.transition.js has been tested against jQuery unit-tests, and only 8 of them fail, mostly for timing issues.
It benefits from the experience of writing [csstransition.net](http://www.csstransition.net/) to workaround implementation quirks.

When should I use it?
---------------------

In any case, it is a good practice to test animations both with and without the plugin to see if the benefit is real.

jquery.hoverTransition.js
=========================

How to use it?
--------------

The plugin first has to be loaded in the page.
Then the css part of the transition has to be written. Example:

    #menu li {
      padding-left: 0;
      -moz-transition: padding-left 500ms;
      -webkit-transition: padding-left 500ms;
      -o-transition: padding-left 500ms;
      -ms-transition: padding-left 500ms;
      transition-property: padding-left;
      transition-duration: 500ms;
    }
    
    #menu li:hover {
      padding-left: 20px;
    }

The previous CSS will produce animations working both in CSS3 Transitions compatible and incompatible browsers.

What are the limitations of this plugin
---------------------------------------

The successfully parse and translate your CSS, the plugin requires that you conform to the following rules:

- Use simple and coherent selectors (`#menu li` to declare the transition and `#menu li:hover` for the target style)
- Detail the transition properties (`transition-property: padding-left, ...` instead of `transition: all`)

Those rules can be considered *best practices*, sticking to them will help you write efficient and readable CSS code.
A detailed list of rules follows.

When is the jQuery fallback used?
---------------------------------

The plugin uses feature detection to fall-back to jQuery animation in the following browsers:

- Firefox 3.6-
- Safari 3-
- IE 6, 7 & 8

Author
======

[@louis_remi](http://twitter.com/louis_remi)

License
=======

MIT or GPL











Detailed limitations of jquery.hoverTransition.js
-------------------------------------------------

- As the name suggests, this plugin can only translate transitions that are thriggered by :hover (as well as :focus) pseudo classes
- The set of selectors you can use to define your animation is [limited to][]:
  - `#<id>:[hover|focus]` example: `#id:hover`
  - `#<id> [.<className>|<nodeName>]:[hover|focus]` examples: `#id .class:hover` or `#id li:hover`
  - `#<id> [.<className>|<nodeName>]:[hover|focus] [.<className>|<nodeName>]` examples: `#id .class:hover b` or `#id li:hover b`
  - `[.<className>|<nodeName>]:[hover|focus]` examples: `.class:hover` or `li:hover`
  - `[.<className>|<nodeName>]:[hover|focus] [.<className>|<nodeName>]` examples: `.class:hover b` or `li:hover b`
- The selector used to define the transition must be the same as the selector with the pseudo-class, minus the pseudo-class. 
  - Good: `#id li` and `#id li:hover`
  - Bad: `#id li` and `#id .class li:hover`
- The transition must be defined using non-vendor-prefixed and non-shorthand transition properties
  - Good: `transition-property: padding-left, font-size, ...; transition-duration: 500ms;`
  - bad: `transition: all 500ms`
- Only a single value can be used for `transition-duration`
- `transition-delay` and `transition-timing-function` are not implemented yet.

[limited to]: Other selectors might work but are not tested and can be considered inneficients.