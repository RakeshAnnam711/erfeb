'use strict';

/*  The purpose of this file is to provide a means for hitting a breakpoint from an isscript block
    so when the server is building out a template, one could pause and inspect the value of a variable.

    Usage:
	Reference this script from within an isscript element.
	var breaker = require('* /cartridge/scripts/util/breaker.js');
	(note there is an added space btw the * and the / because in a comment block)
	// Theoretically, the alias defined in the package.json might be an option (it works in .scss files)
	//var breaker = require('rvw_autobahn_core/cartridge/scripts/util/breaker.js');
	// However, it does not seem to work in .isml files

    // Then call inspect and pass whatever object you want to take a look at
    breaker.Inspect(pdict);
*/

// Public Functions
exports.Inspect = inspect;

/* This function doesn't alter any data, just provides a place to insert a break point. */
function inspect(valueToDebug) {
	var typeofObject = null;
	if (valueToDebug !== null) {
		typeofObject = typeof valueToDebug;
	}
	if (typeofObject !== null) {
		return typeofObject;
	}
}