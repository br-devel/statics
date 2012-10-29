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

	if (window._metricas.push == Array.prototype.push) {
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

_BR.runMetricasPVs = function () {
	//change and execute Metricas
	window._metpvs = window._metpvs || [];

	window._metpvs = _.uniq(window._metpvs);

	if (window._metpvs.push == Array.prototype.push) {
		for (var i in window._metpvs) {
			if (window._metpvs.hasOwnProperty(i)) {
				var x = window._metpvs[i];
				try {
					$R.pv(x);
				} catch (exc) {
					try {
						console.log('error metpvs ' + exc.message);
					} catch (exc2) {
						//
					}

				}
			}
		}
	}

	window._metpvs.push = function (x) {
		try {
			$R.pv(x);
		} catch (exc) {
			try {
				console.log('error metpvs ' + exc.message);
			} catch (exc2) {
				//
			}
		}
		return Array.prototype.push.apply(this, arguments);
	}

}

_BR.runMetricasEVs = function () {
	//change and execute Metricas
	window._metevs = window._metevs || [];

	window._metevs = _.uniq(window._metevs);

	if (window._metevs.push == Array.prototype.push) {
		for (var i in window._metevs) {
			if (window._metevs.hasOwnProperty(i)) {
				var x = window._metevs[i];
				try {
					$R.ev(x);
				} catch (exc) {
					try {
						console.log('error metevs ' + exc.message);
					} catch (exc2) {
						//
					}

				}
			}
		}
	}

	window._metevs.push = function (x) {
		try {
			$R.ev(x);
		} catch (exc) {
			try {
				console.log('error metevs ' + exc.message);
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

_BR.getAllClasses = function () {
	var classes = {};
	$('*').each(function () {
		var cl = $(this).attr('class');
		if (cl) {
			$(cl.split(/\s+/)).each(function () {
				if (this !== '') {
					classes[this] = classes[this] || 0;
					classes[this] += 1;
				}
			});
		}
	});
	return classes;
}

