jQuery.transition.js
====================

jquery.transitions.js makes it easy to use CSS3 Transitions in compatible browsers
by replacing the classical `setInterval` based animation logic.

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

Author
------

[@louis_remi](http://twitter.com/louis_remi)

License
-------

MIT