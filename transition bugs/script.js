/*
 * Factorize as little code as possible, to make sure my code is not to blame.
 */

function $(id) {
	return document.getElementById(id);
}

// This has nothing to do with a unit test framework.
// Read "Secrets of The Javascript Ninja" if you're searching for examples.
function test(elem, testFn, successCb, failCb, delay) {
	if ( typeof successCb == 'number') {
		delay = successCb;
		successCb = undefined;
	}
	if ( typeof failCb == 'number') {
		delay = failCb;
		failCb = undefined;
	}
	var 
			id = elem.id
		, result = document
				.getElementById('_'+id)
					.getElementsByTagName('strong')[0]
		;
	function _test(elem, testFn, successCb, failCb) {
		var
				pass = testFn.apply(elem)
			,	id = elem.id
			, result = document
					.getElementById('_'+id)
						.getElementsByTagName('strong')[0]
			;
		result.innerHTML = pass? 'Works!' : 'Fails!';
		result.className = "result " + (pass? 'works' : 'fails');
		if ((pass && successCb) || (!pass && failCb)) {
			(pass? successCb : failCb).apply(elem);
		}
	}
	
	delay !== undefined? 
		setTimeout(function() {
			_test(elem, testFn, successCb, failCb);
		}, delay):
		_test(elem, testFn, successCb, failCb);
}

var 
		div = document.createElement('div')
	, divStyle = div.style
	, support = {
			transition:
			  divStyle.MozTransition === ''? {name: 'MozTransition', end: 'transitionend'} :
			  // Will ms add a prefix to the transitionend event?
			  (divStyle.MsTransition === ''? {name: 'MsTransition', end: 'msTransitionend'} :
			  (divStyle.WebkitTransition === ''? {name: 'WebkitTransition', end: 'webkitTransitionEnd'} :
			  (divStyle.OTransition === ''? {name: 'OTransition', end: 'oTransitionEnd'} :
			  (divStyle.transition === ''? {name: 'transition', end: 'transitionend'} :
			  false))))
		, transform:
			  divStyle.MozTransform === ''? 'MozTransform' :
			  (divStyle.MsTransform === ''? 'MsTransform' :
			  (divStyle.WebkitTransform === ''? 'WebkitTransform' : 
			  (divStyle.OTransform === ''? 'OTransform' :
			  (divStyle.transform === ''? 'transform' :
			  false))))
	}
	,	transition = support.transition.name
	, transitionend = support.transition.end
	, transform = support.transform
	, transformProp = transform.replace(/([A-Z])/g, '-$1').toLowerCase();
	;
	
function go() {
	var 
			expects = document.getElementsByClassName('expect')
		, i = expects.length
		;
	while ( i-- ) {
		expects[i].getElementsByTagName('pre')[0].innerHTML =
			expects[i].getElementsByTagName('script')[0].innerHTML; 
	}

	var 
			scripts = document.getElementsByTagName('script')
		, l = scripts.length
		, i = -1
		;
	while ( ++i < l ) {
		if ( scripts[i].type == 'text/test' ) {
			// is that ugly?
			eval(scripts[i].innerHTML);
		}
	}
	
	prettyPrint();
	
	// Wait before loading the annoying disqus script
	setTimeout(function() {
		/* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
    disqus_shortname = 'csstransition'; // required: replace example with your forum shortname

    // The following are highly recommended additional parameters. Remove the slashes in front to use.
    disqus_identifier = 'csstransition_index_0';
    disqus_url = 'http://lrbabe.github.com/jquery.transition.js/index.html';

    /* * * DON'T EDIT BELOW THIS LINE * * */
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	}, 2500);
}