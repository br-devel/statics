//@codekit-prepend "../underscore/underscore.js";
//@codekit-prepend "../toolbox/toolbox.js";
//@codekit-prepend "../jquery/jquery.js";
//@codekit-prepend "../jquery/jquery.json.js";
//@codekit-prepend "../jquery/jquery.ba-bbq.js";
//@codekit-prepend "../jquery/jquery.base64.js";
//@codekit-prepend "../jquery/jquery.cookie.js";
//@codekit-prepend "../jquery/jquery.selectboxes.js";
//@codekit-prepend "../js/md5.js";

var _BR = _.isObject(window['_BR']) ? window['_BR'] : {};

_BR.runMetricas = function () {
	//change and execute Metricas
	window._metricas = window._metricas || [];

	for (var i in window._metricas) {
		if (window._metricas.hasOwnProperty(i)) {
			var x = window._metricas[i];
			try {
				$.ajax({url:x, cache:false});
			} catch (exc) {
				try {
					console.log('error metricas ' + exc.message);
				} catch (exc2) {
					//
				}

			}
		}
	}

	window._metricas.push = function (x) {
		try {
			$.ajax({url:x, cache:false});
		} catch (exc) {
			try {
				console.log('error metricas ' + exc.message);
			} catch (exc2) {
				//
			}
		}
		return Array.prototype.push.apply(this, arguments);
	}

}


_BR.runPreloads = function () {
	//change and execute Metricas
	window._preloads = window._preloads || [];

	for (var i in window._preloads) {
		if (window._preloads.hasOwnProperty(i)) {
			var x = window._preloads[i];
			try {
				$R.preload(x);
			} catch (exc) {
				try {
					console.log('error preload ' + exc.message);
				} catch (exc2) {
					//
				}

			}
		}
	}

	window._preloads.push = function (x) {
		try {
			$R.preload(x);
		} catch (exc) {
			try {
				console.log('error preload ' + exc.message);
			} catch (exc2) {
				//
			}
		}
		return Array.prototype.push.apply(this, arguments);
	}

}

_BR.getScriptPreloadeds = function () {
	//change and execute Metricas
	window._preloads = window._preloads || [];
	var params = [];
	for (var i in window._preloads) {
		if (window._preloads.hasOwnProperty(i)) {
			var x = window._preloads[i];
			try {
				params.push(x);
			} catch (exc) {
				try {
					console.log('error get script preloadeds ' + exc.message);
				} catch (exc2) {
					//
				}

			}
		}
	}

	if(_.size(params)){
		var jsonParams = $.toJSON(params);
		var md5Params = md5(jsonParams);
		var queryStringParams = $.param({_loads:params});
		return _ENV.BASE_URL + "/scripts/gen/" + md5Params + ".js?" + queryStringParams;
	} else {
		return false;
	}
}

