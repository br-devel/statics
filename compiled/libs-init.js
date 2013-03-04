//@codekit-prepend "../labjs/LAB.js";
//@codekit-prepend "../js/md5.js";

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n != 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	}
}

var _BR = (window['_BR'] === Object(window['_BR'])) ? window['_BR'] : {};

_BR.getScriptPreloadeds = function () {
	//change and execute Metricas
	window._preloads = window._preloads || [];
	var params = [];
	for (var i in window._preloads) {
		if (window._preloads.hasOwnProperty(i)) {
			var x = window._preloads[i];
			var name;
			try {
				if (Object.prototype.toString.call(x) == '[object Array]') {
					name = x[0];
				} else if (Object.prototype.toString.call(x) == '[object String]') {
					name = x;
				}

				if (name && params.indexOf(name) == -1) {
					params.push(name);
				}
			} catch (exc) {
				try {
					console.log('error get script preloadeds ' + exc.message);
				} catch (exc2) {
					//
				}

			}
		}
	}

	if (params.length > 0) {
		var queryStringParams = '';
		var first = true;
		params.sort();
		for (var j in params) {
			if (params.hasOwnProperty(j)) {
				queryStringParams += (first ? '?' : '&');
				queryStringParams += 'classes[]=' + params[j];
			}
			first = false;
		}
		var md5Params = md5(params.toString());
		return _ENV.BASE_URL + "/scripts/gen/" + md5Params + ".js" + queryStringParams;
	} else {
		return false;
	}
};