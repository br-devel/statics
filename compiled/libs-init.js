//@codekit-prepend "../labjs/LAB.js";
//@codekit-prepend "../js/md5.js";

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
}