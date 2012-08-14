//@codekit-prepend "../underscore/underscore.js";
//@codekit-prepend "../toolbox/toolbox.js";
//@codekit-prepend "../jquery/jquery.js";
//@codekit-prepend "../jquery/jquery.json.js";
//@codekit-prepend "../jquery/jquery.cookie.js";
//@codekit-prepend "../jquery/jquery.base64.js";
//@codekit-prepend "../jquery/jquery.ba-bbq.js";
//@codekit-prepend "../jquery/jquery.blockUI.js";
//@codekit-prepend "../jquery/jquery.selectboxes.js";

var _BR = (window['_BR'] === Object(window['_BR'])) ? window['_BR'] : {};

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

	//remove duplicated
	window._preloads = _.uniq(window._preloads);

	for (var i in window._preloads) {
		if (window._preloads.hasOwnProperty(i)) {
			var x = window._preloads[i];
			try {
				if (_.isArray(x)) {
					$R.preload.apply($R, x);
				} else {
					$R.preload(x);
				}

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
			if (arguments.length == 1) {
				if (_.isArray(x)) {
					$R.preload.apply($R, x);
				} else {
					$R.preload(x);
				}
			} else {
				$R.preload.apply($R, arguments);
			}

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


