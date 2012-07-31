//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function () {

	// Baseline setup
	// --------------

	// Establish the root object, `window` in the browser, or `global` on the server.
	var root = this;

	// Save the previous value of the `_` variable.
	var previousUnderscore = root._;

	// Establish the object that gets returned to break out of a loop iteration.
	var breaker = {};

	// Save bytes in the minified (but not gzipped) version:
	var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

	// Create quick reference variables for speed access to core prototypes.
	var slice = ArrayProto.slice, unshift = ArrayProto.unshift, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;

	// All **ECMAScript 5** native function implementations that we hope to use
	// are declared here.
	var nativeForEach = ArrayProto.forEach, nativeMap = ArrayProto.map, nativeReduce = ArrayProto.reduce, nativeReduceRight = ArrayProto.reduceRight, nativeFilter = ArrayProto.filter, nativeEvery = ArrayProto.every, nativeSome = ArrayProto.some, nativeIndexOf = ArrayProto.indexOf, nativeLastIndexOf = ArrayProto.lastIndexOf, nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;

	// Create a safe reference to the Underscore object for use below.
	var _ = function (obj) {
		return new wrapper(obj);
	};

	// Export the Underscore object for **Node.js**, with
	// backwards-compatibility for the old `require()` API. If we're in
	// the browser, add `_` as a global object via a string identifier,
	// for Closure Compiler "advanced" mode.
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = _;
		}
		exports._ = _;
	} else {
		root['_'] = _;
	}

	// Current version.
	_.VERSION = '1.3.3';

	// Collection Functions
	// --------------------

	// The cornerstone, an `each` implementation, aka `forEach`.
	// Handles objects with the built-in `forEach`, arrays, and raw objects.
	// Delegates to **ECMAScript 5**'s native `forEach` if available.
	var each = _.each = _.forEach = function (obj, iterator, context) {
		if (obj == null) return;
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
			}
		} else {
			for (var key in obj) {
				if (_.has(obj, key)) {
					if (iterator.call(context, obj[key], key, obj) === breaker) return;
				}
			}
		}
	};

	// Return the results of applying the iterator to each element.
	// Delegates to **ECMAScript 5**'s native `map` if available.
	_.map = _.collect = function (obj, iterator, context) {
		var results = [];
		if (obj == null) return results;
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
		each(obj, function (value, index, list) {
			results[results.length] = iterator.call(context, value, index, list);
		});
		if (obj.length === +obj.length) results.length = obj.length;
		return results;
	};

	// **Reduce** builds up a single result from a list of values, aka `inject`,
	// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
	_.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
		var initial = arguments.length > 2;
		if (obj == null) obj = [];
		if (nativeReduce && obj.reduce === nativeReduce) {
			if (context) iterator = _.bind(iterator, context);
			return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
		}
		each(obj, function (value, index, list) {
			if (!initial) {
				memo = value;
				initial = true;
			} else {
				memo = iterator.call(context, memo, value, index, list);
			}
		});
		if (!initial) throw new TypeError('Reduce of empty array with no initial value');
		return memo;
	};

	// The right-associative version of reduce, also known as `foldr`.
	// Delegates to **ECMAScript 5**'s native `reduceRight` if available.
	_.reduceRight = _.foldr = function (obj, iterator, memo, context) {
		var initial = arguments.length > 2;
		if (obj == null) obj = [];
		if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
			if (context) iterator = _.bind(iterator, context);
			return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
		}
		var reversed = _.toArray(obj).reverse();
		if (context && !initial) iterator = _.bind(iterator, context);
		return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
	};

	// Return the first value which passes a truth test. Aliased as `detect`.
	_.find = _.detect = function (obj, iterator, context) {
		var result;
		any(obj, function (value, index, list) {
			if (iterator.call(context, value, index, list)) {
				result = value;
				return true;
			}
		});
		return result;
	};

	// Return all the elements that pass a truth test.
	// Delegates to **ECMAScript 5**'s native `filter` if available.
	// Aliased as `select`.
	_.filter = _.select = function (obj, iterator, context) {
		var results = [];
		if (obj == null) return results;
		if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
		each(obj, function (value, index, list) {
			if (iterator.call(context, value, index, list)) results[results.length] = value;
		});
		return results;
	};

	// Return all the elements for which a truth test fails.
	_.reject = function (obj, iterator, context) {
		var results = [];
		if (obj == null) return results;
		each(obj, function (value, index, list) {
			if (!iterator.call(context, value, index, list)) results[results.length] = value;
		});
		return results;
	};

	// Determine whether all of the elements match a truth test.
	// Delegates to **ECMAScript 5**'s native `every` if available.
	// Aliased as `all`.
	_.every = _.all = function (obj, iterator, context) {
		var result = true;
		if (obj == null) return result;
		if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
		each(obj, function (value, index, list) {
			if (!(result = result && iterator.call(context, value, index, list))) return breaker;
		});
		return !!result;
	};

	// Determine if at least one element in the object matches a truth test.
	// Delegates to **ECMAScript 5**'s native `some` if available.
	// Aliased as `any`.
	var any = _.some = _.any = function (obj, iterator, context) {
		iterator || (iterator = _.identity);
		var result = false;
		if (obj == null) return result;
		if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
		each(obj, function (value, index, list) {
			if (result || (result = iterator.call(context, value, index, list))) return breaker;
		});
		return !!result;
	};

	// Determine if a given value is included in the array or object using `===`.
	// Aliased as `contains`.
	_.include = _.contains = function (obj, target) {
		var found = false;
		if (obj == null) return found;
		if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
		found = any(obj, function (value) {
			return value === target;
		});
		return found;
	};

	// Invoke a method (with arguments) on every item in a collection.
	_.invoke = function (obj, method) {
		var args = slice.call(arguments, 2);
		return _.map(obj, function (value) {
			return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
		});
	};

	// Convenience version of a common use case of `map`: fetching a property.
	_.pluck = function (obj, key) {
		return _.map(obj, function (value) {
			return value[key];
		});
	};

	// Return the maximum element or (element-based computation).
	_.max = function (obj, iterator, context) {
		if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
		if (!iterator && _.isEmpty(obj)) return -Infinity;
		var result = {computed:-Infinity};
		each(obj, function (value, index, list) {
			var computed = iterator ? iterator.call(context, value, index, list) : value;
			computed >= result.computed && (result = {value:value, computed:computed});
		});
		return result.value;
	};

	// Return the minimum element (or element-based computation).
	_.min = function (obj, iterator, context) {
		if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
		if (!iterator && _.isEmpty(obj)) return Infinity;
		var result = {computed:Infinity};
		each(obj, function (value, index, list) {
			var computed = iterator ? iterator.call(context, value, index, list) : value;
			computed < result.computed && (result = {value:value, computed:computed});
		});
		return result.value;
	};

	// Shuffle an array.
	_.shuffle = function (obj) {
		var shuffled = [], rand;
		each(obj, function (value, index, list) {
			rand = Math.floor(Math.random() * (index + 1));
			shuffled[index] = shuffled[rand];
			shuffled[rand] = value;
		});
		return shuffled;
	};

	// Sort the object's values by a criterion produced by an iterator.
	_.sortBy = function (obj, val, context) {
		var iterator = _.isFunction(val) ? val : function (obj) {
			return obj[val];
		};
		return _.pluck(_.map(obj,function (value, index, list) {
			return {
				value:value,
				criteria:iterator.call(context, value, index, list)
			};
		}).sort(function (left, right) {
					var a = left.criteria, b = right.criteria;
					if (a === void 0) return 1;
					if (b === void 0) return -1;
					return a < b ? -1 : a > b ? 1 : 0;
				}), 'value');
	};

	// Groups the object's values by a criterion. Pass either a string attribute
	// to group by, or a function that returns the criterion.
	_.groupBy = function (obj, val) {
		var result = {};
		var iterator = _.isFunction(val) ? val : function (obj) {
			return obj[val];
		};
		each(obj, function (value, index) {
			var key = iterator(value, index);
			(result[key] || (result[key] = [])).push(value);
		});
		return result;
	};

	// Use a comparator function to figure out at what index an object should
	// be inserted so as to maintain order. Uses binary search.
	_.sortedIndex = function (array, obj, iterator) {
		iterator || (iterator = _.identity);
		var low = 0, high = array.length;
		while (low < high) {
			var mid = (low + high) >> 1;
			iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
		}
		return low;
	};

	// Safely convert anything iterable into a real, live array.
	_.toArray = function (obj) {
		if (!obj)                                     return [];
		if (_.isArray(obj))                           return slice.call(obj);
		if (_.isArguments(obj))                       return slice.call(obj);
		if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
		return _.values(obj);
	};

	// Return the number of elements in an object.
	_.size = function (obj) {
		return _.isArray(obj) ? obj.length : _.keys(obj).length;
	};

	// Array Functions
	// ---------------

	// Get the first element of an array. Passing **n** will return the first N
	// values in the array. Aliased as `head` and `take`. The **guard** check
	// allows it to work with `_.map`.
	_.first = _.head = _.take = function (array, n, guard) {
		return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
	};

	// Returns everything but the last entry of the array. Especcialy useful on
	// the arguments object. Passing **n** will return all the values in
	// the array, excluding the last N. The **guard** check allows it to work with
	// `_.map`.
	_.initial = function (array, n, guard) {
		return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
	};

	// Get the last element of an array. Passing **n** will return the last N
	// values in the array. The **guard** check allows it to work with `_.map`.
	_.last = function (array, n, guard) {
		if ((n != null) && !guard) {
			return slice.call(array, Math.max(array.length - n, 0));
		} else {
			return array[array.length - 1];
		}
	};

	// Returns everything but the first entry of the array. Aliased as `tail`.
	// Especially useful on the arguments object. Passing an **index** will return
	// the rest of the values in the array from that index onward. The **guard**
	// check allows it to work with `_.map`.
	_.rest = _.tail = function (array, index, guard) {
		return slice.call(array, (index == null) || guard ? 1 : index);
	};

	// Trim out all falsy values from an array.
	_.compact = function (array) {
		return _.filter(array, function (value) {
			return !!value;
		});
	};

	// Return a completely flattened version of an array.
	_.flatten = function (array, shallow) {
		return _.reduce(array, function (memo, value) {
			if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
			memo[memo.length] = value;
			return memo;
		}, []);
	};

	// Return a version of the array that does not contain the specified value(s).
	_.without = function (array) {
		return _.difference(array, slice.call(arguments, 1));
	};

	// Produce a duplicate-free version of the array. If the array has already
	// been sorted, you have the option of using a faster algorithm.
	// Aliased as `unique`.
	_.uniq = _.unique = function (array, isSorted, iterator) {
		var initial = iterator ? _.map(array, iterator) : array;
		var results = [];
		// The `isSorted` flag is irrelevant if the array only contains two elements.
		if (array.length < 3) isSorted = true;
		_.reduce(initial, function (memo, value, index) {
			if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
				memo.push(value);
				results.push(array[index]);
			}
			return memo;
		}, []);
		return results;
	};

	// Produce an array that contains the union: each distinct element from all of
	// the passed-in arrays.
	_.union = function () {
		return _.uniq(_.flatten(arguments, true));
	};

	// Produce an array that contains every item shared between all the
	// passed-in arrays. (Aliased as "intersect" for back-compat.)
	_.intersection = _.intersect = function (array) {
		var rest = slice.call(arguments, 1);
		return _.filter(_.uniq(array), function (item) {
			return _.every(rest, function (other) {
				return _.indexOf(other, item) >= 0;
			});
		});
	};

	// Take the difference between one array and a number of other arrays.
	// Only the elements present in just the first array will remain.
	_.difference = function (array) {
		var rest = _.flatten(slice.call(arguments, 1), true);
		return _.filter(array, function (value) {
			return !_.include(rest, value);
		});
	};

	// Zip together multiple lists into a single array -- elements that share
	// an index go together.
	_.zip = function () {
		var args = slice.call(arguments);
		var length = _.max(_.pluck(args, 'length'));
		var results = new Array(length);
		for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
		return results;
	};

	// If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
	// we need this function. Return the position of the first occurrence of an
	// item in an array, or -1 if the item is not included in the array.
	// Delegates to **ECMAScript 5**'s native `indexOf` if available.
	// If the array is large and already in sort order, pass `true`
	// for **isSorted** to use binary search.
	_.indexOf = function (array, item, isSorted) {
		if (array == null) return -1;
		var i, l;
		if (isSorted) {
			i = _.sortedIndex(array, item);
			return array[i] === item ? i : -1;
		}
		if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
		for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
		return -1;
	};

	// Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
	_.lastIndexOf = function (array, item) {
		if (array == null) return -1;
		if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
		var i = array.length;
		while (i--) if (i in array && array[i] === item) return i;
		return -1;
	};

	// Generate an integer Array containing an arithmetic progression. A port of
	// the native Python `range()` function. See
	// [the Python documentation](http://docs.python.org/library/functions.html#range).
	_.range = function (start, stop, step) {
		if (arguments.length <= 1) {
			stop = start || 0;
			start = 0;
		}
		step = arguments[2] || 1;

		var len = Math.max(Math.ceil((stop - start) / step), 0);
		var idx = 0;
		var range = new Array(len);

		while (idx < len) {
			range[idx++] = start;
			start += step;
		}

		return range;
	};

	// Function (ahem) Functions
	// ------------------

	// Reusable constructor function for prototype setting.
	var ctor = function () {
	};

	// Create a function bound to a given object (assigning `this`, and arguments,
	// optionally). Binding with arguments is also known as `curry`.
	// Delegates to **ECMAScript 5**'s native `Function.bind` if available.
	// We check for `func.bind` first, to fail fast when `func` is undefined.
	_.bind = function bind(func, context) {
		var bound, args;
		if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
		if (!_.isFunction(func)) throw new TypeError;
		args = slice.call(arguments, 2);
		return bound = function () {
			if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
			ctor.prototype = func.prototype;
			var self = new ctor;
			var result = func.apply(self, args.concat(slice.call(arguments)));
			if (Object(result) === result) return result;
			return self;
		};
	};

	// Bind all of an object's methods to that object. Useful for ensuring that
	// all callbacks defined on an object belong to it.
	_.bindAll = function (obj) {
		var funcs = slice.call(arguments, 1);
		if (funcs.length == 0) funcs = _.functions(obj);
		each(funcs, function (f) {
			obj[f] = _.bind(obj[f], obj);
		});
		return obj;
	};

	// Memoize an expensive function by storing its results.
	_.memoize = function (func, hasher) {
		var memo = {};
		hasher || (hasher = _.identity);
		return function () {
			var key = hasher.apply(this, arguments);
			return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
		};
	};

	// Delays a function for the given number of milliseconds, and then calls
	// it with the arguments supplied.
	_.delay = function (func, wait) {
		var args = slice.call(arguments, 2);
		return setTimeout(function () {
			return func.apply(null, args);
		}, wait);
	};

	// Defers a function, scheduling it to run after the current call stack has
	// cleared.
	_.defer = function (func) {
		return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
	};

	// Returns a function, that, when invoked, will only be triggered at most once
	// during a given window of time.
	_.throttle = function (func, wait) {
		var context, args, timeout, throttling, more, result;
		var whenDone = _.debounce(function () {
			more = throttling = false;
		}, wait);
		return function () {
			context = this;
			args = arguments;
			var later = function () {
				timeout = null;
				if (more) func.apply(context, args);
				whenDone();
			};
			if (!timeout) timeout = setTimeout(later, wait);
			if (throttling) {
				more = true;
			} else {
				result = func.apply(context, args);
			}
			whenDone();
			throttling = true;
			return result;
		};
	};

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	_.debounce = function (func, wait, immediate) {
		var timeout;
		return function () {
			var context = this, args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			if (immediate && !timeout) func.apply(context, args);
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	};

	// Returns a function that will be executed at most one time, no matter how
	// often you call it. Useful for lazy initialization.
	_.once = function (func) {
		var ran = false, memo;
		return function () {
			if (ran) return memo;
			ran = true;
			return memo = func.apply(this, arguments);
		};
	};

	// Returns the first function passed as an argument to the second,
	// allowing you to adjust arguments, run code before and after, and
	// conditionally execute the original function.
	_.wrap = function (func, wrapper) {
		return function () {
			var args = [func].concat(slice.call(arguments, 0));
			return wrapper.apply(this, args);
		};
	};

	// Returns a function that is the composition of a list of functions, each
	// consuming the return value of the function that follows.
	_.compose = function () {
		var funcs = arguments;
		return function () {
			var args = arguments;
			for (var i = funcs.length - 1; i >= 0; i--) {
				args = [funcs[i].apply(this, args)];
			}
			return args[0];
		};
	};

	// Returns a function that will only be executed after being called N times.
	_.after = function (times, func) {
		if (times <= 0) return func();
		return function () {
			if (--times < 1) {
				return func.apply(this, arguments);
			}
		};
	};

	// Object Functions
	// ----------------

	// Retrieve the names of an object's properties.
	// Delegates to **ECMAScript 5**'s native `Object.keys`
	_.keys = nativeKeys || function (obj) {
		if (obj !== Object(obj)) throw new TypeError('Invalid object');
		var keys = [];
		for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
		return keys;
	};

	// Retrieve the values of an object's properties.
	_.values = function (obj) {
		return _.map(obj, _.identity);
	};

	// Return a sorted list of the function names available on the object.
	// Aliased as `methods`
	_.functions = _.methods = function (obj) {
		var names = [];
		for (var key in obj) {
			if (_.isFunction(obj[key])) names.push(key);
		}
		return names.sort();
	};

	// Extend a given object with all the properties in passed-in object(s).
	_.extend = function (obj) {
		each(slice.call(arguments, 1), function (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		});
		return obj;
	};

	// Return a copy of the object only containing the whitelisted properties.
	_.pick = function (obj) {
		var result = {};
		each(_.flatten(slice.call(arguments, 1)), function (key) {
			if (key in obj) result[key] = obj[key];
		});
		return result;
	};

	// Fill in a given object with default properties.
	_.defaults = function (obj) {
		each(slice.call(arguments, 1), function (source) {
			for (var prop in source) {
				if (obj[prop] == null) obj[prop] = source[prop];
			}
		});
		return obj;
	};

	// Create a (shallow-cloned) duplicate of an object.
	_.clone = function (obj) {
		if (!_.isObject(obj)) return obj;
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	};

	// Invokes interceptor with the obj, and then returns obj.
	// The primary purpose of this method is to "tap into" a method chain, in
	// order to perform operations on intermediate results within the chain.
	_.tap = function (obj, interceptor) {
		interceptor(obj);
		return obj;
	};

	// Internal recursive comparison function.
	function eq(a, b, stack) {
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
		if (a === b) return a !== 0 || 1 / a == 1 / b;
		// A strict comparison is necessary because `null == undefined`.
		if (a == null || b == null) return a === b;
		// Unwrap any wrapped objects.
		if (a._chain) a = a._wrapped;
		if (b._chain) b = b._wrapped;
		// Invoke a custom `isEqual` method if one is provided.
		if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
		if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className != toString.call(b)) return false;
		switch (className) {
			// Strings, numbers, dates, and booleans are compared by value.
			case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return a == String(b);
			case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
				// other numeric values.
				return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
			case '[object Date]':
			case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a == +b;
			// RegExps are compared by their source patterns and flags.
			case '[object RegExp]':
				return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
		}
		if (typeof a != 'object' || typeof b != 'object') return false;
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
		var length = stack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (stack[length] == a) return true;
		}
		// Add the first object to the stack of traversed objects.
		stack.push(a);
		var size = 0, result = true;
		// Recursively compare objects and arrays.
		if (className == '[object Array]') {
			// Compare array lengths to determine if a deep comparison is necessary.
			size = a.length;
			result = size == b.length;
			if (result) {
				// Deep compare the contents, ignoring non-numeric properties.
				while (size--) {
					// Ensure commutative equality for sparse arrays.
					if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
				}
			}
		} else {
			// Objects with different constructors are not equivalent.
			if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
			// Deep compare objects.
			for (var key in a) {
				if (_.has(a, key)) {
					// Count the expected number of properties.
					size++;
					// Deep compare each member.
					if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
				}
			}
			// Ensure that both objects contain the same number of properties.
			if (result) {
				for (key in b) {
					if (_.has(b, key) && !(size--)) break;
				}
				result = !size;
			}
		}
		// Remove the first object from the stack of traversed objects.
		stack.pop();
		return result;
	}

	// Perform a deep comparison to check if two objects are equal.
	_.isEqual = function (a, b) {
		return eq(a, b, []);
	};

	// Is a given array, string, or object empty?
	// An "empty" object has no enumerable own-properties.
	_.isEmpty = function (obj) {
		if (obj == null) return true;
		if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
		for (var key in obj) if (_.has(obj, key)) return false;
		return true;
	};

	// Is a given value a DOM element?
	_.isElement = function (obj) {
		return !!(obj && obj.nodeType == 1);
	};

	// Is a given value an array?
	// Delegates to ECMA5's native Array.isArray
	_.isArray = nativeIsArray || function (obj) {
		return toString.call(obj) == '[object Array]';
	};

	// Is a given variable an object?
	_.isObject = function (obj) {
		return obj === Object(obj);
	};

	// Is a given variable an arguments object?
	_.isArguments = function (obj) {
		return toString.call(obj) == '[object Arguments]';
	};
	if (!_.isArguments(arguments)) {
		_.isArguments = function (obj) {
			return !!(obj && _.has(obj, 'callee'));
		};
	}

	// Is a given value a function?
	_.isFunction = function (obj) {
		return toString.call(obj) == '[object Function]';
	};

	// Is a given value a string?
	_.isString = function (obj) {
		return toString.call(obj) == '[object String]';
	};

	// Is a given value a number?
	_.isNumber = function (obj) {
		return toString.call(obj) == '[object Number]';
	};

	// Is a given object a finite number?
	_.isFinite = function (obj) {
		return _.isNumber(obj) && isFinite(obj);
	};

	// Is the given value `NaN`?
	_.isNaN = function (obj) {
		// `NaN` is the only value for which `===` is not reflexive.
		return obj !== obj;
	};

	// Is a given value a boolean?
	_.isBoolean = function (obj) {
		return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	};

	// Is a given value a date?
	_.isDate = function (obj) {
		return toString.call(obj) == '[object Date]';
	};

	// Is the given value a regular expression?
	_.isRegExp = function (obj) {
		return toString.call(obj) == '[object RegExp]';
	};

	// Is a given value equal to null?
	_.isNull = function (obj) {
		return obj === null;
	};

	// Is a given variable undefined?
	_.isUndefined = function (obj) {
		return obj === void 0;
	};

	// Has own property?
	_.has = function (obj, key) {
		return hasOwnProperty.call(obj, key);
	};

	// Utility Functions
	// -----------------

	// Run Underscore.js in *noConflict* mode, returning the `_` variable to its
	// previous owner. Returns a reference to the Underscore object.
	_.noConflict = function () {
		root._ = previousUnderscore;
		return this;
	};

	// Keep the identity function around for default iterators.
	_.identity = function (value) {
		return value;
	};

	// Run a function **n** times.
	_.times = function (n, iterator, context) {
		for (var i = 0; i < n; i++) iterator.call(context, i);
	};

	// Escape a string for HTML interpolation.
	_.escape = function (string) {
		return ('' + string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
	};

	// If the value of the named property is a function then invoke it;
	// otherwise, return it.
	_.result = function (object, property) {
		if (object == null) return null;
		var value = object[property];
		return _.isFunction(value) ? value.call(object) : value;
	};

	// Add your own custom functions to the Underscore object, ensuring that
	// they're correctly added to the OOP wrapper as well.
	_.mixin = function (obj) {
		each(_.functions(obj), function (name) {
			addToWrapper(name, _[name] = obj[name]);
		});
	};

	// Generate a unique integer id (unique within the entire client session).
	// Useful for temporary DOM ids.
	var idCounter = 0;
	_.uniqueId = function (prefix) {
		var id = idCounter++;
		return prefix ? prefix + id : id;
	};

	// By default, Underscore uses ERB-style template delimiters, change the
	// following template settings to use alternative delimiters.
	_.templateSettings = {
		evaluate:/<%([\s\S]+?)%>/g,
		interpolate:/<%=([\s\S]+?)%>/g,
		escape:/<%-([\s\S]+?)%>/g
	};

	// When customizing `templateSettings`, if you don't want to define an
	// interpolation, evaluation or escaping regex, we need one that is
	// guaranteed not to match.
	var noMatch = /.^/;

	// Certain characters need to be escaped so that they can be put into a
	// string literal.
	var escapes = {
		'\\':'\\',
		"'":"'",
		'r':'\r',
		'n':'\n',
		't':'\t',
		'u2028':'\u2028',
		'u2029':'\u2029'
	};

	for (var p in escapes) escapes[escapes[p]] = p;
	var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
	var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

	// Within an interpolation, evaluation, or escaping, remove HTML escaping
	// that had been previously added.
	var unescape = function (code) {
		return code.replace(unescaper, function (match, escape) {
			return escapes[escape];
		});
	};

	// JavaScript micro-templating, similar to John Resig's implementation.
	// Underscore templating handles arbitrary delimiters, preserves whitespace,
	// and correctly escapes quotes within interpolated code.
	_.template = function (text, data, settings) {
		settings = _.defaults(settings || {}, _.templateSettings);

		// Compile the template source, taking care to escape characters that
		// cannot be included in a string literal and then unescape them in code
		// blocks.
		var source = "__p+='" + text.replace(escaper,function (match) {
			return '\\' + escapes[match];
		}).replace(settings.escape || noMatch,function (match, code) {
					return "'+\n_.escape(" + unescape(code) + ")+\n'";
				}).replace(settings.interpolate || noMatch,function (match, code) {
					return "'+\n(" + unescape(code) + ")+\n'";
				}).replace(settings.evaluate || noMatch, function (match, code) {
					return "';\n" + unescape(code) + "\n;__p+='";
				}) + "';\n";

		// If a variable is not specified, place data values in local scope.
		if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

		source = "var __p='';" + "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" + source + "return __p;\n";

		var render = new Function(settings.variable || 'obj', '_', source);
		if (data) return render(data, _);
		var template = function (data) {
			return render.call(this, data, _);
		};

		// Provide the compiled function source as a convenience for build time
		// precompilation.
		template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

		return template;
	};

	// Add a "chain" function, which will delegate to the wrapper.
	_.chain = function (obj) {
		return _(obj).chain();
	};

	// The OOP Wrapper
	// ---------------

	// If Underscore is called as a function, it returns a wrapped object that
	// can be used OO-style. This wrapper holds altered versions of all the
	// underscore functions. Wrapped objects may be chained.
	var wrapper = function (obj) {
		this._wrapped = obj;
	};

	// Expose `wrapper.prototype` as `_.prototype`
	_.prototype = wrapper.prototype;

	// Helper function to continue chaining intermediate results.
	var result = function (obj, chain) {
		return chain ? _(obj).chain() : obj;
	};

	// A method to easily add functions to the OOP wrapper.
	var addToWrapper = function (name, func) {
		wrapper.prototype[name] = function () {
			var args = slice.call(arguments);
			unshift.call(args, this._wrapped);
			return result(func.apply(_, args), this._chain);
		};
	};

	// Add all of the Underscore functions to the wrapper object.
	_.mixin(_);

	// Add all mutator Array functions to the wrapper.
	each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
		var method = ArrayProto[name];
		wrapper.prototype[name] = function () {
			var wrapped = this._wrapped;
			method.apply(wrapped, arguments);
			var length = wrapped.length;
			if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
			return result(wrapped, this._chain);
		};
	});

	// Add all accessor Array functions to the wrapper.
	each(['concat', 'join', 'slice'], function (name) {
		var method = ArrayProto[name];
		wrapper.prototype[name] = function () {
			return result(method.apply(this._wrapped, arguments), this._chain);
		};
	});

	// Start chaining a wrapped Underscore object.
	wrapper.prototype.chain = function () {
		this._chain = true;
		return this;
	};

	// Extracts the result from a wrapped and chained object.
	wrapper.prototype.value = function () {
		return this._wrapped;
	};

}).call(this);


//EXTRAS

_.mixin({
	cleanAllButNumbers:function (t) {
		if (!t || !_.isString(t)) {
			return t;
		}

		return t.replace(/[^\d]/g, '');
	},
	rewrite:function (text) {

		var normalize = (function() {
			var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç",
					to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
					mapping = {};

			for(var i = 0, j = from.length; i < j; i++ )
				mapping[ from.charAt( i ) ] = to.charAt( i );

			return function( str ) {
				var ret = [];
				for( var i = 0, j = str.length; i < j; i++ ) {
					var c = str.charAt( i );
					if( mapping.hasOwnProperty( str.charAt( i ) ) )
						ret.push( mapping[ c ] );
					else
						ret.push( c );
				}
				return ret.join( '' );
			}

		})();

		text = normalize(text.toString());

		var str = "";
		var i;
		var exp_reg = new RegExp("[" + validchars + separator + "]");
		var exp_reg_space = new RegExp("[ ]");
		text.toString();
		for (i = 0; i < text.length; i++) {
			if (exp_reg.test(text.charAt(i))) {
				str = str + text.charAt(i);
			} else {
				if (exp_reg_space.test(text.charAt(i))) {
					if (str.charAt(str.length - 1) != separator) {
						str = str + separator;
					}
				}
			}
		}
		if (str.charAt(str.length - 1) == separator) str = str.substr(0, str.length - 1);
		return str.toLowerCase();
	},
	newWindow:function (mypage, myname, w, h, features) {
		if (screen.width) {
			var winl = (screen.width - w) / 2;
			var wint = (screen.height - h) / 2;
		} else {
			winl = 0;
			wint = 0;
		}

		if (winl < 0) winl = 0;
		if (wint < 0) wint = 0;

		var settings = 'height=' + h + ',';
		settings += 'width=' + w + ',';
		settings += 'top=' + wint + ',';
		settings += 'left=' + winl + ',';
		settings += features;
		settings += ' scrollbars=yes ';

		var win = window.open(mypage, myname, settings);

		win.window.focus();
	},

	checkemail:function (emailStr, required) {
		if (!required && emailStr == '') {
			return true;
		}
		var checkTLD = 1;
		var knownDomsPat = /^(com|net|org|cat|edu|int|mil|gov|biz|aero|name|coop|info|pro|museum)$/;
		var emailPat = /^(.+)@(.+)$/;
		var specialChars = "\\(\\)><@,;:\\\\\\\"\\.\\[\\]";
		var validChars = "\[^\\s" + specialChars + "\]";
		var quotedUser = "(\"[^\"]*\")";
		var ipDomainPat = /^\[(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\]$/;
		var atom = validChars + '+';
		var word = "(" + atom + "|" + quotedUser + ")";
		var userPat = new RegExp("^" + word + "(\\." + word + ")*$");
		var domainPat = new RegExp("^" + atom + "(\\." + atom + ")*$");
		var matchArray = emailStr.match(emailPat);

		if (matchArray == null) {
			alert('Email Incorrecto');
			return false;
		}
		var user = matchArray[1];
		var domain = matchArray[2];

		for (i = 0; i < user.length; i++) {
			if (user.charCodeAt(i) > 127) {
				alert('Email Incorrecto');
				return false;
			}
		}
		for (i = 0; i < domain.length; i++) {
			if (domain.charCodeAt(i) > 127) {
				alert('Email Incorrecto');
				return false;
			}
		}

		if (user.match(userPat) == null) {
			alert('Email Incorrecto');
			return false;
		}

		var IPArray = domain.match(ipDomainPat);
		if (IPArray != null) {
			for (var i = 1; i <= 4; i++) {
				if (IPArray[i] > 255) {
					alert('Email Incorrecto');
					return false;
				}
			}
			return true;
		}

		var atomPat = new RegExp("^" + atom + "$");
		var domArr = domain.split(".");
		var len = domArr.length;
		for (i = 0; i < len; i++) {
			if (domArr[i].search(atomPat) == -1) {
				alert('Email Incorrecto');
				return false;
			}
		}

		if (checkTLD && domArr[domArr.length - 1].length != 2 && domArr[domArr.length - 1].search(knownDomsPat) == -1) {
			alert('Email Incorrecto');
			return false;
		}

		if (len < 2) {
			alert('Email Incorrecto');
			return false;
		}

		return true;
	}


});


/*********************************************** 
     Begin toolbox.js 
***********************************************/ 

(function () {
	"use strict";

	var Toolbox = window.Toolbox = {};

	// `ctor` and `inherits` are from Backbone (with some modifications):
	// http://documentcloud.github.com/backbone/

	// Shared empty constructor function to aid in prototype-chain creation.
	var ctor = function () {};

	// Helper function to correctly set up the prototype chain, for subclasses.
	// Similar to `goog.inherits`, but uses a hash of prototype properties and
	// class properties to be extended.
	var inherits = function (parent, protoProps, staticProps) {
		var child;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call `super()`.
		if (protoProps && protoProps.hasOwnProperty('constructor')) {
			child = protoProps.constructor;
		} else {
			child = function () { return parent.apply(this, arguments); };
		}

		// Inherit class (static) properties from parent.
		_.extend(child, parent);

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (protoProps) _.extend(child.prototype, protoProps);

		// Add static properties to the constructor function, if supplied.
		if (staticProps) _.extend(child, staticProps);

		// Correctly set child's `prototype.constructor`.
		child.prototype.constructor = child;

		// Set a convenience property in case the parent's prototype is needed later.
		child.__super__ = parent.prototype;

		return child;
	};

	// Self-propagating extend function.
	// Create a new class that inherits from the class found in the `this` context object.
	// This function is meant to be called in the context of a constructor function.
	function extendThis(protoProps, staticProps) {
		var child = inherits(this, protoProps, staticProps);
		child.extend = extendThis;
		return child;
	}

	// A primitive base class for creating subclasses.
	// All subclasses will have the `extend` function.
	// Example:
	//     var MyClass = Toolbox.Base.extend({
	//         someProp: 'My property value',
	//         someMethod: function () { ... }
	//     });
	//     var instance = new MyClass();
	Toolbox.Base = function () {}
	Toolbox.Base.extend = extendThis;
})();


/*********************************************** 
     Begin jquery.js 
***********************************************/ 

/*!
 * jQuery JavaScript Library v1.7.2
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Wed Mar 21 12:46:34 2012 -0700
 */
(function( window, undefined ) {

// Use the correct document accordingly with window argument (sandbox)
	var document = window.document,
			navigator = window.navigator,
			location = window.location;
	var jQuery = (function() {

// Define a local copy of jQuery
		var jQuery = function( selector, context ) {
					// The jQuery object is actually just the init constructor 'enhanced'
					return new jQuery.fn.init( selector, context, rootjQuery );
				},

		// Map over jQuery in case of overwrite
				_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
				_$ = window.$,

		// A central reference to the root jQuery(document)
				rootjQuery,

		// A simple way to check for HTML strings or ID strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
				quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

		// Check if a string has a non-whitespace character in it
				rnotwhite = /\S/,

		// Used for trimming whitespace
				trimLeft = /^\s+/,
				trimRight = /\s+$/,

		// Match a standalone tag
				rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

		// JSON RegExp
				rvalidchars = /^[\],:{}\s]*$/,
				rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
				rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
				rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,

		// Useragent RegExp
				rwebkit = /(webkit)[ \/]([\w.]+)/,
				ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
				rmsie = /(msie) ([\w.]+)/,
				rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,

		// Matches dashed string for camelizing
				rdashAlpha = /-([a-z]|[0-9])/ig,
				rmsPrefix = /^-ms-/,

		// Used by jQuery.camelCase as callback to replace()
				fcamelCase = function( all, letter ) {
					return ( letter + "" ).toUpperCase();
				},

		// Keep a UserAgent string for use with jQuery.browser
				userAgent = navigator.userAgent,

		// For matching the engine and version of the browser
				browserMatch,

		// The deferred used on DOM ready
				readyList,

		// The ready event handler
				DOMContentLoaded,

		// Save a reference to some core methods
				toString = Object.prototype.toString,
				hasOwn = Object.prototype.hasOwnProperty,
				push = Array.prototype.push,
				slice = Array.prototype.slice,
				trim = String.prototype.trim,
				indexOf = Array.prototype.indexOf,

		// [[Class]] -> type pairs
				class2type = {};

		jQuery.fn = jQuery.prototype = {
			constructor: jQuery,
			init: function( selector, context, rootjQuery ) {
				var match, elem, ret, doc;

				// Handle $(""), $(null), or $(undefined)
				if ( !selector ) {
					return this;
				}

				// Handle $(DOMElement)
				if ( selector.nodeType ) {
					this.context = this[0] = selector;
					this.length = 1;
					return this;
				}

				// The body element only exists once, optimize finding it
				if ( selector === "body" && !context && document.body ) {
					this.context = document;
					this[0] = document.body;
					this.selector = selector;
					this.length = 1;
					return this;
				}

				// Handle HTML strings
				if ( typeof selector === "string" ) {
					// Are we dealing with HTML string or an ID?
					if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
						// Assume that strings that start and end with <> are HTML and skip the regex check
						match = [ null, selector, null ];

					} else {
						match = quickExpr.exec( selector );
					}

					// Verify a match, and that no context was specified for #id
					if ( match && (match[1] || !context) ) {

						// HANDLE: $(html) -> $(array)
						if ( match[1] ) {
							context = context instanceof jQuery ? context[0] : context;
							doc = ( context ? context.ownerDocument || context : document );

							// If a single string is passed in and it's a single tag
							// just do a createElement and skip the rest
							ret = rsingleTag.exec( selector );

							if ( ret ) {
								if ( jQuery.isPlainObject( context ) ) {
									selector = [ document.createElement( ret[1] ) ];
									jQuery.fn.attr.call( selector, context, true );

								} else {
									selector = [ doc.createElement( ret[1] ) ];
								}

							} else {
								ret = jQuery.buildFragment( [ match[1] ], [ doc ] );
								selector = ( ret.cacheable ? jQuery.clone(ret.fragment) : ret.fragment ).childNodes;
							}

							return jQuery.merge( this, selector );

							// HANDLE: $("#id")
						} else {
							elem = document.getElementById( match[2] );

							// Check parentNode to catch when Blackberry 4.6 returns
							// nodes that are no longer in the document #6963
							if ( elem && elem.parentNode ) {
								// Handle the case where IE and Opera return items
								// by name instead of ID
								if ( elem.id !== match[2] ) {
									return rootjQuery.find( selector );
								}

								// Otherwise, we inject the element directly into the jQuery object
								this.length = 1;
								this[0] = elem;
							}

							this.context = document;
							this.selector = selector;
							return this;
						}

						// HANDLE: $(expr, $(...))
					} else if ( !context || context.jquery ) {
						return ( context || rootjQuery ).find( selector );

						// HANDLE: $(expr, context)
						// (which is just equivalent to: $(context).find(expr)
					} else {
						return this.constructor( context ).find( selector );
					}

					// HANDLE: $(function)
					// Shortcut for document ready
				} else if ( jQuery.isFunction( selector ) ) {
					return rootjQuery.ready( selector );
				}

				if ( selector.selector !== undefined ) {
					this.selector = selector.selector;
					this.context = selector.context;
				}

				return jQuery.makeArray( selector, this );
			},

			// Start with an empty selector
			selector: "",

			// The current version of jQuery being used
			jquery: "1.7.2",

			// The default length of a jQuery object is 0
			length: 0,

			// The number of elements contained in the matched element set
			size: function() {
				return this.length;
			},

			toArray: function() {
				return slice.call( this, 0 );
			},

			// Get the Nth element in the matched element set OR
			// Get the whole matched element set as a clean array
			get: function( num ) {
				return num == null ?

					// Return a 'clean' array
						this.toArray() :

					// Return just the object
						( num < 0 ? this[ this.length + num ] : this[ num ] );
			},

			// Take an array of elements and push it onto the stack
			// (returning the new matched element set)
			pushStack: function( elems, name, selector ) {
				// Build a new jQuery matched element set
				var ret = this.constructor();

				if ( jQuery.isArray( elems ) ) {
					push.apply( ret, elems );

				} else {
					jQuery.merge( ret, elems );
				}

				// Add the old object onto the stack (as a reference)
				ret.prevObject = this;

				ret.context = this.context;

				if ( name === "find" ) {
					ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
				} else if ( name ) {
					ret.selector = this.selector + "." + name + "(" + selector + ")";
				}

				// Return the newly-formed element set
				return ret;
			},

			// Execute a callback for every element in the matched set.
			// (You can seed the arguments with an array of args, but this is
			// only used internally.)
			each: function( callback, args ) {
				return jQuery.each( this, callback, args );
			},

			ready: function( fn ) {
				// Attach the listeners
				jQuery.bindReady();

				// Add the callback
				readyList.add( fn );

				return this;
			},

			eq: function( i ) {
				i = +i;
				return i === -1 ?
						this.slice( i ) :
						this.slice( i, i + 1 );
			},

			first: function() {
				return this.eq( 0 );
			},

			last: function() {
				return this.eq( -1 );
			},

			slice: function() {
				return this.pushStack( slice.apply( this, arguments ),
						"slice", slice.call(arguments).join(",") );
			},

			map: function( callback ) {
				return this.pushStack( jQuery.map(this, function( elem, i ) {
					return callback.call( elem, i, elem );
				}));
			},

			end: function() {
				return this.prevObject || this.constructor(null);
			},

			// For internal use only.
			// Behaves like an Array's method, not like a jQuery method.
			push: push,
			sort: [].sort,
			splice: [].splice
		};

// Give the init function the jQuery prototype for later instantiation
		jQuery.fn.init.prototype = jQuery.fn;

		jQuery.extend = jQuery.fn.extend = function() {
			var options, name, src, copy, copyIsArray, clone,
					target = arguments[0] || {},
					i = 1,
					length = arguments.length,
					deep = false;

			// Handle a deep copy situation
			if ( typeof target === "boolean" ) {
				deep = target;
				target = arguments[1] || {};
				// skip the boolean and the target
				i = 2;
			}

			// Handle case when target is a string or something (possible in deep copy)
			if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
				target = {};
			}

			// extend jQuery itself if only one argument is passed
			if ( length === i ) {
				target = this;
				--i;
			}

			for ( ; i < length; i++ ) {
				// Only deal with non-null/undefined values
				if ( (options = arguments[ i ]) != null ) {
					// Extend the base object
					for ( name in options ) {
						src = target[ name ];
						copy = options[ name ];

						// Prevent never-ending loop
						if ( target === copy ) {
							continue;
						}

						// Recurse if we're merging plain objects or arrays
						if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
							if ( copyIsArray ) {
								copyIsArray = false;
								clone = src && jQuery.isArray(src) ? src : [];

							} else {
								clone = src && jQuery.isPlainObject(src) ? src : {};
							}

							// Never move original objects, clone them
							target[ name ] = jQuery.extend( deep, clone, copy );

							// Don't bring in undefined values
						} else if ( copy !== undefined ) {
							target[ name ] = copy;
						}
					}
				}
			}

			// Return the modified object
			return target;
		};

		jQuery.extend({
			noConflict: function( deep ) {
				if ( window.$ === jQuery ) {
					window.$ = _$;
				}

				if ( deep && window.jQuery === jQuery ) {
					window.jQuery = _jQuery;
				}

				return jQuery;
			},

			// Is the DOM ready to be used? Set to true once it occurs.
			isReady: false,

			// A counter to track how many items to wait for before
			// the ready event fires. See #6781
			readyWait: 1,

			// Hold (or release) the ready event
			holdReady: function( hold ) {
				if ( hold ) {
					jQuery.readyWait++;
				} else {
					jQuery.ready( true );
				}
			},

			// Handle when the DOM is ready
			ready: function( wait ) {
				// Either a released hold or an DOMready/load event and not yet ready
				if ( (wait === true && !--jQuery.readyWait) || (wait !== true && !jQuery.isReady) ) {
					// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
					if ( !document.body ) {
						return setTimeout( jQuery.ready, 1 );
					}

					// Remember that the DOM is ready
					jQuery.isReady = true;

					// If a normal DOM Ready event fired, decrement, and wait if need be
					if ( wait !== true && --jQuery.readyWait > 0 ) {
						return;
					}

					// If there are functions bound, to execute
					readyList.fireWith( document, [ jQuery ] );

					// Trigger any bound ready events
					if ( jQuery.fn.trigger ) {
						jQuery( document ).trigger( "ready" ).off( "ready" );
					}
				}
			},

			bindReady: function() {
				if ( readyList ) {
					return;
				}

				readyList = jQuery.Callbacks( "once memory" );

				// Catch cases where $(document).ready() is called after the
				// browser event has already occurred.
				if ( document.readyState === "complete" ) {
					// Handle it asynchronously to allow scripts the opportunity to delay ready
					return setTimeout( jQuery.ready, 1 );
				}

				// Mozilla, Opera and webkit nightlies currently support this event
				if ( document.addEventListener ) {
					// Use the handy event callback
					document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

					// A fallback to window.onload, that will always work
					window.addEventListener( "load", jQuery.ready, false );

					// If IE event model is used
				} else if ( document.attachEvent ) {
					// ensure firing before onload,
					// maybe late but safe also for iframes
					document.attachEvent( "onreadystatechange", DOMContentLoaded );

					// A fallback to window.onload, that will always work
					window.attachEvent( "onload", jQuery.ready );

					// If IE and not a frame
					// continually check to see if the document is ready
					var toplevel = false;

					try {
						toplevel = window.frameElement == null;
					} catch(e) {}

					if ( document.documentElement.doScroll && toplevel ) {
						doScrollCheck();
					}
				}
			},

			// See test/unit/core.js for details concerning isFunction.
			// Since version 1.3, DOM methods and functions like alert
			// aren't supported. They return false on IE (#2968).
			isFunction: function( obj ) {
				return jQuery.type(obj) === "function";
			},

			isArray: Array.isArray || function( obj ) {
				return jQuery.type(obj) === "array";
			},

			isWindow: function( obj ) {
				return obj != null && obj == obj.window;
			},

			isNumeric: function( obj ) {
				return !isNaN( parseFloat(obj) ) && isFinite( obj );
			},

			type: function( obj ) {
				return obj == null ?
						String( obj ) :
						class2type[ toString.call(obj) ] || "object";
			},

			isPlainObject: function( obj ) {
				// Must be an Object.
				// Because of IE, we also have to check the presence of the constructor property.
				// Make sure that DOM nodes and window objects don't pass through, as well
				if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
					return false;
				}

				try {
					// Not own constructor property must be Object
					if ( obj.constructor &&
							!hasOwn.call(obj, "constructor") &&
							!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
						return false;
					}
				} catch ( e ) {
					// IE8,9 Will throw exceptions on certain host objects #9897
					return false;
				}

				// Own properties are enumerated firstly, so to speed up,
				// if last one is own, then all properties are own.

				var key;
				for ( key in obj ) {}

				return key === undefined || hasOwn.call( obj, key );
			},

			isEmptyObject: function( obj ) {
				for ( var name in obj ) {
					return false;
				}
				return true;
			},

			error: function( msg ) {
				throw new Error( msg );
			},

			parseJSON: function( data ) {
				if ( typeof data !== "string" || !data ) {
					return null;
				}

				// Make sure leading/trailing whitespace is removed (IE can't handle it)
				data = jQuery.trim( data );

				// Attempt to parse using the native JSON parser first
				if ( window.JSON && window.JSON.parse ) {
					return window.JSON.parse( data );
				}

				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
						.replace( rvalidtokens, "]" )
						.replace( rvalidbraces, "")) ) {

					return ( new Function( "return " + data ) )();

				}
				jQuery.error( "Invalid JSON: " + data );
			},

			// Cross-browser xml parsing
			parseXML: function( data ) {
				if ( typeof data !== "string" || !data ) {
					return null;
				}
				var xml, tmp;
				try {
					if ( window.DOMParser ) { // Standard
						tmp = new DOMParser();
						xml = tmp.parseFromString( data , "text/xml" );
					} else { // IE
						xml = new ActiveXObject( "Microsoft.XMLDOM" );
						xml.async = "false";
						xml.loadXML( data );
					}
				} catch( e ) {
					xml = undefined;
				}
				if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
					jQuery.error( "Invalid XML: " + data );
				}
				return xml;
			},

			noop: function() {},

			// Evaluates a script in a global context
			// Workarounds based on findings by Jim Driscoll
			// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
			globalEval: function( data ) {
				if ( data && rnotwhite.test( data ) ) {
					// We use execScript on Internet Explorer
					// We use an anonymous function so that context is window
					// rather than jQuery in Firefox
					( window.execScript || function( data ) {
						window[ "eval" ].call( window, data );
					} )( data );
				}
			},

			// Convert dashed to camelCase; used by the css and data modules
			// Microsoft forgot to hump their vendor prefix (#9572)
			camelCase: function( string ) {
				return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
			},

			nodeName: function( elem, name ) {
				return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
			},

			// args is for internal usage only
			each: function( object, callback, args ) {
				var name, i = 0,
						length = object.length,
						isObj = length === undefined || jQuery.isFunction( object );

				if ( args ) {
					if ( isObj ) {
						for ( name in object ) {
							if ( callback.apply( object[ name ], args ) === false ) {
								break;
							}
						}
					} else {
						for ( ; i < length; ) {
							if ( callback.apply( object[ i++ ], args ) === false ) {
								break;
							}
						}
					}

					// A special, fast, case for the most common use of each
				} else {
					if ( isObj ) {
						for ( name in object ) {
							if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
								break;
							}
						}
					} else {
						for ( ; i < length; ) {
							if ( callback.call( object[ i ], i, object[ i++ ] ) === false ) {
								break;
							}
						}
					}
				}

				return object;
			},

			// Use native String.trim function wherever possible
			trim: trim ?
					function( text ) {
						return text == null ?
								"" :
								trim.call( text );
					} :

				// Otherwise use our own trimming functionality
					function( text ) {
						return text == null ?
								"" :
								text.toString().replace( trimLeft, "" ).replace( trimRight, "" );
					},

			// results is for internal usage only
			makeArray: function( array, results ) {
				var ret = results || [];

				if ( array != null ) {
					// The window, strings (and functions) also have 'length'
					// Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
					var type = jQuery.type( array );

					if ( array.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( array ) ) {
						push.call( ret, array );
					} else {
						jQuery.merge( ret, array );
					}
				}

				return ret;
			},

			inArray: function( elem, array, i ) {
				var len;

				if ( array ) {
					if ( indexOf ) {
						return indexOf.call( array, elem, i );
					}

					len = array.length;
					i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

					for ( ; i < len; i++ ) {
						// Skip accessing in sparse arrays
						if ( i in array && array[ i ] === elem ) {
							return i;
						}
					}
				}

				return -1;
			},

			merge: function( first, second ) {
				var i = first.length,
						j = 0;

				if ( typeof second.length === "number" ) {
					for ( var l = second.length; j < l; j++ ) {
						first[ i++ ] = second[ j ];
					}

				} else {
					while ( second[j] !== undefined ) {
						first[ i++ ] = second[ j++ ];
					}
				}

				first.length = i;

				return first;
			},

			grep: function( elems, callback, inv ) {
				var ret = [], retVal;
				inv = !!inv;

				// Go through the array, only saving the items
				// that pass the validator function
				for ( var i = 0, length = elems.length; i < length; i++ ) {
					retVal = !!callback( elems[ i ], i );
					if ( inv !== retVal ) {
						ret.push( elems[ i ] );
					}
				}

				return ret;
			},

			// arg is for internal usage only
			map: function( elems, callback, arg ) {
				var value, key, ret = [],
						i = 0,
						length = elems.length,
				// jquery objects are treated as arrays
						isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

				// Go through the array, translating each of the items to their
				if ( isArray ) {
					for ( ; i < length; i++ ) {
						value = callback( elems[ i ], i, arg );

						if ( value != null ) {
							ret[ ret.length ] = value;
						}
					}

					// Go through every key on the object,
				} else {
					for ( key in elems ) {
						value = callback( elems[ key ], key, arg );

						if ( value != null ) {
							ret[ ret.length ] = value;
						}
					}
				}

				// Flatten any nested arrays
				return ret.concat.apply( [], ret );
			},

			// A global GUID counter for objects
			guid: 1,

			// Bind a function to a context, optionally partially applying any
			// arguments.
			proxy: function( fn, context ) {
				if ( typeof context === "string" ) {
					var tmp = fn[ context ];
					context = fn;
					fn = tmp;
				}

				// Quick check to determine if target is callable, in the spec
				// this throws a TypeError, but we will just return undefined.
				if ( !jQuery.isFunction( fn ) ) {
					return undefined;
				}

				// Simulated bind
				var args = slice.call( arguments, 2 ),
						proxy = function() {
							return fn.apply( context, args.concat( slice.call( arguments ) ) );
						};

				// Set the guid of unique handler to the same of original handler, so it can be removed
				proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;

				return proxy;
			},

			// Mutifunctional method to get and set values to a collection
			// The value/s can optionally be executed if it's a function
			access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
				var exec,
						bulk = key == null,
						i = 0,
						length = elems.length;

				// Sets many values
				if ( key && typeof key === "object" ) {
					for ( i in key ) {
						jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
					}
					chainable = 1;

					// Sets one value
				} else if ( value !== undefined ) {
					// Optionally, function values get executed if exec is true
					exec = pass === undefined && jQuery.isFunction( value );

					if ( bulk ) {
						// Bulk operations only iterate when executing function values
						if ( exec ) {
							exec = fn;
							fn = function( elem, key, value ) {
								return exec.call( jQuery( elem ), value );
							};

							// Otherwise they run against the entire set
						} else {
							fn.call( elems, value );
							fn = null;
						}
					}

					if ( fn ) {
						for (; i < length; i++ ) {
							fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
						}
					}

					chainable = 1;
				}

				return chainable ?
						elems :

					// Gets
						bulk ?
								fn.call( elems ) :
								length ? fn( elems[0], key ) : emptyGet;
			},

			now: function() {
				return ( new Date() ).getTime();
			},

			// Use of jQuery.browser is frowned upon.
			// More details: http://docs.jquery.com/Utilities/jQuery.browser
			uaMatch: function( ua ) {
				ua = ua.toLowerCase();

				var match = rwebkit.exec( ua ) ||
						ropera.exec( ua ) ||
						rmsie.exec( ua ) ||
						ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
						[];

				return { browser: match[1] || "", version: match[2] || "0" };
			},

			sub: function() {
				function jQuerySub( selector, context ) {
					return new jQuerySub.fn.init( selector, context );
				}
				jQuery.extend( true, jQuerySub, this );
				jQuerySub.superclass = this;
				jQuerySub.fn = jQuerySub.prototype = this();
				jQuerySub.fn.constructor = jQuerySub;
				jQuerySub.sub = this.sub;
				jQuerySub.fn.init = function init( selector, context ) {
					if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
						context = jQuerySub( context );
					}

					return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
				};
				jQuerySub.fn.init.prototype = jQuerySub.fn;
				var rootjQuerySub = jQuerySub(document);
				return jQuerySub;
			},

			browser: {}
		});

// Populate the class2type map
		jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
			class2type[ "[object " + name + "]" ] = name.toLowerCase();
		});

		browserMatch = jQuery.uaMatch( userAgent );
		if ( browserMatch.browser ) {
			jQuery.browser[ browserMatch.browser ] = true;
			jQuery.browser.version = browserMatch.version;
		}

// Deprecated, use jQuery.browser.webkit instead
		if ( jQuery.browser.webkit ) {
			jQuery.browser.safari = true;
		}

// IE doesn't match non-breaking spaces with \s
		if ( rnotwhite.test( "\xA0" ) ) {
			trimLeft = /^[\s\xA0]+/;
			trimRight = /[\s\xA0]+$/;
		}

// All jQuery objects should point back to these
		rootjQuery = jQuery(document);

// Cleanup functions for the document ready method
		if ( document.addEventListener ) {
			DOMContentLoaded = function() {
				document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
				jQuery.ready();
			};

		} else if ( document.attachEvent ) {
			DOMContentLoaded = function() {
				// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
				if ( document.readyState === "complete" ) {
					document.detachEvent( "onreadystatechange", DOMContentLoaded );
					jQuery.ready();
				}
			};
		}

// The DOM ready check for Internet Explorer
		function doScrollCheck() {
			if ( jQuery.isReady ) {
				return;
			}

			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch(e) {
				setTimeout( doScrollCheck, 1 );
				return;
			}

			// and execute any waiting functions
			jQuery.ready();
		}

		return jQuery;

	})();


// String to Object flags format cache
	var flagsCache = {};

// Convert String-formatted flags into Object-formatted ones and store in cache
	function createFlags( flags ) {
		var object = flagsCache[ flags ] = {},
				i, length;
		flags = flags.split( /\s+/ );
		for ( i = 0, length = flags.length; i < length; i++ ) {
			object[ flags[i] ] = true;
		}
		return object;
	}

	/*
	 * Create a callback list using the following parameters:
	 *
	 *	flags:	an optional list of space-separated flags that will change how
	 *			the callback list behaves
	 *
	 * By default a callback list will act like an event callback list and can be
	 * "fired" multiple times.
	 *
	 * Possible flags:
	 *
	 *	once:			will ensure the callback list can only be fired once (like a Deferred)
	 *
	 *	memory:			will keep track of previous values and will call any callback added
	 *					after the list has been fired right away with the latest "memorized"
	 *					values (like a Deferred)
	 *
	 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
	 *
	 *	stopOnFalse:	interrupt callings when a callback returns false
	 *
	 */
	jQuery.Callbacks = function( flags ) {

		// Convert flags from String-formatted to Object-formatted
		// (we check in cache first)
		flags = flags ? ( flagsCache[ flags ] || createFlags( flags ) ) : {};

		var // Actual callback list
				list = [],
		// Stack of fire calls for repeatable lists
				stack = [],
		// Last fire value (for non-forgettable lists)
				memory,
		// Flag to know if list was already fired
				fired,
		// Flag to know if list is currently firing
				firing,
		// First callback to fire (used internally by add and fireWith)
				firingStart,
		// End of the loop when firing
				firingLength,
		// Index of currently firing callback (modified by remove if needed)
				firingIndex,
		// Add one or several callbacks to the list
				add = function( args ) {
					var i,
							length,
							elem,
							type,
							actual;
					for ( i = 0, length = args.length; i < length; i++ ) {
						elem = args[ i ];
						type = jQuery.type( elem );
						if ( type === "array" ) {
							// Inspect recursively
							add( elem );
						} else if ( type === "function" ) {
							// Add if not in unique mode and callback is not in
							if ( !flags.unique || !self.has( elem ) ) {
								list.push( elem );
							}
						}
					}
				},
		// Fire callbacks
				fire = function( context, args ) {
					args = args || [];
					memory = !flags.memory || [ context, args ];
					fired = true;
					firing = true;
					firingIndex = firingStart || 0;
					firingStart = 0;
					firingLength = list.length;
					for ( ; list && firingIndex < firingLength; firingIndex++ ) {
						if ( list[ firingIndex ].apply( context, args ) === false && flags.stopOnFalse ) {
							memory = true; // Mark as halted
							break;
						}
					}
					firing = false;
					if ( list ) {
						if ( !flags.once ) {
							if ( stack && stack.length ) {
								memory = stack.shift();
								self.fireWith( memory[ 0 ], memory[ 1 ] );
							}
						} else if ( memory === true ) {
							self.disable();
						} else {
							list = [];
						}
					}
				},
		// Actual Callbacks object
				self = {
					// Add a callback or a collection of callbacks to the list
					add: function() {
						if ( list ) {
							var length = list.length;
							add( arguments );
							// Do we need to add the callbacks to the
							// current firing batch?
							if ( firing ) {
								firingLength = list.length;
								// With memory, if we're not firing then
								// we should call right away, unless previous
								// firing was halted (stopOnFalse)
							} else if ( memory && memory !== true ) {
								firingStart = length;
								fire( memory[ 0 ], memory[ 1 ] );
							}
						}
						return this;
					},
					// Remove a callback from the list
					remove: function() {
						if ( list ) {
							var args = arguments,
									argIndex = 0,
									argLength = args.length;
							for ( ; argIndex < argLength ; argIndex++ ) {
								for ( var i = 0; i < list.length; i++ ) {
									if ( args[ argIndex ] === list[ i ] ) {
										// Handle firingIndex and firingLength
										if ( firing ) {
											if ( i <= firingLength ) {
												firingLength--;
												if ( i <= firingIndex ) {
													firingIndex--;
												}
											}
										}
										// Remove the element
										list.splice( i--, 1 );
										// If we have some unicity property then
										// we only need to do this once
										if ( flags.unique ) {
											break;
										}
									}
								}
							}
						}
						return this;
					},
					// Control if a given callback is in the list
					has: function( fn ) {
						if ( list ) {
							var i = 0,
									length = list.length;
							for ( ; i < length; i++ ) {
								if ( fn === list[ i ] ) {
									return true;
								}
							}
						}
						return false;
					},
					// Remove all callbacks from the list
					empty: function() {
						list = [];
						return this;
					},
					// Have the list do nothing anymore
					disable: function() {
						list = stack = memory = undefined;
						return this;
					},
					// Is it disabled?
					disabled: function() {
						return !list;
					},
					// Lock the list in its current state
					lock: function() {
						stack = undefined;
						if ( !memory || memory === true ) {
							self.disable();
						}
						return this;
					},
					// Is it locked?
					locked: function() {
						return !stack;
					},
					// Call all callbacks with the given context and arguments
					fireWith: function( context, args ) {
						if ( stack ) {
							if ( firing ) {
								if ( !flags.once ) {
									stack.push( [ context, args ] );
								}
							} else if ( !( flags.once && memory ) ) {
								fire( context, args );
							}
						}
						return this;
					},
					// Call all the callbacks with the given arguments
					fire: function() {
						self.fireWith( this, arguments );
						return this;
					},
					// To know if the callbacks have already been called at least once
					fired: function() {
						return !!fired;
					}
				};

		return self;
	};




	var // Static reference to slice
			sliceDeferred = [].slice;

	jQuery.extend({

		Deferred: function( func ) {
			var doneList = jQuery.Callbacks( "once memory" ),
					failList = jQuery.Callbacks( "once memory" ),
					progressList = jQuery.Callbacks( "memory" ),
					state = "pending",
					lists = {
						resolve: doneList,
						reject: failList,
						notify: progressList
					},
					promise = {
						done: doneList.add,
						fail: failList.add,
						progress: progressList.add,

						state: function() {
							return state;
						},

						// Deprecated
						isResolved: doneList.fired,
						isRejected: failList.fired,

						then: function( doneCallbacks, failCallbacks, progressCallbacks ) {
							deferred.done( doneCallbacks ).fail( failCallbacks ).progress( progressCallbacks );
							return this;
						},
						always: function() {
							deferred.done.apply( deferred, arguments ).fail.apply( deferred, arguments );
							return this;
						},
						pipe: function( fnDone, fnFail, fnProgress ) {
							return jQuery.Deferred(function( newDefer ) {
								jQuery.each( {
									done: [ fnDone, "resolve" ],
									fail: [ fnFail, "reject" ],
									progress: [ fnProgress, "notify" ]
								}, function( handler, data ) {
									var fn = data[ 0 ],
											action = data[ 1 ],
											returned;
									if ( jQuery.isFunction( fn ) ) {
										deferred[ handler ](function() {
											returned = fn.apply( this, arguments );
											if ( returned && jQuery.isFunction( returned.promise ) ) {
												returned.promise().then( newDefer.resolve, newDefer.reject, newDefer.notify );
											} else {
												newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
											}
										});
									} else {
										deferred[ handler ]( newDefer[ action ] );
									}
								});
							}).promise();
						},
						// Get a promise for this deferred
						// If obj is provided, the promise aspect is added to the object
						promise: function( obj ) {
							if ( obj == null ) {
								obj = promise;
							} else {
								for ( var key in promise ) {
									obj[ key ] = promise[ key ];
								}
							}
							return obj;
						}
					},
					deferred = promise.promise({}),
					key;

			for ( key in lists ) {
				deferred[ key ] = lists[ key ].fire;
				deferred[ key + "With" ] = lists[ key ].fireWith;
			}

			// Handle state
			deferred.done( function() {
				state = "resolved";
			}, failList.disable, progressList.lock ).fail( function() {
						state = "rejected";
					}, doneList.disable, progressList.lock );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},

		// Deferred helper
		when: function( firstParam ) {
			var args = sliceDeferred.call( arguments, 0 ),
					i = 0,
					length = args.length,
					pValues = new Array( length ),
					count = length,
					pCount = length,
					deferred = length <= 1 && firstParam && jQuery.isFunction( firstParam.promise ) ?
							firstParam :
							jQuery.Deferred(),
					promise = deferred.promise();
			function resolveFunc( i ) {
				return function( value ) {
					args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
					if ( !( --count ) ) {
						deferred.resolveWith( deferred, args );
					}
				};
			}
			function progressFunc( i ) {
				return function( value ) {
					pValues[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
					deferred.notifyWith( promise, pValues );
				};
			}
			if ( length > 1 ) {
				for ( ; i < length; i++ ) {
					if ( args[ i ] && args[ i ].promise && jQuery.isFunction( args[ i ].promise ) ) {
						args[ i ].promise().then( resolveFunc(i), deferred.reject, progressFunc(i) );
					} else {
						--count;
					}
				}
				if ( !count ) {
					deferred.resolveWith( deferred, args );
				}
			} else if ( deferred !== firstParam ) {
				deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
			}
			return promise;
		}
	});




	jQuery.support = (function() {

		var support,
				all,
				a,
				select,
				opt,
				input,
				fragment,
				tds,
				events,
				eventName,
				i,
				isSupported,
				div = document.createElement( "div" ),
				documentElement = document.documentElement;

		// Preliminary tests
		div.setAttribute("className", "t");
		div.innerHTML = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";

		all = div.getElementsByTagName( "*" );
		a = div.getElementsByTagName( "a" )[ 0 ];

		// Can't get basic test support
		if ( !all || !all.length || !a ) {
			return {};
		}

		// First batch of supports tests
		select = document.createElement( "select" );
		opt = select.appendChild( document.createElement("option") );
		input = div.getElementsByTagName( "input" )[ 0 ];

		support = {
			// IE strips leading whitespace when .innerHTML is used
			leadingWhitespace: ( div.firstChild.nodeType === 3 ),

			// Make sure that tbody elements aren't automatically inserted
			// IE will insert them into empty tables
			tbody: !div.getElementsByTagName("tbody").length,

			// Make sure that link elements get serialized correctly by innerHTML
			// This requires a wrapper element in IE
			htmlSerialize: !!div.getElementsByTagName("link").length,

			// Get the style information from getAttribute
			// (IE uses .cssText instead)
			style: /top/.test( a.getAttribute("style") ),

			// Make sure that URLs aren't manipulated
			// (IE normalizes it by default)
			hrefNormalized: ( a.getAttribute("href") === "/a" ),

			// Make sure that element opacity exists
			// (IE uses filter instead)
			// Use a regex to work around a WebKit issue. See #5145
			opacity: /^0.55/.test( a.style.opacity ),

			// Verify style float existence
			// (IE uses styleFloat instead of cssFloat)
			cssFloat: !!a.style.cssFloat,

			// Make sure that if no value is specified for a checkbox
			// that it defaults to "on".
			// (WebKit defaults to "" instead)
			checkOn: ( input.value === "on" ),

			// Make sure that a selected-by-default option has a working selected property.
			// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
			optSelected: opt.selected,

			// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
			getSetAttribute: div.className !== "t",

			// Tests for enctype support on a form(#6743)
			enctype: !!document.createElement("form").enctype,

			// Makes sure cloning an html5 element does not cause problems
			// Where outerHTML is undefined, this still works
			html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

			// Will be defined later
			submitBubbles: true,
			changeBubbles: true,
			focusinBubbles: false,
			deleteExpando: true,
			noCloneEvent: true,
			inlineBlockNeedsLayout: false,
			shrinkWrapBlocks: false,
			reliableMarginRight: true,
			pixelMargin: true
		};

		// jQuery.boxModel DEPRECATED in 1.3, use jQuery.support.boxModel instead
		jQuery.boxModel = support.boxModel = (document.compatMode === "CSS1Compat");

		// Make sure checked status is properly cloned
		input.checked = true;
		support.noCloneChecked = input.cloneNode( true ).checked;

		// Make sure that the options inside disabled selects aren't marked as disabled
		// (WebKit marks them as disabled)
		select.disabled = true;
		support.optDisabled = !opt.disabled;

		// Test to see if it's possible to delete an expando from an element
		// Fails in Internet Explorer
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}

		if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
			div.attachEvent( "onclick", function() {
				// Cloning a node shouldn't copy over any
				// bound event handlers (IE does this)
				support.noCloneEvent = false;
			});
			div.cloneNode( true ).fireEvent( "onclick" );
		}

		// Check if a radio maintains its value
		// after being appended to the DOM
		input = document.createElement("input");
		input.value = "t";
		input.setAttribute("type", "radio");
		support.radioValue = input.value === "t";

		input.setAttribute("checked", "checked");

		// #11217 - WebKit loses check when the name is after the checked attribute
		input.setAttribute( "name", "t" );

		div.appendChild( input );
		fragment = document.createDocumentFragment();
		fragment.appendChild( div.lastChild );

		// WebKit doesn't clone checked state correctly in fragments
		support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

		// Check if a disconnected checkbox will retain its checked
		// value of true after appended to the DOM (IE6/7)
		support.appendChecked = input.checked;

		fragment.removeChild( input );
		fragment.appendChild( div );

		// Technique from Juriy Zaytsev
		// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
		// We only care about the case where non-standard event systems
		// are used, namely in IE. Short-circuiting here helps us to
		// avoid an eval call (in setAttribute) which can cause CSP
		// to go haywire. See: https://developer.mozilla.org/en/Security/CSP
		if ( div.attachEvent ) {
			for ( i in {
				submit: 1,
				change: 1,
				focusin: 1
			}) {
				eventName = "on" + i;
				isSupported = ( eventName in div );
				if ( !isSupported ) {
					div.setAttribute( eventName, "return;" );
					isSupported = ( typeof div[ eventName ] === "function" );
				}
				support[ i + "Bubbles" ] = isSupported;
			}
		}

		fragment.removeChild( div );

		// Null elements to avoid leaks in IE
		fragment = select = opt = div = input = null;

		// Run tests that need a body at doc ready
		jQuery(function() {
			var container, outer, inner, table, td, offsetSupport,
					marginDiv, conMarginTop, style, html, positionTopLeftWidthHeight,
					paddingMarginBorderVisibility, paddingMarginBorder,
					body = document.getElementsByTagName("body")[0];

			if ( !body ) {
				// Return for frameset docs that don't have a body
				return;
			}

			conMarginTop = 1;
			paddingMarginBorder = "padding:0;margin:0;border:";
			positionTopLeftWidthHeight = "position:absolute;top:0;left:0;width:1px;height:1px;";
			paddingMarginBorderVisibility = paddingMarginBorder + "0;visibility:hidden;";
			style = "style='" + positionTopLeftWidthHeight + paddingMarginBorder + "5px solid #000;";
			html = "<div " + style + "display:block;'><div style='" + paddingMarginBorder + "0;display:block;overflow:hidden;'></div></div>" +
					"<table " + style + "' cellpadding='0' cellspacing='0'>" +
					"<tr><td></td></tr></table>";

			container = document.createElement("div");
			container.style.cssText = paddingMarginBorderVisibility + "width:0;height:0;position:static;top:0;margin-top:" + conMarginTop + "px";
			body.insertBefore( container, body.firstChild );

			// Construct the test element
			div = document.createElement("div");
			container.appendChild( div );

			// Check if table cells still have offsetWidth/Height when they are set
			// to display:none and there are still other visible table cells in a
			// table row; if so, offsetWidth/Height are not reliable for use when
			// determining if an element has been hidden directly using
			// display:none (it is still safe to use offsets if a parent element is
			// hidden; don safety goggles and see bug #4512 for more information).
			// (only IE 8 fails this test)
			div.innerHTML = "<table><tr><td style='" + paddingMarginBorder + "0;display:none'></td><td>t</td></tr></table>";
			tds = div.getElementsByTagName( "td" );
			isSupported = ( tds[ 0 ].offsetHeight === 0 );

			tds[ 0 ].style.display = "";
			tds[ 1 ].style.display = "none";

			// Check if empty table cells still have offsetWidth/Height
			// (IE <= 8 fail this test)
			support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. For more
			// info see bug #3333
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			if ( window.getComputedStyle ) {
				div.innerHTML = "";
				marginDiv = document.createElement( "div" );
				marginDiv.style.width = "0";
				marginDiv.style.marginRight = "0";
				div.style.width = "2px";
				div.appendChild( marginDiv );
				support.reliableMarginRight =
						( parseInt( ( window.getComputedStyle( marginDiv, null ) || { marginRight: 0 } ).marginRight, 10 ) || 0 ) === 0;
			}

			if ( typeof div.style.zoom !== "undefined" ) {
				// Check if natively block-level elements act like inline-block
				// elements when setting their display to 'inline' and giving
				// them layout
				// (IE < 8 does this)
				div.innerHTML = "";
				div.style.width = div.style.padding = "1px";
				div.style.border = 0;
				div.style.overflow = "hidden";
				div.style.display = "inline";
				div.style.zoom = 1;
				support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

				// Check if elements with layout shrink-wrap their children
				// (IE 6 does this)
				div.style.display = "block";
				div.style.overflow = "visible";
				div.innerHTML = "<div style='width:5px;'></div>";
				support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );
			}

			div.style.cssText = positionTopLeftWidthHeight + paddingMarginBorderVisibility;
			div.innerHTML = html;

			outer = div.firstChild;
			inner = outer.firstChild;
			td = outer.nextSibling.firstChild.firstChild;

			offsetSupport = {
				doesNotAddBorder: ( inner.offsetTop !== 5 ),
				doesAddBorderForTableAndCells: ( td.offsetTop === 5 )
			};

			inner.style.position = "fixed";
			inner.style.top = "20px";

			// safari subtracts parent border width here which is 5px
			offsetSupport.fixedPosition = ( inner.offsetTop === 20 || inner.offsetTop === 15 );
			inner.style.position = inner.style.top = "";

			outer.style.overflow = "hidden";
			outer.style.position = "relative";

			offsetSupport.subtractsBorderForOverflowNotVisible = ( inner.offsetTop === -5 );
			offsetSupport.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== conMarginTop );

			if ( window.getComputedStyle ) {
				div.style.marginTop = "1%";
				support.pixelMargin = ( window.getComputedStyle( div, null ) || { marginTop: 0 } ).marginTop !== "1%";
			}

			if ( typeof container.style.zoom !== "undefined" ) {
				container.style.zoom = 1;
			}

			body.removeChild( container );
			marginDiv = div = container = null;

			jQuery.extend( support, offsetSupport );
		});

		return support;
	})();




	var rbrace = /^(?:\{.*\}|\[.*\])$/,
			rmultiDash = /([A-Z])/g;

	jQuery.extend({
		cache: {},

		// Please use with caution
		uuid: 0,

		// Unique for each copy of jQuery on the page
		// Non-digits removed to match rinlinejQuery
		expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),

		// The following elements throw uncatchable exceptions if you
		// attempt to add expando properties to them.
		noData: {
			"embed": true,
			// Ban all objects except for Flash (which handle expandos)
			"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
			"applet": true
		},

		hasData: function( elem ) {
			elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
			return !!elem && !isEmptyDataObject( elem );
		},

		data: function( elem, name, data, pvt /* Internal Use Only */ ) {
			if ( !jQuery.acceptData( elem ) ) {
				return;
			}

			var privateCache, thisCache, ret,
					internalKey = jQuery.expando,
					getByName = typeof name === "string",

			// We have to handle DOM nodes and JS objects differently because IE6-7
			// can't GC object references properly across the DOM-JS boundary
					isNode = elem.nodeType,

			// Only DOM nodes need the global jQuery cache; JS object data is
			// attached directly to the object so GC can occur automatically
					cache = isNode ? jQuery.cache : elem,

			// Only defining an ID for JS objects if its cache already exists allows
			// the code to shortcut on the same path as a DOM node with no cache
					id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey,
					isEvents = name === "events";

			// Avoid doing any more work than we need to when trying to get data on an
			// object that has no data at all
			if ( (!id || !cache[id] || (!isEvents && !pvt && !cache[id].data)) && getByName && data === undefined ) {
				return;
			}

			if ( !id ) {
				// Only DOM nodes need a new unique ID for each element since their data
				// ends up in the global cache
				if ( isNode ) {
					elem[ internalKey ] = id = ++jQuery.uuid;
				} else {
					id = internalKey;
				}
			}

			if ( !cache[ id ] ) {
				cache[ id ] = {};

				// Avoids exposing jQuery metadata on plain JS objects when the object
				// is serialized using JSON.stringify
				if ( !isNode ) {
					cache[ id ].toJSON = jQuery.noop;
				}
			}

			// An object can be passed to jQuery.data instead of a key/value pair; this gets
			// shallow copied over onto the existing cache
			if ( typeof name === "object" || typeof name === "function" ) {
				if ( pvt ) {
					cache[ id ] = jQuery.extend( cache[ id ], name );
				} else {
					cache[ id ].data = jQuery.extend( cache[ id ].data, name );
				}
			}

			privateCache = thisCache = cache[ id ];

			// jQuery data() is stored in a separate object inside the object's internal data
			// cache in order to avoid key collisions between internal data and user-defined
			// data.
			if ( !pvt ) {
				if ( !thisCache.data ) {
					thisCache.data = {};
				}

				thisCache = thisCache.data;
			}

			if ( data !== undefined ) {
				thisCache[ jQuery.camelCase( name ) ] = data;
			}

			// Users should not attempt to inspect the internal events object using jQuery.data,
			// it is undocumented and subject to change. But does anyone listen? No.
			if ( isEvents && !thisCache[ name ] ) {
				return privateCache.events;
			}

			// Check for both converted-to-camel and non-converted data property names
			// If a data property was specified
			if ( getByName ) {

				// First Try to find as-is property data
				ret = thisCache[ name ];

				// Test for null|undefined property data
				if ( ret == null ) {

					// Try to find the camelCased property
					ret = thisCache[ jQuery.camelCase( name ) ];
				}
			} else {
				ret = thisCache;
			}

			return ret;
		},

		removeData: function( elem, name, pvt /* Internal Use Only */ ) {
			if ( !jQuery.acceptData( elem ) ) {
				return;
			}

			var thisCache, i, l,

			// Reference to internal data cache key
					internalKey = jQuery.expando,

					isNode = elem.nodeType,

			// See jQuery.data for more information
					cache = isNode ? jQuery.cache : elem,

			// See jQuery.data for more information
					id = isNode ? elem[ internalKey ] : internalKey;

			// If there is already no cache entry for this object, there is no
			// purpose in continuing
			if ( !cache[ id ] ) {
				return;
			}

			if ( name ) {

				thisCache = pvt ? cache[ id ] : cache[ id ].data;

				if ( thisCache ) {

					// Support array or space separated string names for data keys
					if ( !jQuery.isArray( name ) ) {

						// try the string as a key before any manipulation
						if ( name in thisCache ) {
							name = [ name ];
						} else {

							// split the camel cased version by spaces unless a key with the spaces exists
							name = jQuery.camelCase( name );
							if ( name in thisCache ) {
								name = [ name ];
							} else {
								name = name.split( " " );
							}
						}
					}

					for ( i = 0, l = name.length; i < l; i++ ) {
						delete thisCache[ name[i] ];
					}

					// If there is no data left in the cache, we want to continue
					// and let the cache object itself get destroyed
					if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
						return;
					}
				}
			}

			// See jQuery.data for more information
			if ( !pvt ) {
				delete cache[ id ].data;

				// Don't destroy the parent cache unless the internal data object
				// had been the only thing left in it
				if ( !isEmptyDataObject(cache[ id ]) ) {
					return;
				}
			}

			// Browsers that fail expando deletion also refuse to delete expandos on
			// the window, but it will allow it on all other JS objects; other browsers
			// don't care
			// Ensure that `cache` is not a window object #10080
			if ( jQuery.support.deleteExpando || !cache.setInterval ) {
				delete cache[ id ];
			} else {
				cache[ id ] = null;
			}

			// We destroyed the cache and need to eliminate the expando on the node to avoid
			// false lookups in the cache for entries that no longer exist
			if ( isNode ) {
				// IE does not allow us to delete expando properties from nodes,
				// nor does it have a removeAttribute function on Document nodes;
				// we must handle all of these cases
				if ( jQuery.support.deleteExpando ) {
					delete elem[ internalKey ];
				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( internalKey );
				} else {
					elem[ internalKey ] = null;
				}
			}
		},

		// For internal use only.
		_data: function( elem, name, data ) {
			return jQuery.data( elem, name, data, true );
		},

		// A method for determining if a DOM node can handle the data expando
		acceptData: function( elem ) {
			if ( elem.nodeName ) {
				var match = jQuery.noData[ elem.nodeName.toLowerCase() ];

				if ( match ) {
					return !(match === true || elem.getAttribute("classid") !== match);
				}
			}

			return true;
		}
	});

	jQuery.fn.extend({
		data: function( key, value ) {
			var parts, part, attr, name, l,
					elem = this[0],
					i = 0,
					data = null;

			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = jQuery.data( elem );

					if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
						attr = elem.attributes;
						for ( l = attr.length; i < l; i++ ) {
							name = attr[i].name;

							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.substring(5) );

								dataAttr( elem, name, data[ name ] );
							}
						}
						jQuery._data( elem, "parsedAttrs", true );
					}
				}

				return data;
			}

			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each(function() {
					jQuery.data( this, key );
				});
			}

			parts = key.split( ".", 2 );
			parts[1] = parts[1] ? "." + parts[1] : "";
			part = parts[1] + "!";

			return jQuery.access( this, function( value ) {

				if ( value === undefined ) {
					data = this.triggerHandler( "getData" + part, [ parts[0] ] );

					// Try to fetch any internally stored data first
					if ( data === undefined && elem ) {
						data = jQuery.data( elem, key );
						data = dataAttr( elem, key, data );
					}

					return data === undefined && parts[1] ?
							this.data( parts[0] ) :
							data;
				}

				parts[1] = value;
				this.each(function() {
					var self = jQuery( this );

					self.triggerHandler( "setData" + part, parts );
					jQuery.data( this, key, value );
					self.triggerHandler( "changeData" + part, parts );
				});
			}, null, value, arguments.length > 1, null, false );
		},

		removeData: function( key ) {
			return this.each(function() {
				jQuery.removeData( this, key );
			});
		}
	});

	function dataAttr( elem, key, data ) {
		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {

			var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = data === "true" ? true :
							data === "false" ? false :
									data === "null" ? null :
											jQuery.isNumeric( data ) ? +data :
													rbrace.test( data ) ? jQuery.parseJSON( data ) :
															data;
				} catch( e ) {}

				// Make sure we set the data so it isn't changed later
				jQuery.data( elem, key, data );

			} else {
				data = undefined;
			}
		}

		return data;
	}

// checks a cache object for emptiness
	function isEmptyDataObject( obj ) {
		for ( var name in obj ) {

			// if the public data object is empty, the private is still empty
			if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
				continue;
			}
			if ( name !== "toJSON" ) {
				return false;
			}
		}

		return true;
	}




	function handleQueueMarkDefer( elem, type, src ) {
		var deferDataKey = type + "defer",
				queueDataKey = type + "queue",
				markDataKey = type + "mark",
				defer = jQuery._data( elem, deferDataKey );
		if ( defer &&
				( src === "queue" || !jQuery._data(elem, queueDataKey) ) &&
				( src === "mark" || !jQuery._data(elem, markDataKey) ) ) {
			// Give room for hard-coded callbacks to fire first
			// and eventually mark/queue something else on the element
			setTimeout( function() {
				if ( !jQuery._data( elem, queueDataKey ) &&
						!jQuery._data( elem, markDataKey ) ) {
					jQuery.removeData( elem, deferDataKey, true );
					defer.fire();
				}
			}, 0 );
		}
	}

	jQuery.extend({

		_mark: function( elem, type ) {
			if ( elem ) {
				type = ( type || "fx" ) + "mark";
				jQuery._data( elem, type, (jQuery._data( elem, type ) || 0) + 1 );
			}
		},

		_unmark: function( force, elem, type ) {
			if ( force !== true ) {
				type = elem;
				elem = force;
				force = false;
			}
			if ( elem ) {
				type = type || "fx";
				var key = type + "mark",
						count = force ? 0 : ( (jQuery._data( elem, key ) || 1) - 1 );
				if ( count ) {
					jQuery._data( elem, key, count );
				} else {
					jQuery.removeData( elem, key, true );
					handleQueueMarkDefer( elem, type, "mark" );
				}
			}
		},

		queue: function( elem, type, data ) {
			var q;
			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				q = jQuery._data( elem, type );

				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !q || jQuery.isArray(data) ) {
						q = jQuery._data( elem, type, jQuery.makeArray(data) );
					} else {
						q.push( data );
					}
				}
				return q || [];
			}
		},

		dequeue: function( elem, type ) {
			type = type || "fx";

			var queue = jQuery.queue( elem, type ),
					fn = queue.shift(),
					hooks = {};

			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
			}

			if ( fn ) {
				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}

				jQuery._data( elem, type + ".run", hooks );
				fn.call( elem, function() {
					jQuery.dequeue( elem, type );
				}, hooks );
			}

			if ( !queue.length ) {
				jQuery.removeData( elem, type + "queue " + type + ".run", true );
				handleQueueMarkDefer( elem, type, "queue" );
			}
		}
	});

	jQuery.fn.extend({
		queue: function( type, data ) {
			var setter = 2;

			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}

			if ( arguments.length < setter ) {
				return jQuery.queue( this[0], type );
			}

			return data === undefined ?
					this :
					this.each(function() {
						var queue = jQuery.queue( this, type, data );

						if ( type === "fx" && queue[0] !== "inprogress" ) {
							jQuery.dequeue( this, type );
						}
					});
		},
		dequeue: function( type ) {
			return this.each(function() {
				jQuery.dequeue( this, type );
			});
		},
		// Based off of the plugin by Clint Helfers, with permission.
		// http://blindsignals.com/index.php/2009/07/jquery-delay/
		delay: function( time, type ) {
			time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
			type = type || "fx";

			return this.queue( type, function( next, hooks ) {
				var timeout = setTimeout( next, time );
				hooks.stop = function() {
					clearTimeout( timeout );
				};
			});
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},
		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, object ) {
			if ( typeof type !== "string" ) {
				object = type;
				type = undefined;
			}
			type = type || "fx";
			var defer = jQuery.Deferred(),
					elements = this,
					i = elements.length,
					count = 1,
					deferDataKey = type + "defer",
					queueDataKey = type + "queue",
					markDataKey = type + "mark",
					tmp;
			function resolve() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			}
			while( i-- ) {
				if (( tmp = jQuery.data( elements[ i ], deferDataKey, undefined, true ) ||
						( jQuery.data( elements[ i ], queueDataKey, undefined, true ) ||
								jQuery.data( elements[ i ], markDataKey, undefined, true ) ) &&
								jQuery.data( elements[ i ], deferDataKey, jQuery.Callbacks( "once memory" ), true ) )) {
					count++;
					tmp.add( resolve );
				}
			}
			resolve();
			return defer.promise( object );
		}
	});




	var rclass = /[\n\t\r]/g,
			rspace = /\s+/,
			rreturn = /\r/g,
			rtype = /^(?:button|input)$/i,
			rfocusable = /^(?:button|input|object|select|textarea)$/i,
			rclickable = /^a(?:rea)?$/i,
			rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
			getSetAttribute = jQuery.support.getSetAttribute,
			nodeHook, boolHook, fixSpecified;

	jQuery.fn.extend({
		attr: function( name, value ) {
			return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
		},

		removeAttr: function( name ) {
			return this.each(function() {
				jQuery.removeAttr( this, name );
			});
		},

		prop: function( name, value ) {
			return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
		},

		removeProp: function( name ) {
			name = jQuery.propFix[ name ] || name;
			return this.each(function() {
				// try/catch handles cases where IE balks (such as removing a property on window)
				try {
					this[ name ] = undefined;
					delete this[ name ];
				} catch( e ) {}
			});
		},

		addClass: function( value ) {
			var classNames, i, l, elem,
					setClass, c, cl;

			if ( jQuery.isFunction( value ) ) {
				return this.each(function( j ) {
					jQuery( this ).addClass( value.call(this, j, this.className) );
				});
			}

			if ( value && typeof value === "string" ) {
				classNames = value.split( rspace );

				for ( i = 0, l = this.length; i < l; i++ ) {
					elem = this[ i ];

					if ( elem.nodeType === 1 ) {
						if ( !elem.className && classNames.length === 1 ) {
							elem.className = value;

						} else {
							setClass = " " + elem.className + " ";

							for ( c = 0, cl = classNames.length; c < cl; c++ ) {
								if ( !~setClass.indexOf( " " + classNames[ c ] + " " ) ) {
									setClass += classNames[ c ] + " ";
								}
							}
							elem.className = jQuery.trim( setClass );
						}
					}
				}
			}

			return this;
		},

		removeClass: function( value ) {
			var classNames, i, l, elem, className, c, cl;

			if ( jQuery.isFunction( value ) ) {
				return this.each(function( j ) {
					jQuery( this ).removeClass( value.call(this, j, this.className) );
				});
			}

			if ( (value && typeof value === "string") || value === undefined ) {
				classNames = ( value || "" ).split( rspace );

				for ( i = 0, l = this.length; i < l; i++ ) {
					elem = this[ i ];

					if ( elem.nodeType === 1 && elem.className ) {
						if ( value ) {
							className = (" " + elem.className + " ").replace( rclass, " " );
							for ( c = 0, cl = classNames.length; c < cl; c++ ) {
								className = className.replace(" " + classNames[ c ] + " ", " ");
							}
							elem.className = jQuery.trim( className );

						} else {
							elem.className = "";
						}
					}
				}
			}

			return this;
		},

		toggleClass: function( value, stateVal ) {
			var type = typeof value,
					isBool = typeof stateVal === "boolean";

			if ( jQuery.isFunction( value ) ) {
				return this.each(function( i ) {
					jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
				});
			}

			return this.each(function() {
				if ( type === "string" ) {
					// toggle individual class names
					var className,
							i = 0,
							self = jQuery( this ),
							state = stateVal,
							classNames = value.split( rspace );

					while ( (className = classNames[ i++ ]) ) {
						// check each className given, space seperated list
						state = isBool ? state : !self.hasClass( className );
						self[ state ? "addClass" : "removeClass" ]( className );
					}

				} else if ( type === "undefined" || type === "boolean" ) {
					if ( this.className ) {
						// store className if set
						jQuery._data( this, "__className__", this.className );
					}

					// toggle whole className
					this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
				}
			});
		},

		hasClass: function( selector ) {
			var className = " " + selector + " ",
					i = 0,
					l = this.length;
			for ( ; i < l; i++ ) {
				if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
					return true;
				}
			}

			return false;
		},

		val: function( value ) {
			var hooks, ret, isFunction,
					elem = this[0];

			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

					if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
						return ret;
					}

					ret = elem.value;

					return typeof ret === "string" ?
						// handle most common string cases
							ret.replace(rreturn, "") :
						// handle cases where value is null/undef or number
							ret == null ? "" : ret;
				}

				return;
			}

			isFunction = jQuery.isFunction( value );

			return this.each(function( i ) {
				var self = jQuery(this), val;

				if ( this.nodeType !== 1 ) {
					return;
				}

				if ( isFunction ) {
					val = value.call( this, i, self.val() );
				} else {
					val = value;
				}

				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";
				} else if ( typeof val === "number" ) {
					val += "";
				} else if ( jQuery.isArray( val ) ) {
					val = jQuery.map(val, function ( value ) {
						return value == null ? "" : value + "";
					});
				}

				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

				// If set returns undefined, fall back to normal setting
				if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			});
		}
	});

	jQuery.extend({
		valHooks: {
			option: {
				get: function( elem ) {
					// attributes.value is undefined in Blackberry 4.7 but
					// uses .value. See #6932
					var val = elem.attributes.value;
					return !val || val.specified ? elem.value : elem.text;
				}
			},
			select: {
				get: function( elem ) {
					var value, i, max, option,
							index = elem.selectedIndex,
							values = [],
							options = elem.options,
							one = elem.type === "select-one";

					// Nothing was selected
					if ( index < 0 ) {
						return null;
					}

					// Loop through all the selected options
					i = one ? index : 0;
					max = one ? index + 1 : options.length;
					for ( ; i < max; i++ ) {
						option = options[ i ];

						// Don't return options that are disabled or in a disabled optgroup
						if ( option.selected && (jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
								(!option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" )) ) {

							// Get the specific value for the option
							value = jQuery( option ).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					// Fixes Bug #2551 -- select.val() broken in IE after form.reset()
					if ( one && !values.length && options.length ) {
						return jQuery( options[ index ] ).val();
					}

					return values;
				},

				set: function( elem, value ) {
					var values = jQuery.makeArray( value );

					jQuery(elem).find("option").each(function() {
						this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
					});

					if ( !values.length ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		},

		attrFn: {
			val: true,
			css: true,
			html: true,
			text: true,
			data: true,
			width: true,
			height: true,
			offset: true
		},

		attr: function( elem, name, value, pass ) {
			var ret, hooks, notxml,
					nType = elem.nodeType;

			// don't get/set attributes on text, comment and attribute nodes
			if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			if ( pass && name in jQuery.attrFn ) {
				return jQuery( elem )[ name ]( value );
			}

			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}

			notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

			// All attributes are lowercase
			// Grab necessary hook if one is defined
			if ( notxml ) {
				name = name.toLowerCase();
				hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
			}

			if ( value !== undefined ) {

				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;

				} else if ( hooks && "set" in hooks && notxml && (ret = hooks.set( elem, value, name )) !== undefined ) {
					return ret;

				} else {
					elem.setAttribute( name, "" + value );
					return value;
				}

			} else if ( hooks && "get" in hooks && notxml && (ret = hooks.get( elem, name )) !== null ) {
				return ret;

			} else {

				ret = elem.getAttribute( name );

				// Non-existent attributes return null, we normalize to undefined
				return ret === null ?
						undefined :
						ret;
			}
		},

		removeAttr: function( elem, value ) {
			var propName, attrNames, name, l, isBool,
					i = 0;

			if ( value && elem.nodeType === 1 ) {
				attrNames = value.toLowerCase().split( rspace );
				l = attrNames.length;

				for ( ; i < l; i++ ) {
					name = attrNames[ i ];

					if ( name ) {
						propName = jQuery.propFix[ name ] || name;
						isBool = rboolean.test( name );

						// See #9699 for explanation of this approach (setting first, then removal)
						// Do not do this for boolean attributes (see #10870)
						if ( !isBool ) {
							jQuery.attr( elem, name, "" );
						}
						elem.removeAttribute( getSetAttribute ? name : propName );

						// Set corresponding property to false for boolean attributes
						if ( isBool && propName in elem ) {
							elem[ propName ] = false;
						}
					}
				}
			}
		},

		attrHooks: {
			type: {
				set: function( elem, value ) {
					// We can't allow the type property to be changed (since it causes problems in IE)
					if ( rtype.test( elem.nodeName ) && elem.parentNode ) {
						jQuery.error( "type property can't be changed" );
					} else if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
						// Setting the type on a radio button after the value resets the value in IE6-9
						// Reset value to it's default in case type is set after value
						// This is for element creation
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			},
			// Use the value property for back compat
			// Use the nodeHook for button elements in IE6/7 (#1954)
			value: {
				get: function( elem, name ) {
					if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
						return nodeHook.get( elem, name );
					}
					return name in elem ?
							elem.value :
							null;
				},
				set: function( elem, value, name ) {
					if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
						return nodeHook.set( elem, value, name );
					}
					// Does not return so that setAttribute is also used
					elem.value = value;
				}
			}
		},

		propFix: {
			tabindex: "tabIndex",
			readonly: "readOnly",
			"for": "htmlFor",
			"class": "className",
			maxlength: "maxLength",
			cellspacing: "cellSpacing",
			cellpadding: "cellPadding",
			rowspan: "rowSpan",
			colspan: "colSpan",
			usemap: "useMap",
			frameborder: "frameBorder",
			contenteditable: "contentEditable"
		},

		prop: function( elem, name, value ) {
			var ret, hooks, notxml,
					nType = elem.nodeType;

			// don't get/set properties on text, comment and attribute nodes
			if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

			if ( notxml ) {
				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}

			if ( value !== undefined ) {
				if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
					return ret;

				} else {
					return ( elem[ name ] = value );
				}

			} else {
				if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
					return ret;

				} else {
					return elem[ name ];
				}
			}
		},

		propHooks: {
			tabIndex: {
				get: function( elem ) {
					// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
					// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					var attributeNode = elem.getAttributeNode("tabindex");

					return attributeNode && attributeNode.specified ?
							parseInt( attributeNode.value, 10 ) :
							rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
									0 :
									undefined;
				}
			}
		}
	});

// Add the tabIndex propHook to attrHooks for back-compat (different case is intentional)
	jQuery.attrHooks.tabindex = jQuery.propHooks.tabIndex;

// Hook for boolean attributes
	boolHook = {
		get: function( elem, name ) {
			// Align boolean attributes with corresponding properties
			// Fall back to attribute presence where some booleans are not supported
			var attrNode,
					property = jQuery.prop( elem, name );
			return property === true || typeof property !== "boolean" && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
					name.toLowerCase() :
					undefined;
		},
		set: function( elem, value, name ) {
			var propName;
			if ( value === false ) {
				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				// value is true since we know at this point it's type boolean and not false
				// Set boolean attributes to the same name and set the DOM property
				propName = jQuery.propFix[ name ] || name;
				if ( propName in elem ) {
					// Only set the IDL specifically if it already exists on the element
					elem[ propName ] = true;
				}

				elem.setAttribute( name, name.toLowerCase() );
			}
			return name;
		}
	};

// IE6/7 do not support getting/setting some attributes with get/setAttribute
	if ( !getSetAttribute ) {

		fixSpecified = {
			name: true,
			id: true,
			coords: true
		};

		// Use this for any attribute in IE6/7
		// This fixes almost every IE6/7 issue
		nodeHook = jQuery.valHooks.button = {
			get: function( elem, name ) {
				var ret;
				ret = elem.getAttributeNode( name );
				return ret && ( fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified ) ?
						ret.nodeValue :
						undefined;
			},
			set: function( elem, value, name ) {
				// Set the existing or create a new attribute node
				var ret = elem.getAttributeNode( name );
				if ( !ret ) {
					ret = document.createAttribute( name );
					elem.setAttributeNode( ret );
				}
				return ( ret.nodeValue = value + "" );
			}
		};

		// Apply the nodeHook to tabindex
		jQuery.attrHooks.tabindex.set = nodeHook.set;

		// Set width and height to auto instead of 0 on empty string( Bug #8150 )
		// This is for removals
		jQuery.each([ "width", "height" ], function( i, name ) {
			jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
				set: function( elem, value ) {
					if ( value === "" ) {
						elem.setAttribute( name, "auto" );
						return value;
					}
				}
			});
		});

		// Set contenteditable to false on removals(#10429)
		// Setting to empty string throws an error as an invalid value
		jQuery.attrHooks.contenteditable = {
			get: nodeHook.get,
			set: function( elem, value, name ) {
				if ( value === "" ) {
					value = "false";
				}
				nodeHook.set( elem, value, name );
			}
		};
	}


// Some attributes require a special call on IE
	if ( !jQuery.support.hrefNormalized ) {
		jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
			jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
				get: function( elem ) {
					var ret = elem.getAttribute( name, 2 );
					return ret === null ? undefined : ret;
				}
			});
		});
	}

	if ( !jQuery.support.style ) {
		jQuery.attrHooks.style = {
			get: function( elem ) {
				// Return undefined in the case of empty string
				// Normalize to lowercase since IE uppercases css property names
				return elem.style.cssText.toLowerCase() || undefined;
			},
			set: function( elem, value ) {
				return ( elem.style.cssText = "" + value );
			}
		};
	}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
	if ( !jQuery.support.optSelected ) {
		jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
			get: function( elem ) {
				var parent = elem.parentNode;

				if ( parent ) {
					parent.selectedIndex;

					// Make sure that it also works with optgroups, see #5701
					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
				return null;
			}
		});
	}

// IE6/7 call enctype encoding
	if ( !jQuery.support.enctype ) {
		jQuery.propFix.enctype = "encoding";
	}

// Radios and checkboxes getter/setter
	if ( !jQuery.support.checkOn ) {
		jQuery.each([ "radio", "checkbox" ], function() {
			jQuery.valHooks[ this ] = {
				get: function( elem ) {
					// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
					return elem.getAttribute("value") === null ? "on" : elem.value;
				}
			};
		});
	}
	jQuery.each([ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
			set: function( elem, value ) {
				if ( jQuery.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
				}
			}
		});
	});




	var rformElems = /^(?:textarea|input|select)$/i,
			rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/,
			rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,
			rkeyEvent = /^key/,
			rmouseEvent = /^(?:mouse|contextmenu)|click/,
			rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
			rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,
			quickParse = function( selector ) {
				var quick = rquickIs.exec( selector );
				if ( quick ) {
					//   0  1    2   3
					// [ _, tag, id, class ]
					quick[1] = ( quick[1] || "" ).toLowerCase();
					quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
				}
				return quick;
			},
			quickIs = function( elem, m ) {
				var attrs = elem.attributes || {};
				return (
						(!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
								(!m[2] || (attrs.id || {}).value === m[2]) &&
								(!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
						);
			},
			hoverHack = function( events ) {
				return jQuery.event.special.hover ? events : events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
			};

	/*
	 * Helper functions for managing events -- not part of the public interface.
	 * Props to Dean Edwards' addEvent library for many of the ideas.
	 */
	jQuery.event = {

		add: function( elem, types, handler, data, selector ) {

			var elemData, eventHandle, events,
					t, tns, type, namespaces, handleObj,
					handleObjIn, quick, handlers, special;

			// Don't attach events to noData or text/comment nodes (allow plain objects tho)
			if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
				return;
			}

			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}

			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}

			// Init the element's event structure and main handler, if this is the first
			events = elemData.events;
			if ( !events ) {
				elemData.events = events = {};
			}
			eventHandle = elemData.handle;
			if ( !eventHandle ) {
				elemData.handle = eventHandle = function( e ) {
					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
							jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
							undefined;
				};
				// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
				eventHandle.elem = elem;
			}

			// Handle multiple events separated by a space
			// jQuery(...).bind("mouseover mouseout", fn);
			types = jQuery.trim( hoverHack(types) ).split( " " );
			for ( t = 0; t < types.length; t++ ) {

				tns = rtypenamespace.exec( types[t] ) || [];
				type = tns[1];
				namespaces = ( tns[2] || "" ).split( "." ).sort();

				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};

				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;

				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};

				// handleObj is passed to all event handlers
				handleObj = jQuery.extend({
					type: type,
					origType: tns[1],
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					quick: selector && quickParse( selector ),
					namespace: namespaces.join(".")
				}, handleObjIn );

				// Init the event handler queue if we're the first
				handlers = events[ type ];
				if ( !handlers ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;

					// Only use addEventListener/attachEvent if the special events handler returns false
					if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
						// Bind the global event handler to the element
						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle, false );

						} else if ( elem.attachEvent ) {
							elem.attachEvent( "on" + type, eventHandle );
						}
					}
				}

				if ( special.add ) {
					special.add.call( elem, handleObj );

					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}

				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}

				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}

			// Nullify elem to prevent memory leaks in IE
			elem = null;
		},

		global: {},

		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {

			var elemData = jQuery.hasData( elem ) && jQuery._data( elem ),
					t, tns, type, origType, namespaces, origCount,
					j, events, special, handle, eventType, handleObj;

			if ( !elemData || !(events = elemData.events) ) {
				return;
			}

			// Once for each type.namespace in types; type may be omitted
			types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
			for ( t = 0; t < types.length; t++ ) {
				tns = rtypenamespace.exec( types[t] ) || [];
				type = origType = tns[1];
				namespaces = tns[2];

				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}

				special = jQuery.event.special[ type ] || {};
				type = ( selector? special.delegateType : special.bindType ) || type;
				eventType = events[ type ] || [];
				origCount = eventType.length;
				namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;

				// Remove matching events
				for ( j = 0; j < eventType.length; j++ ) {
					handleObj = eventType[ j ];

					if ( ( mappedTypes || origType === handleObj.origType ) &&
							( !handler || handler.guid === handleObj.guid ) &&
							( !namespaces || namespaces.test( handleObj.namespace ) ) &&
							( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
						eventType.splice( j--, 1 );

						if ( handleObj.selector ) {
							eventType.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}

				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( eventType.length === 0 && origCount !== eventType.length ) {
					if ( !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
						jQuery.removeEvent( elem, type, elemData.handle );
					}

					delete events[ type ];
				}
			}

			// Remove the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				handle = elemData.handle;
				if ( handle ) {
					handle.elem = null;
				}

				// removeData also checks for emptiness and clears the expando if empty
				// so use it instead of delete
				jQuery.removeData( elem, [ "events", "handle" ], true );
			}
		},

		// Events that are safe to short-circuit if no handlers are attached.
		// Native DOM events should not be added, they may have inline handlers.
		customEvent: {
			"getData": true,
			"setData": true,
			"changeData": true
		},

		trigger: function( event, data, elem, onlyHandlers ) {
			// Don't do events on text and comment nodes
			if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
				return;
			}

			// Event object or event type
			var type = event.type || event,
					namespaces = [],
					cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType;

			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}

			if ( type.indexOf( "!" ) >= 0 ) {
				// Exclusive events trigger only for the exact event (no namespaces)
				type = type.slice(0, -1);
				exclusive = true;
			}

			if ( type.indexOf( "." ) >= 0 ) {
				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split(".");
				type = namespaces.shift();
				namespaces.sort();
			}

			if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
				// No jQuery handlers for this event type, and it can't have inline handlers
				return;
			}

			// Caller can pass in an Event, Object, or just an event type string
			event = typeof event === "object" ?
				// jQuery.Event object
					event[ jQuery.expando ] ? event :
						// Object literal
							new jQuery.Event( type, event ) :
				// Just the event type (string)
					new jQuery.Event( type );

			event.type = type;
			event.isTrigger = true;
			event.exclusive = exclusive;
			event.namespace = namespaces.join( "." );
			event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
			ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";

			// Handle a global trigger
			if ( !elem ) {

				// TODO: Stop taunting the data cache; remove global events and always attach to document
				cache = jQuery.cache;
				for ( i in cache ) {
					if ( cache[ i ].events && cache[ i ].events[ type ] ) {
						jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
					}
				}
				return;
			}

			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}

			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data != null ? jQuery.makeArray( data ) : [];
			data.unshift( event );

			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}

			// Determine event propagation path in advance, per W3C events spec (#9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
			eventPath = [[ elem, special.bindType || type ]];
			if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

				bubbleType = special.delegateType || type;
				cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
				old = null;
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push([ cur, bubbleType ]);
					old = cur;
				}

				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( old && old === elem.ownerDocument ) {
					eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
				}
			}

			// Fire handlers on the event path
			for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

				cur = eventPath[i][0];
				event.type = eventPath[i][1];

				handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}
				// Note that this is a bare JS function and not a jQuery handler
				handle = ontype && cur[ ontype ];
				if ( handle && jQuery.acceptData( cur ) && handle.apply( cur, data ) === false ) {
					event.preventDefault();
				}
			}
			event.type = type;

			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {

				if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
						!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

					// Call a native DOM method on the target with the same name name as the event.
					// Can't use an .isFunction() check here because IE6/7 fails that test.
					// Don't do default actions on window, that's where global variables be (#6170)
					// IE<9 dies on focus/blur to hidden element (#1486)
					if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") || event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {

						// Don't re-trigger an onFOO event when we call its FOO() method
						old = elem[ ontype ];

						if ( old ) {
							elem[ ontype ] = null;
						}

						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;
						elem[ type ]();
						jQuery.event.triggered = undefined;

						if ( old ) {
							elem[ ontype ] = old;
						}
					}
				}
			}

			return event.result;
		},

		dispatch: function( event ) {

			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( event || window.event );

			var handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
					delegateCount = handlers.delegateCount,
					args = [].slice.call( arguments, 0 ),
					run_all = !event.exclusive && !event.namespace,
					special = jQuery.event.special[ event.type ] || {},
					handlerQueue = [],
					i, j, cur, jqcur, ret, selMatch, matched, matches, handleObj, sel, related;

			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[0] = event;
			event.delegateTarget = this;

			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}

			// Determine handlers that should run if there are delegated events
			// Avoid non-left-click bubbling in Firefox (#3861)
			if ( delegateCount && !(event.button && event.type === "click") ) {

				// Pregenerate a single jQuery object for reuse with .is()
				jqcur = jQuery(this);
				jqcur.context = this.ownerDocument || this;

				for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {

					// Don't process events on disabled elements (#6911, #8165)
					if ( cur.disabled !== true ) {
						selMatch = {};
						matches = [];
						jqcur[0] = cur;
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];
							sel = handleObj.selector;

							if ( selMatch[ sel ] === undefined ) {
								selMatch[ sel ] = (
										handleObj.quick ? quickIs( cur, handleObj.quick ) : jqcur.is( sel )
										);
							}
							if ( selMatch[ sel ] ) {
								matches.push( handleObj );
							}
						}
						if ( matches.length ) {
							handlerQueue.push({ elem: cur, matches: matches });
						}
					}
				}
			}

			// Add the remaining (directly-bound) handlers
			if ( handlers.length > delegateCount ) {
				handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
			}

			// Run delegates first; they may want to stop propagation beneath us
			for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
				matched = handlerQueue[ i ];
				event.currentTarget = matched.elem;

				for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
					handleObj = matched.matches[ j ];

					// Triggered event must either 1) be non-exclusive and have no namespace, or
					// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
					if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

						event.data = handleObj.data;
						event.handleObj = handleObj;

						ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
								.apply( matched.elem, args );

						if ( ret !== undefined ) {
							event.result = ret;
							if ( ret === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}

			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}

			return event.result;
		},

		// Includes some event props shared by KeyEvent and MouseEvent
		// *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
		props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

		fixHooks: {},

		keyHooks: {
			props: "char charCode key keyCode".split(" "),
			filter: function( event, original ) {

				// Add which for key events
				if ( event.which == null ) {
					event.which = original.charCode != null ? original.charCode : original.keyCode;
				}

				return event;
			}
		},

		mouseHooks: {
			props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
			filter: function( event, original ) {
				var eventDoc, doc, body,
						button = original.button,
						fromElement = original.fromElement;

				// Calculate pageX/Y if missing and clientX/Y available
				if ( event.pageX == null && original.clientX != null ) {
					eventDoc = event.target.ownerDocument || document;
					doc = eventDoc.documentElement;
					body = eventDoc.body;

					event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
					event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
				}

				// Add relatedTarget, if necessary
				if ( !event.relatedTarget && fromElement ) {
					event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
				}

				// Add which for click: 1 === left; 2 === middle; 3 === right
				// Note: button is not normalized, so don't use it
				if ( !event.which && button !== undefined ) {
					event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
				}

				return event;
			}
		},

		fix: function( event ) {
			if ( event[ jQuery.expando ] ) {
				return event;
			}

			// Create a writable copy of the event object and normalize some properties
			var i, prop,
					originalEvent = event,
					fixHook = jQuery.event.fixHooks[ event.type ] || {},
					copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

			event = jQuery.Event( originalEvent );

			for ( i = copy.length; i; ) {
				prop = copy[ --i ];
				event[ prop ] = originalEvent[ prop ];
			}

			// Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
			if ( !event.target ) {
				event.target = originalEvent.srcElement || document;
			}

			// Target should not be a text node (#504, Safari)
			if ( event.target.nodeType === 3 ) {
				event.target = event.target.parentNode;
			}

			// For mouse/key events; add metaKey if it's not there (#3368, IE6/7/8)
			if ( event.metaKey === undefined ) {
				event.metaKey = event.ctrlKey;
			}

			return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
		},

		special: {
			ready: {
				// Make sure the ready event is setup
				setup: jQuery.bindReady
			},

			load: {
				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},

			focus: {
				delegateType: "focusin"
			},
			blur: {
				delegateType: "focusout"
			},

			beforeunload: {
				setup: function( data, namespaces, eventHandle ) {
					// We only want to do this special case on windows
					if ( jQuery.isWindow( this ) ) {
						this.onbeforeunload = eventHandle;
					}
				},

				teardown: function( namespaces, eventHandle ) {
					if ( this.onbeforeunload === eventHandle ) {
						this.onbeforeunload = null;
					}
				}
			}
		},

		simulate: function( type, elem, event, bubble ) {
			// Piggyback on a donor event to simulate a different one.
			// Fake originalEvent to avoid donor's stopPropagation, but if the
			// simulated event prevents default then we do the same on the donor.
			var e = jQuery.extend(
					new jQuery.Event(),
					event,
					{ type: type,
						isSimulated: true,
						originalEvent: {}
					}
			);
			if ( bubble ) {
				jQuery.event.trigger( e, null, elem );
			} else {
				jQuery.event.dispatch.call( elem, e );
			}
			if ( e.isDefaultPrevented() ) {
				event.preventDefault();
			}
		}
	};

// Some plugins are using, but it's undocumented/deprecated and will be removed.
// The 1.7 special event interface should provide all the hooks needed now.
	jQuery.event.handle = jQuery.event.dispatch;

	jQuery.removeEvent = document.removeEventListener ?
			function( elem, type, handle ) {
				if ( elem.removeEventListener ) {
					elem.removeEventListener( type, handle, false );
				}
			} :
			function( elem, type, handle ) {
				if ( elem.detachEvent ) {
					elem.detachEvent( "on" + type, handle );
				}
			};

	jQuery.Event = function( src, props ) {
		// Allow instantiation without the 'new' keyword
		if ( !(this instanceof jQuery.Event) ) {
			return new jQuery.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
					src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

			// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || jQuery.now();

		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};

	function returnFalse() {
		return false;
	}
	function returnTrue() {
		return true;
	}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		preventDefault: function() {
			this.isDefaultPrevented = returnTrue;

			var e = this.originalEvent;
			if ( !e ) {
				return;
			}

			// if preventDefault exists run it on the original event
			if ( e.preventDefault ) {
				e.preventDefault();

				// otherwise set the returnValue property of the original event to false (IE)
			} else {
				e.returnValue = false;
			}
		},
		stopPropagation: function() {
			this.isPropagationStopped = returnTrue;

			var e = this.originalEvent;
			if ( !e ) {
				return;
			}
			// if stopPropagation exists run it on the original event
			if ( e.stopPropagation ) {
				e.stopPropagation();
			}
			// otherwise set the cancelBubble property of the original event to true (IE)
			e.cancelBubble = true;
		},
		stopImmediatePropagation: function() {
			this.isImmediatePropagationStopped = returnTrue;
			this.stopPropagation();
		},
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse
	};

// Create mouseenter/leave events using mouseover/out and event-time checks
	jQuery.each({
		mouseenter: "mouseover",
		mouseleave: "mouseout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,

			handle: function( event ) {
				var target = this,
						related = event.relatedTarget,
						handleObj = event.handleObj,
						selector = handleObj.selector,
						ret;

				// For mousenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	});

// IE submit delegation
	if ( !jQuery.support.submitBubbles ) {

		jQuery.event.special.submit = {
			setup: function() {
				// Only need this for delegated form submit events
				if ( jQuery.nodeName( this, "form" ) ) {
					return false;
				}

				// Lazy-add a submit handler when a descendant form may potentially be submitted
				jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
					// Node name check avoids a VML-related crash in IE (#9807)
					var elem = e.target,
							form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
					if ( form && !form._submit_attached ) {
						jQuery.event.add( form, "submit._submit", function( event ) {
							event._submit_bubble = true;
						});
						form._submit_attached = true;
					}
				});
				// return undefined since we don't need an event listener
			},

			postDispatch: function( event ) {
				// If form was submitted by the user, bubble the event up the tree
				if ( event._submit_bubble ) {
					delete event._submit_bubble;
					if ( this.parentNode && !event.isTrigger ) {
						jQuery.event.simulate( "submit", this.parentNode, event, true );
					}
				}
			},

			teardown: function() {
				// Only need this for delegated form submit events
				if ( jQuery.nodeName( this, "form" ) ) {
					return false;
				}

				// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
				jQuery.event.remove( this, "._submit" );
			}
		};
	}

// IE change delegation and checkbox/radio fix
	if ( !jQuery.support.changeBubbles ) {

		jQuery.event.special.change = {

			setup: function() {

				if ( rformElems.test( this.nodeName ) ) {
					// IE doesn't fire change on a check/radio until blur; trigger it on click
					// after a propertychange. Eat the blur-change in special.change.handle.
					// This still fires onchange a second time for check/radio after blur.
					if ( this.type === "checkbox" || this.type === "radio" ) {
						jQuery.event.add( this, "propertychange._change", function( event ) {
							if ( event.originalEvent.propertyName === "checked" ) {
								this._just_changed = true;
							}
						});
						jQuery.event.add( this, "click._change", function( event ) {
							if ( this._just_changed && !event.isTrigger ) {
								this._just_changed = false;
								jQuery.event.simulate( "change", this, event, true );
							}
						});
					}
					return false;
				}
				// Delegated event; lazy-add a change handler on descendant inputs
				jQuery.event.add( this, "beforeactivate._change", function( e ) {
					var elem = e.target;

					if ( rformElems.test( elem.nodeName ) && !elem._change_attached ) {
						jQuery.event.add( elem, "change._change", function( event ) {
							if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
								jQuery.event.simulate( "change", this.parentNode, event, true );
							}
						});
						elem._change_attached = true;
					}
				});
			},

			handle: function( event ) {
				var elem = event.target;

				// Swallow native change events from checkbox/radio, we already triggered them above
				if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
					return event.handleObj.handler.apply( this, arguments );
				}
			},

			teardown: function() {
				jQuery.event.remove( this, "._change" );

				return rformElems.test( this.nodeName );
			}
		};
	}

// Create "bubbling" focus and blur events
	if ( !jQuery.support.focusinBubbles ) {
		jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

			// Attach a single capturing handler while someone wants focusin/focusout
			var attaches = 0,
					handler = function( event ) {
						jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
					};

			jQuery.event.special[ fix ] = {
				setup: function() {
					if ( attaches++ === 0 ) {
						document.addEventListener( orig, handler, true );
					}
				},
				teardown: function() {
					if ( --attaches === 0 ) {
						document.removeEventListener( orig, handler, true );
					}
				}
			};
		});
	}

	jQuery.fn.extend({

		on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
			var origFn, type;

			// Types can be a map of types/handlers
			if ( typeof types === "object" ) {
				// ( types-Object, selector, data )
				if ( typeof selector !== "string" ) { // && selector != null
					// ( types-Object, data )
					data = data || selector;
					selector = undefined;
				}
				for ( type in types ) {
					this.on( type, selector, data, types[ type ], one );
				}
				return this;
			}

			if ( data == null && fn == null ) {
				// ( types, fn )
				fn = selector;
				data = selector = undefined;
			} else if ( fn == null ) {
				if ( typeof selector === "string" ) {
					// ( types, selector, fn )
					fn = data;
					data = undefined;
				} else {
					// ( types, data, fn )
					fn = data;
					data = selector;
					selector = undefined;
				}
			}
			if ( fn === false ) {
				fn = returnFalse;
			} else if ( !fn ) {
				return this;
			}

			if ( one === 1 ) {
				origFn = fn;
				fn = function( event ) {
					// Can use an empty set, since event contains the info
					jQuery().off( event );
					return origFn.apply( this, arguments );
				};
				// Use same guid so caller can remove using origFn
				fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
			}
			return this.each( function() {
				jQuery.event.add( this, types, fn, data, selector );
			});
		},
		one: function( types, selector, data, fn ) {
			return this.on( types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			if ( types && types.preventDefault && types.handleObj ) {
				// ( event )  dispatched jQuery.Event
				var handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
						handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
						handleObj.selector,
						handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {
				// ( types-object [, selector] )
				for ( var type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {
				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each(function() {
				jQuery.event.remove( this, types, fn, selector );
			});
		},

		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},

		live: function( types, data, fn ) {
			jQuery( this.context ).on( types, this.selector, data, fn );
			return this;
		},
		die: function( types, fn ) {
			jQuery( this.context ).off( types, this.selector || "**", fn );
			return this;
		},

		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {
			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length == 1? this.off( selector, "**" ) : this.off( types, selector, fn );
		},

		trigger: function( type, data ) {
			return this.each(function() {
				jQuery.event.trigger( type, data, this );
			});
		},
		triggerHandler: function( type, data ) {
			if ( this[0] ) {
				return jQuery.event.trigger( type, data, this[0], true );
			}
		},

		toggle: function( fn ) {
			// Save reference to arguments for access in closure
			var args = arguments,
					guid = fn.guid || jQuery.guid++,
					i = 0,
					toggler = function( event ) {
						// Figure out which function to execute
						var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
						jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

						// Make sure that clicks stop
						event.preventDefault();

						// and execute the function
						return args[ lastToggle ].apply( this, arguments ) || false;
					};

			// link all the functions, so any of them can unbind this click handler
			toggler.guid = guid;
			while ( i < args.length ) {
				args[ i++ ].guid = guid;
			}

			return this.click( toggler );
		},

		hover: function( fnOver, fnOut ) {
			return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
		}
	});

	jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
			"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
			"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

		// Handle event binding
		jQuery.fn[ name ] = function( data, fn ) {
			if ( fn == null ) {
				fn = data;
				data = null;
			}

			return arguments.length > 0 ?
					this.on( name, null, data, fn ) :
					this.trigger( name );
		};

		if ( jQuery.attrFn ) {
			jQuery.attrFn[ name ] = true;
		}

		if ( rkeyEvent.test( name ) ) {
			jQuery.event.fixHooks[ name ] = jQuery.event.keyHooks;
		}

		if ( rmouseEvent.test( name ) ) {
			jQuery.event.fixHooks[ name ] = jQuery.event.mouseHooks;
		}
	});



	/*!
	 * Sizzle CSS Selector Engine
	 *  Copyright 2011, The Dojo Foundation
	 *  Released under the MIT, BSD, and GPL Licenses.
	 *  More information: http://sizzlejs.com/
	 */
	(function(){

		var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
				expando = "sizcache" + (Math.random() + '').replace('.', ''),
				done = 0,
				toString = Object.prototype.toString,
				hasDuplicate = false,
				baseHasDuplicate = true,
				rBackslash = /\\/g,
				rReturn = /\r\n/g,
				rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
		[0, 0].sort(function() {
			baseHasDuplicate = false;
			return 0;
		});

		var Sizzle = function( selector, context, results, seed ) {
			results = results || [];
			context = context || document;

			var origContext = context;

			if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
				return [];
			}

			if ( !selector || typeof selector !== "string" ) {
				return results;
			}

			var m, set, checkSet, extra, ret, cur, pop, i,
					prune = true,
					contextXML = Sizzle.isXML( context ),
					parts = [],
					soFar = selector;

			// Reset the position of the chunker regexp (start from head)
			do {
				chunker.exec( "" );
				m = chunker.exec( soFar );

				if ( m ) {
					soFar = m[3];

					parts.push( m[1] );

					if ( m[2] ) {
						extra = m[3];
						break;
					}
				}
			} while ( m );

			if ( parts.length > 1 && origPOS.exec( selector ) ) {

				if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
					set = posProcess( parts[0] + parts[1], context, seed );

				} else {
					set = Expr.relative[ parts[0] ] ?
							[ context ] :
							Sizzle( parts.shift(), context );

					while ( parts.length ) {
						selector = parts.shift();

						if ( Expr.relative[ selector ] ) {
							selector += parts.shift();
						}

						set = posProcess( selector, set, seed );
					}
				}

			} else {
				// Take a shortcut and set the context if the root selector is an ID
				// (but not if it'll be faster if the inner selector is an ID)
				if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
						Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

					ret = Sizzle.find( parts.shift(), context, contextXML );
					context = ret.expr ?
							Sizzle.filter( ret.expr, ret.set )[0] :
							ret.set[0];
				}

				if ( context ) {
					ret = seed ?
					{ expr: parts.pop(), set: makeArray(seed) } :
							Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

					set = ret.expr ?
							Sizzle.filter( ret.expr, ret.set ) :
							ret.set;

					if ( parts.length > 0 ) {
						checkSet = makeArray( set );

					} else {
						prune = false;
					}

					while ( parts.length ) {
						cur = parts.pop();
						pop = cur;

						if ( !Expr.relative[ cur ] ) {
							cur = "";
						} else {
							pop = parts.pop();
						}

						if ( pop == null ) {
							pop = context;
						}

						Expr.relative[ cur ]( checkSet, pop, contextXML );
					}

				} else {
					checkSet = parts = [];
				}
			}

			if ( !checkSet ) {
				checkSet = set;
			}

			if ( !checkSet ) {
				Sizzle.error( cur || selector );
			}

			if ( toString.call(checkSet) === "[object Array]" ) {
				if ( !prune ) {
					results.push.apply( results, checkSet );

				} else if ( context && context.nodeType === 1 ) {
					for ( i = 0; checkSet[i] != null; i++ ) {
						if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
							results.push( set[i] );
						}
					}

				} else {
					for ( i = 0; checkSet[i] != null; i++ ) {
						if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
							results.push( set[i] );
						}
					}
				}

			} else {
				makeArray( checkSet, results );
			}

			if ( extra ) {
				Sizzle( extra, origContext, results, seed );
				Sizzle.uniqueSort( results );
			}

			return results;
		};

		Sizzle.uniqueSort = function( results ) {
			if ( sortOrder ) {
				hasDuplicate = baseHasDuplicate;
				results.sort( sortOrder );

				if ( hasDuplicate ) {
					for ( var i = 1; i < results.length; i++ ) {
						if ( results[i] === results[ i - 1 ] ) {
							results.splice( i--, 1 );
						}
					}
				}
			}

			return results;
		};

		Sizzle.matches = function( expr, set ) {
			return Sizzle( expr, null, null, set );
		};

		Sizzle.matchesSelector = function( node, expr ) {
			return Sizzle( expr, null, null, [node] ).length > 0;
		};

		Sizzle.find = function( expr, context, isXML ) {
			var set, i, len, match, type, left;

			if ( !expr ) {
				return [];
			}

			for ( i = 0, len = Expr.order.length; i < len; i++ ) {
				type = Expr.order[i];

				if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
					left = match[1];
					match.splice( 1, 1 );

					if ( left.substr( left.length - 1 ) !== "\\" ) {
						match[1] = (match[1] || "").replace( rBackslash, "" );
						set = Expr.find[ type ]( match, context, isXML );

						if ( set != null ) {
							expr = expr.replace( Expr.match[ type ], "" );
							break;
						}
					}
				}
			}

			if ( !set ) {
				set = typeof context.getElementsByTagName !== "undefined" ?
						context.getElementsByTagName( "*" ) :
						[];
			}

			return { set: set, expr: expr };
		};

		Sizzle.filter = function( expr, set, inplace, not ) {
			var match, anyFound,
					type, found, item, filter, left,
					i, pass,
					old = expr,
					result = [],
					curLoop = set,
					isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

			while ( expr && set.length ) {
				for ( type in Expr.filter ) {
					if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
						filter = Expr.filter[ type ];
						left = match[1];

						anyFound = false;

						match.splice(1,1);

						if ( left.substr( left.length - 1 ) === "\\" ) {
							continue;
						}

						if ( curLoop === result ) {
							result = [];
						}

						if ( Expr.preFilter[ type ] ) {
							match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

							if ( !match ) {
								anyFound = found = true;

							} else if ( match === true ) {
								continue;
							}
						}

						if ( match ) {
							for ( i = 0; (item = curLoop[i]) != null; i++ ) {
								if ( item ) {
									found = filter( item, match, i, curLoop );
									pass = not ^ found;

									if ( inplace && found != null ) {
										if ( pass ) {
											anyFound = true;

										} else {
											curLoop[i] = false;
										}

									} else if ( pass ) {
										result.push( item );
										anyFound = true;
									}
								}
							}
						}

						if ( found !== undefined ) {
							if ( !inplace ) {
								curLoop = result;
							}

							expr = expr.replace( Expr.match[ type ], "" );

							if ( !anyFound ) {
								return [];
							}

							break;
						}
					}
				}

				// Improper expression
				if ( expr === old ) {
					if ( anyFound == null ) {
						Sizzle.error( expr );

					} else {
						break;
					}
				}

				old = expr;
			}

			return curLoop;
		};

		Sizzle.error = function( msg ) {
			throw new Error( "Syntax error, unrecognized expression: " + msg );
		};

		/**
		 * Utility function for retreiving the text value of an array of DOM nodes
		 * @param {Array|Element} elem
		 */
		var getText = Sizzle.getText = function( elem ) {
			var i, node,
					nodeType = elem.nodeType,
					ret = "";

			if ( nodeType ) {
				if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
					// Use textContent || innerText for elements
					if ( typeof elem.textContent === 'string' ) {
						return elem.textContent;
					} else if ( typeof elem.innerText === 'string' ) {
						// Replace IE's carriage returns
						return elem.innerText.replace( rReturn, '' );
					} else {
						// Traverse it's children
						for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
							ret += getText( elem );
						}
					}
				} else if ( nodeType === 3 || nodeType === 4 ) {
					return elem.nodeValue;
				}
			} else {

				// If no nodeType, this is expected to be an array
				for ( i = 0; (node = elem[i]); i++ ) {
					// Do not traverse comment nodes
					if ( node.nodeType !== 8 ) {
						ret += getText( node );
					}
				}
			}
			return ret;
		};

		var Expr = Sizzle.selectors = {
			order: [ "ID", "NAME", "TAG" ],

			match: {
				ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
				CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
				NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
				ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
				TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
				CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
				POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
				PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
			},

			leftMatch: {},

			attrMap: {
				"class": "className",
				"for": "htmlFor"
			},

			attrHandle: {
				href: function( elem ) {
					return elem.getAttribute( "href" );
				},
				type: function( elem ) {
					return elem.getAttribute( "type" );
				}
			},

			relative: {
				"+": function(checkSet, part){
					var isPartStr = typeof part === "string",
							isTag = isPartStr && !rNonWord.test( part ),
							isPartStrNotTag = isPartStr && !isTag;

					if ( isTag ) {
						part = part.toLowerCase();
					}

					for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
						if ( (elem = checkSet[i]) ) {
							while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

							checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
									elem || false :
									elem === part;
						}
					}

					if ( isPartStrNotTag ) {
						Sizzle.filter( part, checkSet, true );
					}
				},

				">": function( checkSet, part ) {
					var elem,
							isPartStr = typeof part === "string",
							i = 0,
							l = checkSet.length;

					if ( isPartStr && !rNonWord.test( part ) ) {
						part = part.toLowerCase();

						for ( ; i < l; i++ ) {
							elem = checkSet[i];

							if ( elem ) {
								var parent = elem.parentNode;
								checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
							}
						}

					} else {
						for ( ; i < l; i++ ) {
							elem = checkSet[i];

							if ( elem ) {
								checkSet[i] = isPartStr ?
										elem.parentNode :
										elem.parentNode === part;
							}
						}

						if ( isPartStr ) {
							Sizzle.filter( part, checkSet, true );
						}
					}
				},

				"": function(checkSet, part, isXML){
					var nodeCheck,
							doneName = done++,
							checkFn = dirCheck;

					if ( typeof part === "string" && !rNonWord.test( part ) ) {
						part = part.toLowerCase();
						nodeCheck = part;
						checkFn = dirNodeCheck;
					}

					checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
				},

				"~": function( checkSet, part, isXML ) {
					var nodeCheck,
							doneName = done++,
							checkFn = dirCheck;

					if ( typeof part === "string" && !rNonWord.test( part ) ) {
						part = part.toLowerCase();
						nodeCheck = part;
						checkFn = dirNodeCheck;
					}

					checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
				}
			},

			find: {
				ID: function( match, context, isXML ) {
					if ( typeof context.getElementById !== "undefined" && !isXML ) {
						var m = context.getElementById(match[1]);
						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						return m && m.parentNode ? [m] : [];
					}
				},

				NAME: function( match, context ) {
					if ( typeof context.getElementsByName !== "undefined" ) {
						var ret = [],
								results = context.getElementsByName( match[1] );

						for ( var i = 0, l = results.length; i < l; i++ ) {
							if ( results[i].getAttribute("name") === match[1] ) {
								ret.push( results[i] );
							}
						}

						return ret.length === 0 ? null : ret;
					}
				},

				TAG: function( match, context ) {
					if ( typeof context.getElementsByTagName !== "undefined" ) {
						return context.getElementsByTagName( match[1] );
					}
				}
			},
			preFilter: {
				CLASS: function( match, curLoop, inplace, result, not, isXML ) {
					match = " " + match[1].replace( rBackslash, "" ) + " ";

					if ( isXML ) {
						return match;
					}

					for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
						if ( elem ) {
							if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
								if ( !inplace ) {
									result.push( elem );
								}

							} else if ( inplace ) {
								curLoop[i] = false;
							}
						}
					}

					return false;
				},

				ID: function( match ) {
					return match[1].replace( rBackslash, "" );
				},

				TAG: function( match, curLoop ) {
					return match[1].replace( rBackslash, "" ).toLowerCase();
				},

				CHILD: function( match ) {
					if ( match[1] === "nth" ) {
						if ( !match[2] ) {
							Sizzle.error( match[0] );
						}

						match[2] = match[2].replace(/^\+|\s*/g, '');

						// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
						var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
								match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
										!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

						// calculate the numbers (first)n+(last) including if they are negative
						match[2] = (test[1] + (test[2] || 1)) - 0;
						match[3] = test[3] - 0;
					}
					else if ( match[2] ) {
						Sizzle.error( match[0] );
					}

					// TODO: Move to normal caching system
					match[0] = done++;

					return match;
				},

				ATTR: function( match, curLoop, inplace, result, not, isXML ) {
					var name = match[1] = match[1].replace( rBackslash, "" );

					if ( !isXML && Expr.attrMap[name] ) {
						match[1] = Expr.attrMap[name];
					}

					// Handle if an un-quoted value was used
					match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

					if ( match[2] === "~=" ) {
						match[4] = " " + match[4] + " ";
					}

					return match;
				},

				PSEUDO: function( match, curLoop, inplace, result, not ) {
					if ( match[1] === "not" ) {
						// If we're dealing with a complex expression, or a simple one
						if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
							match[3] = Sizzle(match[3], null, null, curLoop);

						} else {
							var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

							if ( !inplace ) {
								result.push.apply( result, ret );
							}

							return false;
						}

					} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
						return true;
					}

					return match;
				},

				POS: function( match ) {
					match.unshift( true );

					return match;
				}
			},

			filters: {
				enabled: function( elem ) {
					return elem.disabled === false && elem.type !== "hidden";
				},

				disabled: function( elem ) {
					return elem.disabled === true;
				},

				checked: function( elem ) {
					return elem.checked === true;
				},

				selected: function( elem ) {
					// Accessing this property makes selected-by-default
					// options in Safari work properly
					if ( elem.parentNode ) {
						elem.parentNode.selectedIndex;
					}

					return elem.selected === true;
				},

				parent: function( elem ) {
					return !!elem.firstChild;
				},

				empty: function( elem ) {
					return !elem.firstChild;
				},

				has: function( elem, i, match ) {
					return !!Sizzle( match[3], elem ).length;
				},

				header: function( elem ) {
					return (/h\d/i).test( elem.nodeName );
				},

				text: function( elem ) {
					var attr = elem.getAttribute( "type" ), type = elem.type;
					// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
					// use getAttribute instead to test this case
					return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
				},

				radio: function( elem ) {
					return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
				},

				checkbox: function( elem ) {
					return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
				},

				file: function( elem ) {
					return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
				},

				password: function( elem ) {
					return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
				},

				submit: function( elem ) {
					var name = elem.nodeName.toLowerCase();
					return (name === "input" || name === "button") && "submit" === elem.type;
				},

				image: function( elem ) {
					return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
				},

				reset: function( elem ) {
					var name = elem.nodeName.toLowerCase();
					return (name === "input" || name === "button") && "reset" === elem.type;
				},

				button: function( elem ) {
					var name = elem.nodeName.toLowerCase();
					return name === "input" && "button" === elem.type || name === "button";
				},

				input: function( elem ) {
					return (/input|select|textarea|button/i).test( elem.nodeName );
				},

				focus: function( elem ) {
					return elem === elem.ownerDocument.activeElement;
				}
			},
			setFilters: {
				first: function( elem, i ) {
					return i === 0;
				},

				last: function( elem, i, match, array ) {
					return i === array.length - 1;
				},

				even: function( elem, i ) {
					return i % 2 === 0;
				},

				odd: function( elem, i ) {
					return i % 2 === 1;
				},

				lt: function( elem, i, match ) {
					return i < match[3] - 0;
				},

				gt: function( elem, i, match ) {
					return i > match[3] - 0;
				},

				nth: function( elem, i, match ) {
					return match[3] - 0 === i;
				},

				eq: function( elem, i, match ) {
					return match[3] - 0 === i;
				}
			},
			filter: {
				PSEUDO: function( elem, match, i, array ) {
					var name = match[1],
							filter = Expr.filters[ name ];

					if ( filter ) {
						return filter( elem, i, match, array );

					} else if ( name === "contains" ) {
						return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

					} else if ( name === "not" ) {
						var not = match[3];

						for ( var j = 0, l = not.length; j < l; j++ ) {
							if ( not[j] === elem ) {
								return false;
							}
						}

						return true;

					} else {
						Sizzle.error( name );
					}
				},

				CHILD: function( elem, match ) {
					var first, last,
							doneName, parent, cache,
							count, diff,
							type = match[1],
							node = elem;

					switch ( type ) {
						case "only":
						case "first":
							while ( (node = node.previousSibling) ) {
								if ( node.nodeType === 1 ) {
									return false;
								}
							}

							if ( type === "first" ) {
								return true;
							}

							node = elem;

						/* falls through */
						case "last":
							while ( (node = node.nextSibling) ) {
								if ( node.nodeType === 1 ) {
									return false;
								}
							}

							return true;

						case "nth":
							first = match[2];
							last = match[3];

							if ( first === 1 && last === 0 ) {
								return true;
							}

							doneName = match[0];
							parent = elem.parentNode;

							if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
								count = 0;

								for ( node = parent.firstChild; node; node = node.nextSibling ) {
									if ( node.nodeType === 1 ) {
										node.nodeIndex = ++count;
									}
								}

								parent[ expando ] = doneName;
							}

							diff = elem.nodeIndex - last;

							if ( first === 0 ) {
								return diff === 0;

							} else {
								return ( diff % first === 0 && diff / first >= 0 );
							}
					}
				},

				ID: function( elem, match ) {
					return elem.nodeType === 1 && elem.getAttribute("id") === match;
				},

				TAG: function( elem, match ) {
					return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
				},

				CLASS: function( elem, match ) {
					return (" " + (elem.className || elem.getAttribute("class")) + " ")
							.indexOf( match ) > -1;
				},

				ATTR: function( elem, match ) {
					var name = match[1],
							result = Sizzle.attr ?
									Sizzle.attr( elem, name ) :
									Expr.attrHandle[ name ] ?
											Expr.attrHandle[ name ]( elem ) :
											elem[ name ] != null ?
													elem[ name ] :
													elem.getAttribute( name ),
							value = result + "",
							type = match[2],
							check = match[4];

					return result == null ?
							type === "!=" :
							!type && Sizzle.attr ?
									result != null :
									type === "=" ?
											value === check :
											type === "*=" ?
													value.indexOf(check) >= 0 :
													type === "~=" ?
															(" " + value + " ").indexOf(check) >= 0 :
															!check ?
																	value && result !== false :
																	type === "!=" ?
																			value !== check :
																			type === "^=" ?
																					value.indexOf(check) === 0 :
																					type === "$=" ?
																							value.substr(value.length - check.length) === check :
																							type === "|=" ?
																									value === check || value.substr(0, check.length + 1) === check + "-" :
																									false;
				},

				POS: function( elem, match, i, array ) {
					var name = match[2],
							filter = Expr.setFilters[ name ];

					if ( filter ) {
						return filter( elem, i, match, array );
					}
				}
			}
		};

		var origPOS = Expr.match.POS,
				fescape = function(all, num){
					return "\\" + (num - 0 + 1);
				};

		for ( var type in Expr.match ) {
			Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
			Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
		}
// Expose origPOS
// "global" as in regardless of relation to brackets/parens
		Expr.match.globalPOS = origPOS;

		var makeArray = function( array, results ) {
			array = Array.prototype.slice.call( array, 0 );

			if ( results ) {
				results.push.apply( results, array );
				return results;
			}

			return array;
		};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
		try {
			Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
		} catch( e ) {
			makeArray = function( array, results ) {
				var i = 0,
						ret = results || [];

				if ( toString.call(array) === "[object Array]" ) {
					Array.prototype.push.apply( ret, array );

				} else {
					if ( typeof array.length === "number" ) {
						for ( var l = array.length; i < l; i++ ) {
							ret.push( array[i] );
						}

					} else {
						for ( ; array[i]; i++ ) {
							ret.push( array[i] );
						}
					}
				}

				return ret;
			};
		}

		var sortOrder, siblingCheck;

		if ( document.documentElement.compareDocumentPosition ) {
			sortOrder = function( a, b ) {
				if ( a === b ) {
					hasDuplicate = true;
					return 0;
				}

				if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
					return a.compareDocumentPosition ? -1 : 1;
				}

				return a.compareDocumentPosition(b) & 4 ? -1 : 1;
			};

		} else {
			sortOrder = function( a, b ) {
				// The nodes are identical, we can exit early
				if ( a === b ) {
					hasDuplicate = true;
					return 0;

					// Fallback to using sourceIndex (in IE) if it's available on both nodes
				} else if ( a.sourceIndex && b.sourceIndex ) {
					return a.sourceIndex - b.sourceIndex;
				}

				var al, bl,
						ap = [],
						bp = [],
						aup = a.parentNode,
						bup = b.parentNode,
						cur = aup;

				// If the nodes are siblings (or identical) we can do a quick check
				if ( aup === bup ) {
					return siblingCheck( a, b );

					// If no parents were found then the nodes are disconnected
				} else if ( !aup ) {
					return -1;

				} else if ( !bup ) {
					return 1;
				}

				// Otherwise they're somewhere else in the tree so we need
				// to build up a full list of the parentNodes for comparison
				while ( cur ) {
					ap.unshift( cur );
					cur = cur.parentNode;
				}

				cur = bup;

				while ( cur ) {
					bp.unshift( cur );
					cur = cur.parentNode;
				}

				al = ap.length;
				bl = bp.length;

				// Start walking down the tree looking for a discrepancy
				for ( var i = 0; i < al && i < bl; i++ ) {
					if ( ap[i] !== bp[i] ) {
						return siblingCheck( ap[i], bp[i] );
					}
				}

				// We ended someplace up the tree so do a sibling check
				return i === al ?
						siblingCheck( a, bp[i], -1 ) :
						siblingCheck( ap[i], b, 1 );
			};

			siblingCheck = function( a, b, ret ) {
				if ( a === b ) {
					return ret;
				}

				var cur = a.nextSibling;

				while ( cur ) {
					if ( cur === b ) {
						return -1;
					}

					cur = cur.nextSibling;
				}

				return 1;
			};
		}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
		(function(){
			// We're going to inject a fake input element with a specified name
			var form = document.createElement("div"),
					id = "script" + (new Date()).getTime(),
					root = document.documentElement;

			form.innerHTML = "<a name='" + id + "'/>";

			// Inject it into the root element, check its status, and remove it quickly
			root.insertBefore( form, root.firstChild );

			// The workaround has to do additional checks after a getElementById
			// Which slows things down for other browsers (hence the branching)
			if ( document.getElementById( id ) ) {
				Expr.find.ID = function( match, context, isXML ) {
					if ( typeof context.getElementById !== "undefined" && !isXML ) {
						var m = context.getElementById(match[1]);

						return m ?
								m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
										[m] :
										undefined :
								[];
					}
				};

				Expr.filter.ID = function( elem, match ) {
					var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

					return elem.nodeType === 1 && node && node.nodeValue === match;
				};
			}

			root.removeChild( form );

			// release memory in IE
			root = form = null;
		})();

		(function(){
			// Check to see if the browser returns only elements
			// when doing getElementsByTagName("*")

			// Create a fake element
			var div = document.createElement("div");
			div.appendChild( document.createComment("") );

			// Make sure no comments are found
			if ( div.getElementsByTagName("*").length > 0 ) {
				Expr.find.TAG = function( match, context ) {
					var results = context.getElementsByTagName( match[1] );

					// Filter out possible comments
					if ( match[1] === "*" ) {
						var tmp = [];

						for ( var i = 0; results[i]; i++ ) {
							if ( results[i].nodeType === 1 ) {
								tmp.push( results[i] );
							}
						}

						results = tmp;
					}

					return results;
				};
			}

			// Check to see if an attribute returns normalized href attributes
			div.innerHTML = "<a href='#'></a>";

			if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
					div.firstChild.getAttribute("href") !== "#" ) {

				Expr.attrHandle.href = function( elem ) {
					return elem.getAttribute( "href", 2 );
				};
			}

			// release memory in IE
			div = null;
		})();

		if ( document.querySelectorAll ) {
			(function(){
				var oldSizzle = Sizzle,
						div = document.createElement("div"),
						id = "__sizzle__";

				div.innerHTML = "<p class='TEST'></p>";

				// Safari can't handle uppercase or unicode characters when
				// in quirks mode.
				if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
					return;
				}

				Sizzle = function( query, context, extra, seed ) {
					context = context || document;

					// Only use querySelectorAll on non-XML documents
					// (ID selectors don't work in non-HTML documents)
					if ( !seed && !Sizzle.isXML(context) ) {
						// See if we find a selector to speed up
						var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );

						if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
							// Speed-up: Sizzle("TAG")
							if ( match[1] ) {
								return makeArray( context.getElementsByTagName( query ), extra );

								// Speed-up: Sizzle(".CLASS")
							} else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
								return makeArray( context.getElementsByClassName( match[2] ), extra );
							}
						}

						if ( context.nodeType === 9 ) {
							// Speed-up: Sizzle("body")
							// The body element only exists once, optimize finding it
							if ( query === "body" && context.body ) {
								return makeArray( [ context.body ], extra );

								// Speed-up: Sizzle("#ID")
							} else if ( match && match[3] ) {
								var elem = context.getElementById( match[3] );

								// Check parentNode to catch when Blackberry 4.6 returns
								// nodes that are no longer in the document #6963
								if ( elem && elem.parentNode ) {
									// Handle the case where IE and Opera return items
									// by name instead of ID
									if ( elem.id === match[3] ) {
										return makeArray( [ elem ], extra );
									}

								} else {
									return makeArray( [], extra );
								}
							}

							try {
								return makeArray( context.querySelectorAll(query), extra );
							} catch(qsaError) {}

							// qSA works strangely on Element-rooted queries
							// We can work around this by specifying an extra ID on the root
							// and working up from there (Thanks to Andrew Dupont for the technique)
							// IE 8 doesn't work on object elements
						} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
							var oldContext = context,
									old = context.getAttribute( "id" ),
									nid = old || id,
									hasParent = context.parentNode,
									relativeHierarchySelector = /^\s*[+~]/.test( query );

							if ( !old ) {
								context.setAttribute( "id", nid );
							} else {
								nid = nid.replace( /'/g, "\\$&" );
							}
							if ( relativeHierarchySelector && hasParent ) {
								context = context.parentNode;
							}

							try {
								if ( !relativeHierarchySelector || hasParent ) {
									return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
								}

							} catch(pseudoError) {
							} finally {
								if ( !old ) {
									oldContext.removeAttribute( "id" );
								}
							}
						}
					}

					return oldSizzle(query, context, extra, seed);
				};

				for ( var prop in oldSizzle ) {
					Sizzle[ prop ] = oldSizzle[ prop ];
				}

				// release memory in IE
				div = null;
			})();
		}

		(function(){
			var html = document.documentElement,
					matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

			if ( matches ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9 fails this)
				var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
						pseudoWorks = false;

				try {
					// This should fail with an exception
					// Gecko does not error, returns false instead
					matches.call( document.documentElement, "[test!='']:sizzle" );

				} catch( pseudoError ) {
					pseudoWorks = true;
				}

				Sizzle.matchesSelector = function( node, expr ) {
					// Make sure that attribute selectors are quoted
					expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

					if ( !Sizzle.isXML( node ) ) {
						try {
							if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
								var ret = matches.call( node, expr );

								// IE 9's matchesSelector returns false on disconnected nodes
								if ( ret || !disconnectedMatch ||
									// As well, disconnected nodes are said to be in a document
									// fragment in IE 9, so check for that
										node.document && node.document.nodeType !== 11 ) {
									return ret;
								}
							}
						} catch(e) {}
					}

					return Sizzle(expr, null, null, [node]).length > 0;
				};
			}
		})();

		(function(){
			var div = document.createElement("div");

			div.innerHTML = "<div class='test e'></div><div class='test'></div>";

			// Opera can't find a second classname (in 9.6)
			// Also, make sure that getElementsByClassName actually exists
			if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
				return;
			}

			// Safari caches class attributes, doesn't catch changes (in 3.2)
			div.lastChild.className = "e";

			if ( div.getElementsByClassName("e").length === 1 ) {
				return;
			}

			Expr.order.splice(1, 0, "CLASS");
			Expr.find.CLASS = function( match, context, isXML ) {
				if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
					return context.getElementsByClassName(match[1]);
				}
			};

			// release memory in IE
			div = null;
		})();

		function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
			for ( var i = 0, l = checkSet.length; i < l; i++ ) {
				var elem = checkSet[i];

				if ( elem ) {
					var match = false;

					elem = elem[dir];

					while ( elem ) {
						if ( elem[ expando ] === doneName ) {
							match = checkSet[elem.sizset];
							break;
						}

						if ( elem.nodeType === 1 && !isXML ){
							elem[ expando ] = doneName;
							elem.sizset = i;
						}

						if ( elem.nodeName.toLowerCase() === cur ) {
							match = elem;
							break;
						}

						elem = elem[dir];
					}

					checkSet[i] = match;
				}
			}
		}

		function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
			for ( var i = 0, l = checkSet.length; i < l; i++ ) {
				var elem = checkSet[i];

				if ( elem ) {
					var match = false;

					elem = elem[dir];

					while ( elem ) {
						if ( elem[ expando ] === doneName ) {
							match = checkSet[elem.sizset];
							break;
						}

						if ( elem.nodeType === 1 ) {
							if ( !isXML ) {
								elem[ expando ] = doneName;
								elem.sizset = i;
							}

							if ( typeof cur !== "string" ) {
								if ( elem === cur ) {
									match = true;
									break;
								}

							} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
								match = elem;
								break;
							}
						}

						elem = elem[dir];
					}

					checkSet[i] = match;
				}
			}
		}

		if ( document.documentElement.contains ) {
			Sizzle.contains = function( a, b ) {
				return a !== b && (a.contains ? a.contains(b) : true);
			};

		} else if ( document.documentElement.compareDocumentPosition ) {
			Sizzle.contains = function( a, b ) {
				return !!(a.compareDocumentPosition(b) & 16);
			};

		} else {
			Sizzle.contains = function() {
				return false;
			};
		}

		Sizzle.isXML = function( elem ) {
			// documentElement is verified for cases where it doesn't yet exist
			// (such as loading iframes in IE - #4833)
			var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

			return documentElement ? documentElement.nodeName !== "HTML" : false;
		};

		var posProcess = function( selector, context, seed ) {
			var match,
					tmpSet = [],
					later = "",
					root = context.nodeType ? [context] : context;

			// Position selectors must be done after the filter
			// And so must :not(positional) so we move all PSEUDOs to the end
			while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
				later += match[0];
				selector = selector.replace( Expr.match.PSEUDO, "" );
			}

			selector = Expr.relative[selector] ? selector + "*" : selector;

			for ( var i = 0, l = root.length; i < l; i++ ) {
				Sizzle( selector, root[i], tmpSet, seed );
			}

			return Sizzle.filter( later, tmpSet );
		};

// EXPOSE
// Override sizzle attribute retrieval
		Sizzle.attr = jQuery.attr;
		Sizzle.selectors.attrMap = {};
		jQuery.find = Sizzle;
		jQuery.expr = Sizzle.selectors;
		jQuery.expr[":"] = jQuery.expr.filters;
		jQuery.unique = Sizzle.uniqueSort;
		jQuery.text = Sizzle.getText;
		jQuery.isXMLDoc = Sizzle.isXML;
		jQuery.contains = Sizzle.contains;


	})();


	var runtil = /Until$/,
			rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
			rmultiselector = /,/,
			isSimple = /^.[^:#\[\.,]*$/,
			slice = Array.prototype.slice,
			POS = jQuery.expr.match.globalPOS,
	// methods guaranteed to produce a unique set when starting from a unique set
			guaranteedUnique = {
				children: true,
				contents: true,
				next: true,
				prev: true
			};

	jQuery.fn.extend({
		find: function( selector ) {
			var self = this,
					i, l;

			if ( typeof selector !== "string" ) {
				return jQuery( selector ).filter(function() {
					for ( i = 0, l = self.length; i < l; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				});
			}

			var ret = this.pushStack( "", "find", selector ),
					length, n, r;

			for ( i = 0, l = this.length; i < l; i++ ) {
				length = ret.length;
				jQuery.find( selector, this[i], ret );

				if ( i > 0 ) {
					// Make sure that the results are unique
					for ( n = length; n < ret.length; n++ ) {
						for ( r = 0; r < length; r++ ) {
							if ( ret[r] === ret[n] ) {
								ret.splice(n--, 1);
								break;
							}
						}
					}
				}
			}

			return ret;
		},

		has: function( target ) {
			var targets = jQuery( target );
			return this.filter(function() {
				for ( var i = 0, l = targets.length; i < l; i++ ) {
					if ( jQuery.contains( this, targets[i] ) ) {
						return true;
					}
				}
			});
		},

		not: function( selector ) {
			return this.pushStack( winnow(this, selector, false), "not", selector);
		},

		filter: function( selector ) {
			return this.pushStack( winnow(this, selector, true), "filter", selector );
		},

		is: function( selector ) {
			return !!selector && (
					typeof selector === "string" ?
						// If this is a positional selector, check membership in the returned set
						// so $("p:first").is("p:last") won't return true for a doc with two "p".
							POS.test( selector ) ?
									jQuery( selector, this.context ).index( this[0] ) >= 0 :
									jQuery.filter( selector, this ).length > 0 :
							this.filter( selector ).length > 0 );
		},

		closest: function( selectors, context ) {
			var ret = [], i, l, cur = this[0];

			// Array (deprecated as of jQuery 1.7)
			if ( jQuery.isArray( selectors ) ) {
				var level = 1;

				while ( cur && cur.ownerDocument && cur !== context ) {
					for ( i = 0; i < selectors.length; i++ ) {

						if ( jQuery( cur ).is( selectors[ i ] ) ) {
							ret.push({ selector: selectors[ i ], elem: cur, level: level });
						}
					}

					cur = cur.parentNode;
					level++;
				}

				return ret;
			}

			// String
			var pos = POS.test( selectors ) || typeof selectors !== "string" ?
					jQuery( selectors, context || this.context ) :
					0;

			for ( i = 0, l = this.length; i < l; i++ ) {
				cur = this[i];

				while ( cur ) {
					if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
						ret.push( cur );
						break;

					} else {
						cur = cur.parentNode;
						if ( !cur || !cur.ownerDocument || cur === context || cur.nodeType === 11 ) {
							break;
						}
					}
				}
			}

			ret = ret.length > 1 ? jQuery.unique( ret ) : ret;

			return this.pushStack( ret, "closest", selectors );
		},

		// Determine the position of an element within
		// the matched set of elements
		index: function( elem ) {

			// No argument, return index in parent
			if ( !elem ) {
				return ( this[0] && this[0].parentNode ) ? this.prevAll().length : -1;
			}

			// index in selector
			if ( typeof elem === "string" ) {
				return jQuery.inArray( this[0], jQuery( elem ) );
			}

			// Locate the position of the desired element
			return jQuery.inArray(
					// If it receives a jQuery object, the first element is used
					elem.jquery ? elem[0] : elem, this );
		},

		add: function( selector, context ) {
			var set = typeof selector === "string" ?
							jQuery( selector, context ) :
							jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
					all = jQuery.merge( this.get(), set );

			return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
					all :
					jQuery.unique( all ) );
		},

		andSelf: function() {
			return this.add( this.prevObject );
		}
	});

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
	function isDisconnected( node ) {
		return !node || !node.parentNode || node.parentNode.nodeType === 11;
	}

	jQuery.each({
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return jQuery.dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, i, until ) {
			return jQuery.dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return jQuery.nth( elem, 2, "nextSibling" );
		},
		prev: function( elem ) {
			return jQuery.nth( elem, 2, "previousSibling" );
		},
		nextAll: function( elem ) {
			return jQuery.dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return jQuery.dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, i, until ) {
			return jQuery.dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, i, until ) {
			return jQuery.dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return jQuery.sibling( elem.firstChild );
		},
		contents: function( elem ) {
			return jQuery.nodeName( elem, "iframe" ) ?
					elem.contentDocument || elem.contentWindow.document :
					jQuery.makeArray( elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var ret = jQuery.map( this, fn, until );

			if ( !runtil.test( name ) ) {
				selector = until;
			}

			if ( selector && typeof selector === "string" ) {
				ret = jQuery.filter( selector, ret );
			}

			ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

			if ( (this.length > 1 || rmultiselector.test( selector )) && rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}

			return this.pushStack( ret, name, slice.call( arguments ).join(",") );
		};
	});

	jQuery.extend({
		filter: function( expr, elems, not ) {
			if ( not ) {
				expr = ":not(" + expr + ")";
			}

			return elems.length === 1 ?
					jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
					jQuery.find.matches(expr, elems);
		},

		dir: function( elem, dir, until ) {
			var matched = [],
					cur = elem[ dir ];

			while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
				if ( cur.nodeType === 1 ) {
					matched.push( cur );
				}
				cur = cur[dir];
			}
			return matched;
		},

		nth: function( cur, result, dir, elem ) {
			result = result || 1;
			var num = 0;

			for ( ; cur; cur = cur[dir] ) {
				if ( cur.nodeType === 1 && ++num === result ) {
					break;
				}
			}

			return cur;
		},

		sibling: function( n, elem ) {
			var r = [];

			for ( ; n; n = n.nextSibling ) {
				if ( n.nodeType === 1 && n !== elem ) {
					r.push( n );
				}
			}

			return r;
		}
	});

// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, keep ) {

		// Can't pass null or undefined to indexOf in Firefox 4
		// Set to 0 to skip string check
		qualifier = qualifier || 0;

		if ( jQuery.isFunction( qualifier ) ) {
			return jQuery.grep(elements, function( elem, i ) {
				var retVal = !!qualifier.call( elem, i, elem );
				return retVal === keep;
			});

		} else if ( qualifier.nodeType ) {
			return jQuery.grep(elements, function( elem, i ) {
				return ( elem === qualifier ) === keep;
			});

		} else if ( typeof qualifier === "string" ) {
			var filtered = jQuery.grep(elements, function( elem ) {
				return elem.nodeType === 1;
			});

			if ( isSimple.test( qualifier ) ) {
				return jQuery.filter(qualifier, filtered, !keep);
			} else {
				qualifier = jQuery.filter( qualifier, filtered );
			}
		}

		return jQuery.grep(elements, function( elem, i ) {
			return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
		});
	}




	function createSafeFragment( document ) {
		var list = nodeNames.split( "|" ),
				safeFrag = document.createDocumentFragment();

		if ( safeFrag.createElement ) {
			while ( list.length ) {
				safeFrag.createElement(
						list.pop()
				);
			}
		}
		return safeFrag;
	}

	var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
					"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
			rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
			rleadingWhitespace = /^\s+/,
			rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
			rtagName = /<([\w:]+)/,
			rtbody = /<tbody/i,
			rhtml = /<|&#?\w+;/,
			rnoInnerhtml = /<(?:script|style)/i,
			rnocache = /<(?:script|object|embed|option|style)/i,
			rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	// checked="checked" or checked
			rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
			rscriptType = /\/(java|ecma)script/i,
			rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)/,
			wrapMap = {
				option: [ 1, "<select multiple='multiple'>", "</select>" ],
				legend: [ 1, "<fieldset>", "</fieldset>" ],
				thead: [ 1, "<table>", "</table>" ],
				tr: [ 2, "<table><tbody>", "</tbody></table>" ],
				td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
				col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
				area: [ 1, "<map>", "</map>" ],
				_default: [ 0, "", "" ]
			},
			safeFragment = createSafeFragment( document );

	wrapMap.optgroup = wrapMap.option;
	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;

// IE can't serialize <link> and <script> tags normally
	if ( !jQuery.support.htmlSerialize ) {
		wrapMap._default = [ 1, "div<div>", "</div>" ];
	}

	jQuery.fn.extend({
		text: function( value ) {
			return jQuery.access( this, function( value ) {
				return value === undefined ?
						jQuery.text( this ) :
						this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
			}, null, value, arguments.length );
		},

		wrapAll: function( html ) {
			if ( jQuery.isFunction( html ) ) {
				return this.each(function(i) {
					jQuery(this).wrapAll( html.call(this, i) );
				});
			}

			if ( this[0] ) {
				// The elements to wrap the target around
				var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

				if ( this[0].parentNode ) {
					wrap.insertBefore( this[0] );
				}

				wrap.map(function() {
					var elem = this;

					while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
						elem = elem.firstChild;
					}

					return elem;
				}).append( this );
			}

			return this;
		},

		wrapInner: function( html ) {
			if ( jQuery.isFunction( html ) ) {
				return this.each(function(i) {
					jQuery(this).wrapInner( html.call(this, i) );
				});
			}

			return this.each(function() {
				var self = jQuery( this ),
						contents = self.contents();

				if ( contents.length ) {
					contents.wrapAll( html );

				} else {
					self.append( html );
				}
			});
		},

		wrap: function( html ) {
			var isFunction = jQuery.isFunction( html );

			return this.each(function(i) {
				jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
			});
		},

		unwrap: function() {
			return this.parent().each(function() {
				if ( !jQuery.nodeName( this, "body" ) ) {
					jQuery( this ).replaceWith( this.childNodes );
				}
			}).end();
		},

		append: function() {
			return this.domManip(arguments, true, function( elem ) {
				if ( this.nodeType === 1 ) {
					this.appendChild( elem );
				}
			});
		},

		prepend: function() {
			return this.domManip(arguments, true, function( elem ) {
				if ( this.nodeType === 1 ) {
					this.insertBefore( elem, this.firstChild );
				}
			});
		},

		before: function() {
			if ( this[0] && this[0].parentNode ) {
				return this.domManip(arguments, false, function( elem ) {
					this.parentNode.insertBefore( elem, this );
				});
			} else if ( arguments.length ) {
				var set = jQuery.clean( arguments );
				set.push.apply( set, this.toArray() );
				return this.pushStack( set, "before", arguments );
			}
		},

		after: function() {
			if ( this[0] && this[0].parentNode ) {
				return this.domManip(arguments, false, function( elem ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				});
			} else if ( arguments.length ) {
				var set = this.pushStack( this, "after", arguments );
				set.push.apply( set, jQuery.clean(arguments) );
				return set;
			}
		},

		// keepData is for internal use only--do not document
		remove: function( selector, keepData ) {
			for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
				if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
					if ( !keepData && elem.nodeType === 1 ) {
						jQuery.cleanData( elem.getElementsByTagName("*") );
						jQuery.cleanData( [ elem ] );
					}

					if ( elem.parentNode ) {
						elem.parentNode.removeChild( elem );
					}
				}
			}

			return this;
		},

		empty: function() {
			for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
				// Remove element nodes and prevent memory leaks
				if ( elem.nodeType === 1 ) {
					jQuery.cleanData( elem.getElementsByTagName("*") );
				}

				// Remove any remaining nodes
				while ( elem.firstChild ) {
					elem.removeChild( elem.firstChild );
				}
			}

			return this;
		},

		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

			return this.map( function () {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			});
		},

		html: function( value ) {
			return jQuery.access( this, function( value ) {
				var elem = this[0] || {},
						i = 0,
						l = this.length;

				if ( value === undefined ) {
					return elem.nodeType === 1 ?
							elem.innerHTML.replace( rinlinejQuery, "" ) :
							null;
				}


				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
						( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
						!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

					value = value.replace( rxhtmlTag, "<$1></$2>" );

					try {
						for (; i < l; i++ ) {
							// Remove element nodes and prevent memory leaks
							elem = this[i] || {};
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( elem.getElementsByTagName( "*" ) );
								elem.innerHTML = value;
							}
						}

						elem = 0;

						// If using innerHTML throws an exception, use the fallback method
					} catch(e) {}
				}

				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},

		replaceWith: function( value ) {
			if ( this[0] && this[0].parentNode ) {
				// Make sure that the elements are removed from the DOM before they are inserted
				// this can help fix replacing a parent with child elements
				if ( jQuery.isFunction( value ) ) {
					return this.each(function(i) {
						var self = jQuery(this), old = self.html();
						self.replaceWith( value.call( this, i, old ) );
					});
				}

				if ( typeof value !== "string" ) {
					value = jQuery( value ).detach();
				}

				return this.each(function() {
					var next = this.nextSibling,
							parent = this.parentNode;

					jQuery( this ).remove();

					if ( next ) {
						jQuery(next).before( value );
					} else {
						jQuery(parent).append( value );
					}
				});
			} else {
				return this.length ?
						this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value ) :
						this;
			}
		},

		detach: function( selector ) {
			return this.remove( selector, true );
		},

		domManip: function( args, table, callback ) {
			var results, first, fragment, parent,
					value = args[0],
					scripts = [];

			// We can't cloneNode fragments that contain checked, in WebKit
			if ( !jQuery.support.checkClone && arguments.length === 3 && typeof value === "string" && rchecked.test( value ) ) {
				return this.each(function() {
					jQuery(this).domManip( args, table, callback, true );
				});
			}

			if ( jQuery.isFunction(value) ) {
				return this.each(function(i) {
					var self = jQuery(this);
					args[0] = value.call(this, i, table ? self.html() : undefined);
					self.domManip( args, table, callback );
				});
			}

			if ( this[0] ) {
				parent = value && value.parentNode;

				// If we're in a fragment, just use that instead of building a new one
				if ( jQuery.support.parentNode && parent && parent.nodeType === 11 && parent.childNodes.length === this.length ) {
					results = { fragment: parent };

				} else {
					results = jQuery.buildFragment( args, this, scripts );
				}

				fragment = results.fragment;

				if ( fragment.childNodes.length === 1 ) {
					first = fragment = fragment.firstChild;
				} else {
					first = fragment.firstChild;
				}

				if ( first ) {
					table = table && jQuery.nodeName( first, "tr" );

					for ( var i = 0, l = this.length, lastIndex = l - 1; i < l; i++ ) {
						callback.call(
								table ?
										root(this[i], first) :
										this[i],
								// Make sure that we do not leak memory by inadvertently discarding
								// the original fragment (which might have attached data) instead of
								// using it; in addition, use the original fragment object for the last
								// item instead of first because it can end up being emptied incorrectly
								// in certain situations (Bug #8070).
								// Fragments from the fragment cache must always be cloned and never used
								// in place.
								results.cacheable || ( l > 1 && i < lastIndex ) ?
										jQuery.clone( fragment, true, true ) :
										fragment
						);
					}
				}

				if ( scripts.length ) {
					jQuery.each( scripts, function( i, elem ) {
						if ( elem.src ) {
							jQuery.ajax({
								type: "GET",
								global: false,
								url: elem.src,
								async: false,
								dataType: "script"
							});
						} else {
							jQuery.globalEval( ( elem.text || elem.textContent || elem.innerHTML || "" ).replace( rcleanScript, "/*$0*/" ) );
						}

						if ( elem.parentNode ) {
							elem.parentNode.removeChild( elem );
						}
					});
				}
			}

			return this;
		}
	});

	function root( elem, cur ) {
		return jQuery.nodeName(elem, "table") ?
				(elem.getElementsByTagName("tbody")[0] ||
						elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
				elem;
	}

	function cloneCopyEvent( src, dest ) {

		if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
			return;
		}

		var type, i, l,
				oldData = jQuery._data( src ),
				curData = jQuery._data( dest, oldData ),
				events = oldData.events;

		if ( events ) {
			delete curData.handle;
			curData.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}

		// make the cloned public data object a copy from the original
		if ( curData.data ) {
			curData.data = jQuery.extend( {}, curData.data );
		}
	}

	function cloneFixAttributes( src, dest ) {
		var nodeName;

		// We do not need to do anything for non-Elements
		if ( dest.nodeType !== 1 ) {
			return;
		}

		// clearAttributes removes the attributes, which we don't want,
		// but also removes the attachEvent events, which we *do* want
		if ( dest.clearAttributes ) {
			dest.clearAttributes();
		}

		// mergeAttributes, in contrast, only merges back on the
		// original attributes, not the events
		if ( dest.mergeAttributes ) {
			dest.mergeAttributes( src );
		}

		nodeName = dest.nodeName.toLowerCase();

		// IE6-8 fail to clone children inside object elements that use
		// the proprietary classid attribute value (rather than the type
		// attribute) to identify the type of content to display
		if ( nodeName === "object" ) {
			dest.outerHTML = src.outerHTML;

		} else if ( nodeName === "input" && (src.type === "checkbox" || src.type === "radio") ) {
			// IE6-8 fails to persist the checked state of a cloned checkbox
			// or radio button. Worse, IE6-7 fail to give the cloned element
			// a checked appearance if the defaultChecked value isn't also set
			if ( src.checked ) {
				dest.defaultChecked = dest.checked = src.checked;
			}

			// IE6-7 get confused and end up setting the value of a cloned
			// checkbox/radio button to an empty string instead of "on"
			if ( dest.value !== src.value ) {
				dest.value = src.value;
			}

			// IE6-8 fails to return the selected option to the default selected
			// state when cloning options
		} else if ( nodeName === "option" ) {
			dest.selected = src.defaultSelected;

			// IE6-8 fails to set the defaultValue to the correct value when
			// cloning other types of input fields
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;

			// IE blanks contents when cloning scripts
		} else if ( nodeName === "script" && dest.text !== src.text ) {
			dest.text = src.text;
		}

		// Event data gets referenced instead of copied if the expando
		// gets copied too
		dest.removeAttribute( jQuery.expando );

		// Clear flags for bubbling special change/submit events, they must
		// be reattached when the newly cloned events are first activated
		dest.removeAttribute( "_submit_attached" );
		dest.removeAttribute( "_change_attached" );
	}

	jQuery.buildFragment = function( args, nodes, scripts ) {
		var fragment, cacheable, cacheresults, doc,
				first = args[ 0 ];

		// nodes may contain either an explicit document object,
		// a jQuery collection or context object.
		// If nodes[0] contains a valid object to assign to doc
		if ( nodes && nodes[0] ) {
			doc = nodes[0].ownerDocument || nodes[0];
		}

		// Ensure that an attr object doesn't incorrectly stand in as a document object
		// Chrome and Firefox seem to allow this to occur and will throw exception
		// Fixes #8950
		if ( !doc.createDocumentFragment ) {
			doc = document;
		}

		// Only cache "small" (1/2 KB) HTML strings that are associated with the main document
		// Cloning options loses the selected state, so don't cache them
		// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
		// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
		// Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
		if ( args.length === 1 && typeof first === "string" && first.length < 512 && doc === document &&
				first.charAt(0) === "<" && !rnocache.test( first ) &&
				(jQuery.support.checkClone || !rchecked.test( first )) &&
				(jQuery.support.html5Clone || !rnoshimcache.test( first )) ) {

			cacheable = true;

			cacheresults = jQuery.fragments[ first ];
			if ( cacheresults && cacheresults !== 1 ) {
				fragment = cacheresults;
			}
		}

		if ( !fragment ) {
			fragment = doc.createDocumentFragment();
			jQuery.clean( args, doc, fragment, scripts );
		}

		if ( cacheable ) {
			jQuery.fragments[ first ] = cacheresults ? fragment : 1;
		}

		return { fragment: fragment, cacheable: cacheable };
	};

	jQuery.fragments = {};

	jQuery.each({
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var ret = [],
					insert = jQuery( selector ),
					parent = this.length === 1 && this[0].parentNode;

			if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
				insert[ original ]( this[0] );
				return this;

			} else {
				for ( var i = 0, l = insert.length; i < l; i++ ) {
					var elems = ( i > 0 ? this.clone(true) : this ).get();
					jQuery( insert[i] )[ original ]( elems );
					ret = ret.concat( elems );
				}

				return this.pushStack( ret, name, insert.selector );
			}
		};
	});

	function getAll( elem ) {
		if ( typeof elem.getElementsByTagName !== "undefined" ) {
			return elem.getElementsByTagName( "*" );

		} else if ( typeof elem.querySelectorAll !== "undefined" ) {
			return elem.querySelectorAll( "*" );

		} else {
			return [];
		}
	}

// Used in clean, fixes the defaultChecked property
	function fixDefaultChecked( elem ) {
		if ( elem.type === "checkbox" || elem.type === "radio" ) {
			elem.defaultChecked = elem.checked;
		}
	}
// Finds all inputs and passes them to fixDefaultChecked
	function findInputs( elem ) {
		var nodeName = ( elem.nodeName || "" ).toLowerCase();
		if ( nodeName === "input" ) {
			fixDefaultChecked( elem );
			// Skip scripts, get other children
		} else if ( nodeName !== "script" && typeof elem.getElementsByTagName !== "undefined" ) {
			jQuery.grep( elem.getElementsByTagName("input"), fixDefaultChecked );
		}
	}

// Derived From: http://www.iecss.com/shimprove/javascript/shimprove.1-0-1.js
	function shimCloneNode( elem ) {
		var div = document.createElement( "div" );
		safeFragment.appendChild( div );

		div.innerHTML = elem.outerHTML;
		return div.firstChild;
	}

	jQuery.extend({
		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var srcElements,
					destElements,
					i,
			// IE<=8 does not properly clone detached, unknown element nodes
					clone = jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ?
							elem.cloneNode( true ) :
							shimCloneNode( elem );

			if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
					(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {
				// IE copies events bound via attachEvent when using cloneNode.
				// Calling detachEvent on the clone will also remove the events
				// from the original. In order to get around this, we use some
				// proprietary methods to clear the events. Thanks to MooTools
				// guys for this hotness.

				cloneFixAttributes( elem, clone );

				// Using Sizzle here is crazy slow, so we use getElementsByTagName instead
				srcElements = getAll( elem );
				destElements = getAll( clone );

				// Weird iteration because IE will replace the length property
				// with an element if you are cloning the body and one of the
				// elements on the page has a name or id of "length"
				for ( i = 0; srcElements[i]; ++i ) {
					// Ensure that the destination node is not null; Fixes #9587
					if ( destElements[i] ) {
						cloneFixAttributes( srcElements[i], destElements[i] );
					}
				}
			}

			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				cloneCopyEvent( elem, clone );

				if ( deepDataAndEvents ) {
					srcElements = getAll( elem );
					destElements = getAll( clone );

					for ( i = 0; srcElements[i]; ++i ) {
						cloneCopyEvent( srcElements[i], destElements[i] );
					}
				}
			}

			srcElements = destElements = null;

			// Return the cloned set
			return clone;
		},

		clean: function( elems, context, fragment, scripts ) {
			var checkScriptType, script, j,
					ret = [];

			context = context || document;

			// !context.createElement fails in IE with an error but returns typeof 'object'
			if ( typeof context.createElement === "undefined" ) {
				context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
			}

			for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
				if ( typeof elem === "number" ) {
					elem += "";
				}

				if ( !elem ) {
					continue;
				}

				// Convert html string into DOM nodes
				if ( typeof elem === "string" ) {
					if ( !rhtml.test( elem ) ) {
						elem = context.createTextNode( elem );
					} else {
						// Fix "XHTML"-style tags in all browsers
						elem = elem.replace(rxhtmlTag, "<$1></$2>");

						// Trim whitespace, otherwise indexOf won't work as expected
						var tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase(),
								wrap = wrapMap[ tag ] || wrapMap._default,
								depth = wrap[0],
								div = context.createElement("div"),
								safeChildNodes = safeFragment.childNodes,
								remove;

						// Append wrapper element to unknown element safe doc fragment
						if ( context === document ) {
							// Use the fragment we've already created for this document
							safeFragment.appendChild( div );
						} else {
							// Use a fragment created with the owner document
							createSafeFragment( context ).appendChild( div );
						}

						// Go to html and back, then peel off extra wrappers
						div.innerHTML = wrap[1] + elem + wrap[2];

						// Move to the right depth
						while ( depth-- ) {
							div = div.lastChild;
						}

						// Remove IE's autoinserted <tbody> from table fragments
						if ( !jQuery.support.tbody ) {

							// String was a <table>, *may* have spurious <tbody>
							var hasBody = rtbody.test(elem),
									tbody = tag === "table" && !hasBody ?
											div.firstChild && div.firstChild.childNodes :

										// String was a bare <thead> or <tfoot>
											wrap[1] === "<table>" && !hasBody ?
													div.childNodes :
													[];

							for ( j = tbody.length - 1; j >= 0 ; --j ) {
								if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
									tbody[ j ].parentNode.removeChild( tbody[ j ] );
								}
							}
						}

						// IE completely kills leading whitespace when innerHTML is used
						if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
							div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
						}

						elem = div.childNodes;

						// Clear elements from DocumentFragment (safeFragment or otherwise)
						// to avoid hoarding elements. Fixes #11356
						if ( div ) {
							div.parentNode.removeChild( div );

							// Guard against -1 index exceptions in FF3.6
							if ( safeChildNodes.length > 0 ) {
								remove = safeChildNodes[ safeChildNodes.length - 1 ];

								if ( remove && remove.parentNode ) {
									remove.parentNode.removeChild( remove );
								}
							}
						}
					}
				}

				// Resets defaultChecked for any radios and checkboxes
				// about to be appended to the DOM in IE 6/7 (#8060)
				var len;
				if ( !jQuery.support.appendChecked ) {
					if ( elem[0] && typeof (len = elem.length) === "number" ) {
						for ( j = 0; j < len; j++ ) {
							findInputs( elem[j] );
						}
					} else {
						findInputs( elem );
					}
				}

				if ( elem.nodeType ) {
					ret.push( elem );
				} else {
					ret = jQuery.merge( ret, elem );
				}
			}

			if ( fragment ) {
				checkScriptType = function( elem ) {
					return !elem.type || rscriptType.test( elem.type );
				};
				for ( i = 0; ret[i]; i++ ) {
					script = ret[i];
					if ( scripts && jQuery.nodeName( script, "script" ) && (!script.type || rscriptType.test( script.type )) ) {
						scripts.push( script.parentNode ? script.parentNode.removeChild( script ) : script );

					} else {
						if ( script.nodeType === 1 ) {
							var jsTags = jQuery.grep( script.getElementsByTagName( "script" ), checkScriptType );

							ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
						}
						fragment.appendChild( script );
					}
				}
			}

			return ret;
		},

		cleanData: function( elems ) {
			var data, id,
					cache = jQuery.cache,
					special = jQuery.event.special,
					deleteExpando = jQuery.support.deleteExpando;

			for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
				if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
					continue;
				}

				id = elem[ jQuery.expando ];

				if ( id ) {
					data = cache[ id ];

					if ( data && data.events ) {
						for ( var type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

								// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}

						// Null the DOM reference to avoid IE6/7/8 leak (#7054)
						if ( data.handle ) {
							data.handle.elem = null;
						}
					}

					if ( deleteExpando ) {
						delete elem[ jQuery.expando ];

					} else if ( elem.removeAttribute ) {
						elem.removeAttribute( jQuery.expando );
					}

					delete cache[ id ];
				}
			}
		}
	});




	var ralpha = /alpha\([^)]*\)/i,
			ropacity = /opacity=([^)]*)/,
	// fixed for IE9, see #8346
			rupper = /([A-Z]|^ms)/g,
			rnum = /^[\-+]?(?:\d*\.)?\d+$/i,
			rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
			rrelNum = /^([\-+])=([\-+.\de]+)/,
			rmargin = /^margin/,

			cssShow = { position: "absolute", visibility: "hidden", display: "block" },

	// order is important!
			cssExpand = [ "Top", "Right", "Bottom", "Left" ],

			curCSS,

			getComputedStyle,
			currentStyle;

	jQuery.fn.css = function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	};

	jQuery.extend({
		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {
						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;

					} else {
						return elem.style.opacity;
					}
				}
			}
		},

		// Exclude the following css properties to add px
		cssNumber: {
			"fillOpacity": true,
			"fontWeight": true,
			"lineHeight": true,
			"opacity": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},

		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {
			// normalize float css property
			"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
		},

		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {
			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}

			// Make sure that we're working with the right name
			var ret, type, origName = jQuery.camelCase( name ),
					style = elem.style, hooks = jQuery.cssHooks[ origName ];

			name = jQuery.cssProps[ origName ] || origName;

			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;

				// convert relative number strings (+= or -=) to relative numbers. #7345
				if ( type === "string" && (ret = rrelNum.exec( value )) ) {
					value = ( +( ret[1] + 1) * +ret[2] ) + parseFloat( jQuery.css( elem, name ) );
					// Fixes bug #9237
					type = "number";
				}

				// Make sure that NaN and null values aren't set. See: #7116
				if ( value == null || type === "number" && isNaN( value ) ) {
					return;
				}

				// If a number was passed in, add 'px' to the (except for certain CSS properties)
				if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
					value += "px";
				}

				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value )) !== undefined ) {
					// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
					// Fixes bug #5509
					try {
						style[ name ] = value;
					} catch(e) {}
				}

			} else {
				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
					return ret;
				}

				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},

		css: function( elem, name, extra ) {
			var ret, hooks;

			// Make sure that we're working with the right name
			name = jQuery.camelCase( name );
			hooks = jQuery.cssHooks[ name ];
			name = jQuery.cssProps[ name ] || name;

			// cssFloat needs a special treatment
			if ( name === "cssFloat" ) {
				name = "float";
			}

			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, true, extra )) !== undefined ) {
				return ret;

				// Otherwise, if a way to get the computed value exists, use that
			} else if ( curCSS ) {
				return curCSS( elem, name );
			}
		},

		// A method for quickly swapping in/out CSS properties to get correct calculations
		swap: function( elem, options, callback ) {
			var old = {},
					ret, name;

			// Remember the old values, and insert the new ones
			for ( name in options ) {
				old[ name ] = elem.style[ name ];
				elem.style[ name ] = options[ name ];
			}

			ret = callback.call( elem );

			// Revert the old values
			for ( name in options ) {
				elem.style[ name ] = old[ name ];
			}

			return ret;
		}
	});

// DEPRECATED in 1.3, Use jQuery.css() instead
	jQuery.curCSS = jQuery.css;

	if ( document.defaultView && document.defaultView.getComputedStyle ) {
		getComputedStyle = function( elem, name ) {
			var ret, defaultView, computedStyle, width,
					style = elem.style;

			name = name.replace( rupper, "-$1" ).toLowerCase();

			if ( (defaultView = elem.ownerDocument.defaultView) &&
					(computedStyle = defaultView.getComputedStyle( elem, null )) ) {

				ret = computedStyle.getPropertyValue( name );
				if ( ret === "" && !jQuery.contains( elem.ownerDocument.documentElement, elem ) ) {
					ret = jQuery.style( elem, name );
				}
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
			// which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( !jQuery.support.pixelMargin && computedStyle && rmargin.test( name ) && rnumnonpx.test( ret ) ) {
				width = style.width;
				style.width = ret;
				ret = computedStyle.width;
				style.width = width;
			}

			return ret;
		};
	}

	if ( document.documentElement.currentStyle ) {
		currentStyle = function( elem, name ) {
			var left, rsLeft, uncomputed,
					ret = elem.currentStyle && elem.currentStyle[ name ],
					style = elem.style;

			// Avoid setting ret to empty string here
			// so we don't default to auto
			if ( ret == null && style && (uncomputed = style[ name ]) ) {
				ret = uncomputed;
			}

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if ( rnumnonpx.test( ret ) ) {

				// Remember the original values
				left = style.left;
				rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

				// Put in the new values to get a computed value out
				if ( rsLeft ) {
					elem.runtimeStyle.left = elem.currentStyle.left;
				}
				style.left = name === "fontSize" ? "1em" : ret;
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				if ( rsLeft ) {
					elem.runtimeStyle.left = rsLeft;
				}
			}

			return ret === "" ? "auto" : ret;
		};
	}

	curCSS = getComputedStyle || currentStyle;

	function getWidthOrHeight( elem, name, extra ) {

		// Start with offset property
		var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
				i = name === "width" ? 1 : 0,
				len = 4;

		if ( val > 0 ) {
			if ( extra !== "border" ) {
				for ( ; i < len; i += 2 ) {
					if ( !extra ) {
						val -= parseFloat( jQuery.css( elem, "padding" + cssExpand[ i ] ) ) || 0;
					}
					if ( extra === "margin" ) {
						val += parseFloat( jQuery.css( elem, extra + cssExpand[ i ] ) ) || 0;
					} else {
						val -= parseFloat( jQuery.css( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
					}
				}
			}

			return val + "px";
		}

		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;

		// Add padding, border, margin
		if ( extra ) {
			for ( ; i < len; i += 2 ) {
				val += parseFloat( jQuery.css( elem, "padding" + cssExpand[ i ] ) ) || 0;
				if ( extra !== "padding" ) {
					val += parseFloat( jQuery.css( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
				}
				if ( extra === "margin" ) {
					val += parseFloat( jQuery.css( elem, extra + cssExpand[ i ]) ) || 0;
				}
			}
		}

		return val + "px";
	}

	jQuery.each([ "height", "width" ], function( i, name ) {
		jQuery.cssHooks[ name ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {
					if ( elem.offsetWidth !== 0 ) {
						return getWidthOrHeight( elem, name, extra );
					} else {
						return jQuery.swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, name, extra );
						});
					}
				}
			},

			set: function( elem, value ) {
				return rnum.test( value ) ?
						value + "px" :
						value;
			}
		};
	});

	if ( !jQuery.support.opacity ) {
		jQuery.cssHooks.opacity = {
			get: function( elem, computed ) {
				// IE uses filters for opacity
				return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
						( parseFloat( RegExp.$1 ) / 100 ) + "" :
						computed ? "1" : "";
			},

			set: function( elem, value ) {
				var style = elem.style,
						currentStyle = elem.currentStyle,
						opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
						filter = currentStyle && currentStyle.filter || style.filter || "";

				// IE has trouble with opacity if it does not have layout
				// Force it by setting the zoom level
				style.zoom = 1;

				// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
				if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" ) {

					// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
					// if "filter:" is present at all, clearType is disabled, we want to avoid this
					// style.removeAttribute is IE Only, but so apparently is this code path...
					style.removeAttribute( "filter" );

					// if there there is no filter style applied in a css rule, we are done
					if ( currentStyle && !currentStyle.filter ) {
						return;
					}
				}

				// otherwise, set new filter values
				style.filter = ralpha.test( filter ) ?
						filter.replace( ralpha, opacity ) :
						filter + " " + opacity;
			}
		};
	}

	jQuery(function() {
		// This hook cannot be added until DOM ready because the support test
		// for it is not run until after DOM ready
		if ( !jQuery.support.reliableMarginRight ) {
			jQuery.cssHooks.marginRight = {
				get: function( elem, computed ) {
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" }, function() {
						if ( computed ) {
							return curCSS( elem, "margin-right" );
						} else {
							return elem.style.marginRight;
						}
					});
				}
			};
		}
	});

	if ( jQuery.expr && jQuery.expr.filters ) {
		jQuery.expr.filters.hidden = function( elem ) {
			var width = elem.offsetWidth,
					height = elem.offsetHeight;

			return ( width === 0 && height === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
		};

		jQuery.expr.filters.visible = function( elem ) {
			return !jQuery.expr.filters.hidden( elem );
		};
	}

// These hooks are used by animate to expand properties
	jQuery.each({
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {

		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i,

				// assumes a single number if not a string
						parts = typeof value === "string" ? value.split(" ") : [ value ],
						expanded = {};

				for ( i = 0; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
							parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}

				return expanded;
			}
		};
	});




	var r20 = /%20/g,
			rbracket = /\[\]$/,
			rCRLF = /\r?\n/g,
			rhash = /#.*$/,
			rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
			rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
	// #7653, #8125, #8152: local protocol detection
			rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
			rnoContent = /^(?:GET|HEAD)$/,
			rprotocol = /^\/\//,
			rquery = /\?/,
			rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
			rselectTextarea = /^(?:select|textarea)/i,
			rspacesAjax = /\s+/,
			rts = /([?&])_=[^&]*/,
			rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,

	// Keep a copy of the old load method
			_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
			prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
			transports = {},

	// Document location
			ajaxLocation,

	// Document location segments
			ajaxLocParts,

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
			allTypes = ["*/"] + ["*"];

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
	try {
		ajaxLocation = location.href;
	} catch( e ) {
		// Use the href attribute of an A element
		// since IE will modify it given document.location
		ajaxLocation = document.createElement( "a" );
		ajaxLocation.href = "";
		ajaxLocation = ajaxLocation.href;
	}

// Segment location into parts
	ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {

		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {

			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}

			if ( jQuery.isFunction( func ) ) {
				var dataTypes = dataTypeExpression.toLowerCase().split( rspacesAjax ),
						i = 0,
						length = dataTypes.length,
						dataType,
						list,
						placeBefore;

				// For each dataType in the dataTypeExpression
				for ( ; i < length; i++ ) {
					dataType = dataTypes[ i ];
					// We control if we're asked to add before
					// any existing element
					placeBefore = /^\+/.test( dataType );
					if ( placeBefore ) {
						dataType = dataType.substr( 1 ) || "*";
					}
					list = structure[ dataType ] = structure[ dataType ] || [];
					// then we add to the structure accordingly
					list[ placeBefore ? "unshift" : "push" ]( func );
				}
			}
		};
	}

// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR,
											dataType /* internal */, inspected /* internal */ ) {

		dataType = dataType || options.dataTypes[ 0 ];
		inspected = inspected || {};

		inspected[ dataType ] = true;

		var list = structure[ dataType ],
				i = 0,
				length = list ? list.length : 0,
				executeOnly = ( structure === prefilters ),
				selection;

		for ( ; i < length && ( executeOnly || !selection ); i++ ) {
			selection = list[ i ]( options, originalOptions, jqXHR );
			// If we got redirected to another dataType
			// we try there if executing only and not done already
			if ( typeof selection === "string" ) {
				if ( !executeOnly || inspected[ selection ] ) {
					selection = undefined;
				} else {
					options.dataTypes.unshift( selection );
					selection = inspectPrefiltersOrTransports(
							structure, options, originalOptions, jqXHR, selection, inspected );
				}
			}
		}
		// If we're only executing or nothing was selected
		// we try the catchall dataType if not done already
		if ( ( executeOnly || !selection ) && !inspected[ "*" ] ) {
			selection = inspectPrefiltersOrTransports(
					structure, options, originalOptions, jqXHR, "*", inspected );
		}
		// unnecessary when only executing (prefilters)
		// but it'll be ignored by the caller in that case
		return selection;
	}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
	function ajaxExtend( target, src ) {
		var key, deep,
				flatOptions = jQuery.ajaxSettings.flatOptions || {};
		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}
	}

	jQuery.fn.extend({
		load: function( url, params, callback ) {
			if ( typeof url !== "string" && _load ) {
				return _load.apply( this, arguments );

				// Don't do a request if no elements are being requested
			} else if ( !this.length ) {
				return this;
			}

			var off = url.indexOf( " " );
			if ( off >= 0 ) {
				var selector = url.slice( off, url.length );
				url = url.slice( 0, off );
			}

			// Default to a GET request
			var type = "GET";

			// If the second parameter was provided
			if ( params ) {
				// If it's a function
				if ( jQuery.isFunction( params ) ) {
					// We assume that it's the callback
					callback = params;
					params = undefined;

					// Otherwise, build a param string
				} else if ( typeof params === "object" ) {
					params = jQuery.param( params, jQuery.ajaxSettings.traditional );
					type = "POST";
				}
			}

			var self = this;

			// Request the remote document
			jQuery.ajax({
				url: url,
				type: type,
				dataType: "html",
				data: params,
				// Complete callback (responseText is used internally)
				complete: function( jqXHR, status, responseText ) {
					// Store the response as specified by the jqXHR object
					responseText = jqXHR.responseText;
					// If successful, inject the HTML into all the matched elements
					if ( jqXHR.isResolved() ) {
						// #4825: Get the actual response in case
						// a dataFilter is present in ajaxSettings
						jqXHR.done(function( r ) {
							responseText = r;
						});
						// See if a selector was specified
						self.html( selector ?
							// Create a dummy div to hold the results
								jQuery("<div>")
									// inject the contents of the document in, removing the scripts
									// to avoid any 'Permission Denied' errors in IE
										.append(responseText.replace(rscript, ""))

									// Locate the specified elements
										.find(selector) :

							// If not, just inject the full result
								responseText );
					}

					if ( callback ) {
						self.each( callback, [ responseText, status, jqXHR ] );
					}
				}
			});

			return this;
		},

		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},

		serializeArray: function() {
			return this.map(function(){
				return this.elements ? jQuery.makeArray( this.elements ) : this;
			})
					.filter(function(){
						return this.name && !this.disabled &&
								( this.checked || rselectTextarea.test( this.nodeName ) ||
										rinput.test( this.type ) );
					})
					.map(function( i, elem ){
						var val = jQuery( this ).val();

						return val == null ?
								null :
								jQuery.isArray( val ) ?
										jQuery.map( val, function( val, i ){
											return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
										}) :
								{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}).get();
		}
	});

// Attach a bunch of functions for handling common AJAX events
	jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ), function( i, o ){
		jQuery.fn[ o ] = function( f ){
			return this.on( o, f );
		};
	});

	jQuery.each( [ "get", "post" ], function( i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {
			// shift arguments if data argument was omitted
			if ( jQuery.isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}

			return jQuery.ajax({
				type: method,
				url: url,
				data: data,
				success: callback,
				dataType: type
			});
		};
	});

	jQuery.extend({

		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		},

		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},

		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			if ( settings ) {
				// Building a settings object
				ajaxExtend( target, jQuery.ajaxSettings );
			} else {
				// Extending ajaxSettings
				settings = target;
				target = jQuery.ajaxSettings;
			}
			ajaxExtend( target, settings );
			return target;
		},

		ajaxSettings: {
			url: ajaxLocation,
			isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
			global: true,
			type: "GET",
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			processData: true,
			async: true,
			/*
			 timeout: 0,
			 data: null,
			 dataType: null,
			 username: null,
			 password: null,
			 cache: null,
			 traditional: false,
			 headers: {},
			 */

			accepts: {
				xml: "application/xml, text/xml",
				html: "text/html",
				text: "text/plain",
				json: "application/json, text/javascript",
				"*": allTypes
			},

			contents: {
				xml: /xml/,
				html: /html/,
				json: /json/
			},

			responseFields: {
				xml: "responseXML",
				text: "responseText"
			},

			// List of data converters
			// 1) key format is "source_type destination_type" (a single space in-between)
			// 2) the catchall symbol "*" can be used for source_type
			converters: {

				// Convert anything to text
				"* text": window.String,

				// Text to html (true = no transformation)
				"text html": true,

				// Evaluate text as a json expression
				"text json": jQuery.parseJSON,

				// Parse text as xml
				"text xml": jQuery.parseXML
			},

			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				context: true,
				url: true
			}
		},

		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),

		// Main method
		ajax: function( url, options ) {

			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}

			// Force options to be an object
			options = options || {};

			var // Create the final options object
					s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
					callbackContext = s.context || s,
			// Context for global events
			// It's the callbackContext if one was provided in the options
			// and if it's a DOM node or a jQuery collection
					globalEventContext = callbackContext !== s &&
							( callbackContext.nodeType || callbackContext instanceof jQuery ) ?
							jQuery( callbackContext ) : jQuery.event,
			// Deferreds
					deferred = jQuery.Deferred(),
					completeDeferred = jQuery.Callbacks( "once memory" ),
			// Status-dependent callbacks
					statusCode = s.statusCode || {},
			// ifModified key
					ifModifiedKey,
			// Headers (they are sent all at once)
					requestHeaders = {},
					requestHeadersNames = {},
			// Response headers
					responseHeadersString,
					responseHeaders,
			// transport
					transport,
			// timeout handle
					timeoutTimer,
			// Cross-domain detection vars
					parts,
			// The jqXHR state
					state = 0,
			// To know if global events are to be dispatched
					fireGlobals,
			// Loop variable
					i,
			// Fake xhr
					jqXHR = {

						readyState: 0,

						// Caches the header
						setRequestHeader: function( name, value ) {
							if ( !state ) {
								var lname = name.toLowerCase();
								name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
								requestHeaders[ name ] = value;
							}
							return this;
						},

						// Raw string
						getAllResponseHeaders: function() {
							return state === 2 ? responseHeadersString : null;
						},

						// Builds headers hashtable if needed
						getResponseHeader: function( key ) {
							var match;
							if ( state === 2 ) {
								if ( !responseHeaders ) {
									responseHeaders = {};
									while( ( match = rheaders.exec( responseHeadersString ) ) ) {
										responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
									}
								}
								match = responseHeaders[ key.toLowerCase() ];
							}
							return match === undefined ? null : match;
						},

						// Overrides response content-type header
						overrideMimeType: function( type ) {
							if ( !state ) {
								s.mimeType = type;
							}
							return this;
						},

						// Cancel the request
						abort: function( statusText ) {
							statusText = statusText || "abort";
							if ( transport ) {
								transport.abort( statusText );
							}
							done( 0, statusText );
							return this;
						}
					};

			// Callback for when everything is done
			// It is defined here because jslint complains if it is declared
			// at the end of the function (which would be more logical and readable)
			function done( status, nativeStatusText, responses, headers ) {

				// Called once
				if ( state === 2 ) {
					return;
				}

				// State is "done" now
				state = 2;

				// Clear timeout if it exists
				if ( timeoutTimer ) {
					clearTimeout( timeoutTimer );
				}

				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;

				// Cache response headers
				responseHeadersString = headers || "";

				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;

				var isSuccess,
						success,
						error,
						statusText = nativeStatusText,
						response = responses ? ajaxHandleResponses( s, jqXHR, responses ) : undefined,
						lastModified,
						etag;

				// If successful, handle type chaining
				if ( status >= 200 && status < 300 || status === 304 ) {

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {

						if ( ( lastModified = jqXHR.getResponseHeader( "Last-Modified" ) ) ) {
							jQuery.lastModified[ ifModifiedKey ] = lastModified;
						}
						if ( ( etag = jqXHR.getResponseHeader( "Etag" ) ) ) {
							jQuery.etag[ ifModifiedKey ] = etag;
						}
					}

					// If not modified
					if ( status === 304 ) {

						statusText = "notmodified";
						isSuccess = true;

						// If we have data
					} else {

						try {
							success = ajaxConvert( s, response );
							statusText = "success";
							isSuccess = true;
						} catch(e) {
							// We have a parsererror
							statusText = "parsererror";
							error = e;
						}
					}
				} else {
					// We extract error from statusText
					// then normalize statusText and status for non-aborts
					error = statusText;
					if ( !statusText || status ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}

				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = "" + ( nativeStatusText || statusText );

				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}

				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajax" + ( isSuccess ? "Success" : "Error" ),
							[ jqXHR, s, isSuccess ? success : error ] );
				}

				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}

			// Attach deferreds
			deferred.promise( jqXHR );
			jqXHR.success = jqXHR.done;
			jqXHR.error = jqXHR.fail;
			jqXHR.complete = completeDeferred.add;

			// Status-dependent callbacks
			jqXHR.statusCode = function( map ) {
				if ( map ) {
					var tmp;
					if ( state < 2 ) {
						for ( tmp in map ) {
							statusCode[ tmp ] = [ statusCode[tmp], map[tmp] ];
						}
					} else {
						tmp = map[ jqXHR.status ];
						jqXHR.then( tmp, tmp );
					}
				}
				return this;
			};

			// Remove hash character (#7531: and string promotion)
			// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
			// We also use the url parameter if available
			s.url = ( ( url || s.url ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

			// Extract dataTypes list
			s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().split( rspacesAjax );

			// Determine if a cross-domain request is in order
			if ( s.crossDomain == null ) {
				parts = rurl.exec( s.url.toLowerCase() );
				s.crossDomain = !!( parts &&
						( parts[ 1 ] != ajaxLocParts[ 1 ] || parts[ 2 ] != ajaxLocParts[ 2 ] ||
								( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
										( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
						);
			}

			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}

			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

			// If request was aborted inside a prefilter, stop there
			if ( state === 2 ) {
				return false;
			}

			// We can fire global events as of now if asked to
			fireGlobals = s.global;

			// Uppercase the type
			s.type = s.type.toUpperCase();

			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );

			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}

			// More options handling for requests with no content
			if ( !s.hasContent ) {

				// If data is available, append data to url
				if ( s.data ) {
					s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.data;
					// #9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}

				// Get ifModifiedKey before adding the anti-cache parameter
				ifModifiedKey = s.url;

				// Add anti-cache in url if needed
				if ( s.cache === false ) {

					var ts = jQuery.now(),
					// try replacing _= if it is there
							ret = s.url.replace( rts, "$1_=" + ts );

					// if nothing was replaced, add timestamp to the end
					s.url = ret + ( ( ret === s.url ) ? ( rquery.test( s.url ) ? "&" : "?" ) + "_=" + ts : "" );
				}
			}

			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				ifModifiedKey = ifModifiedKey || s.url;
				if ( jQuery.lastModified[ ifModifiedKey ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ ifModifiedKey ] );
				}
				if ( jQuery.etag[ ifModifiedKey ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ ifModifiedKey ] );
				}
			}

			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
					"Accept",
					s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
							s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
							s.accepts[ "*" ]
			);

			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}

			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
				// Abort if not done already
				jqXHR.abort();
				return false;

			}

			// Install callbacks on deferreds
			for ( i in { success: 1, error: 1, complete: 1 } ) {
				jqXHR[ i ]( s[ i ] );
			}

			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;
				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}
				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = setTimeout( function(){
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}

				try {
					state = 1;
					transport.send( requestHeaders, done );
				} catch (e) {
					// Propagate exception as error if not done
					if ( state < 2 ) {
						done( -1, e );
						// Simply rethrow otherwise
					} else {
						throw e;
					}
				}
			}

			return jqXHR;
		},

		// Serialize an array of form elements or a set of
		// key/values into a query string
		param: function( a, traditional ) {
			var s = [],
					add = function( key, value ) {
						// If value is a function, invoke it and return its value
						value = jQuery.isFunction( value ) ? value() : value;
						s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
					};

			// Set traditional to true for jQuery <= 1.3.2 behavior.
			if ( traditional === undefined ) {
				traditional = jQuery.ajaxSettings.traditional;
			}

			// If an array was passed in, assume that it is an array of form elements.
			if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
				// Serialize the form elements
				jQuery.each( a, function() {
					add( this.name, this.value );
				});

			} else {
				// If traditional, encode the "old" way (the way 1.3.2 or older
				// did it), otherwise encode params recursively.
				for ( var prefix in a ) {
					buildParams( prefix, a[ prefix ], traditional, add );
				}
			}

			// Return the resulting serialization
			return s.join( "&" ).replace( r20, "+" );
		}
	});

	function buildParams( prefix, obj, traditional, add ) {
		if ( jQuery.isArray( obj ) ) {
			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {
					// Treat each array item as a scalar.
					add( prefix, v );

				} else {
					// If array item is non-scalar (array or object), encode its
					// numeric index to resolve deserialization ambiguity issues.
					// Note that rack (as of 1.0.0) can't currently deserialize
					// nested arrays properly, and attempting to do so may cause
					// a server error. Possible fixes are to modify rack's
					// deserialization algorithm or to provide an option or flag
					// to force array serialization to be shallow.
					buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
				}
			});

		} else if ( !traditional && jQuery.type( obj ) === "object" ) {
			// Serialize object item.
			for ( var name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}

		} else {
			// Serialize scalar item.
			add( prefix, obj );
		}
	}

// This is still on the jQuery object... for now
// Want to move this to jQuery.ajax some day
	jQuery.extend({

		// Counter for holding the number of active queries
		active: 0,

		// Last-Modified header cache for next request
		lastModified: {},
		etag: {}

	});

	/* Handles responses to an ajax request:
	 * - sets all responseXXX fields accordingly
	 * - finds the right dataType (mediates between content-type and expected dataType)
	 * - returns the corresponding response
	 */
	function ajaxHandleResponses( s, jqXHR, responses ) {

		var contents = s.contents,
				dataTypes = s.dataTypes,
				responseFields = s.responseFields,
				ct,
				type,
				finalDataType,
				firstDataType;

		// Fill responseXXX fields
		for ( type in responseFields ) {
			if ( type in responses ) {
				jqXHR[ responseFields[type] ] = responses[ type ];
			}
		}

		// Remove auto dataType and get content-type in the process
		while( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "content-type" );
			}
		}

		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}

		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {
			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}
			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}

		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}

// Chain conversions given the request and the original response
	function ajaxConvert( s, response ) {

		// Apply the dataFilter if provided
		if ( s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		var dataTypes = s.dataTypes,
				converters = {},
				i,
				key,
				length = dataTypes.length,
				tmp,
		// Current and previous dataTypes
				current = dataTypes[ 0 ],
				prev,
		// Conversion expression
				conversion,
		// Conversion function
				conv,
		// Conversion functions (transitive conversion)
				conv1,
				conv2;

		// For each dataType in the chain
		for ( i = 1; i < length; i++ ) {

			// Create converters map
			// with lowercased keys
			if ( i === 1 ) {
				for ( key in s.converters ) {
					if ( typeof key === "string" ) {
						converters[ key.toLowerCase() ] = s.converters[ key ];
					}
				}
			}

			// Get the dataTypes
			prev = current;
			current = dataTypes[ i ];

			// If current is auto dataType, update it to prev
			if ( current === "*" ) {
				current = prev;
				// If no auto and dataTypes are actually different
			} else if ( prev !== "*" && prev !== current ) {

				// Get the converter
				conversion = prev + " " + current;
				conv = converters[ conversion ] || converters[ "* " + current ];

				// If there is no direct converter, search transitively
				if ( !conv ) {
					conv2 = undefined;
					for ( conv1 in converters ) {
						tmp = conv1.split( " " );
						if ( tmp[ 0 ] === prev || tmp[ 0 ] === "*" ) {
							conv2 = converters[ tmp[1] + " " + current ];
							if ( conv2 ) {
								conv1 = converters[ conv1 ];
								if ( conv1 === true ) {
									conv = conv2;
								} else if ( conv2 === true ) {
									conv = conv1;
								}
								break;
							}
						}
					}
				}
				// If we found no converter, dispatch an error
				if ( !( conv || conv2 ) ) {
					jQuery.error( "No conversion from " + conversion.replace(" "," to ") );
				}
				// If found converter is not an equivalence
				if ( conv !== true ) {
					// Convert with 1 or 2 converters accordingly
					response = conv ? conv( response ) : conv2( conv1(response) );
				}
			}
		}
		return response;
	}




	var jsc = jQuery.now(),
			jsre = /(\=)\?(&|$)|\?\?/i;

// Default jsonp settings
	jQuery.ajaxSetup({
		jsonp: "callback",
		jsonpCallback: function() {
			return jQuery.expando + "_" + ( jsc++ );
		}
	});

// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

		var inspectData = ( typeof s.data === "string" ) && /^application\/x\-www\-form\-urlencoded/.test( s.contentType );

		if ( s.dataTypes[ 0 ] === "jsonp" ||
				s.jsonp !== false && ( jsre.test( s.url ) ||
						inspectData && jsre.test( s.data ) ) ) {

			var responseContainer,
					jsonpCallback = s.jsonpCallback =
							jQuery.isFunction( s.jsonpCallback ) ? s.jsonpCallback() : s.jsonpCallback,
					previous = window[ jsonpCallback ],
					url = s.url,
					data = s.data,
					replace = "$1" + jsonpCallback + "$2";

			if ( s.jsonp !== false ) {
				url = url.replace( jsre, replace );
				if ( s.url === url ) {
					if ( inspectData ) {
						data = data.replace( jsre, replace );
					}
					if ( s.data === data ) {
						// Add callback manually
						url += (/\?/.test( url ) ? "&" : "?") + s.jsonp + "=" + jsonpCallback;
					}
				}
			}

			s.url = url;
			s.data = data;

			// Install callback
			window[ jsonpCallback ] = function( response ) {
				responseContainer = [ response ];
			};

			// Clean-up function
			jqXHR.always(function() {
				// Set callback back to previous value
				window[ jsonpCallback ] = previous;
				// Call if it was a function and we have a response
				if ( responseContainer && jQuery.isFunction( previous ) ) {
					window[ jsonpCallback ]( responseContainer[ 0 ] );
				}
			});

			// Use data converter to retrieve json after script execution
			s.converters["script json"] = function() {
				if ( !responseContainer ) {
					jQuery.error( jsonpCallback + " was not called" );
				}
				return responseContainer[ 0 ];
			};

			// force json dataType
			s.dataTypes[ 0 ] = "json";

			// Delegate to script
			return "script";
		}
	});




// Install script dataType
	jQuery.ajaxSetup({
		accepts: {
			script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /javascript|ecmascript/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	});

// Handle cache's special case and global
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
			s.global = false;
		}
	});

// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function(s) {

		// This transport only deals with cross domain requests
		if ( s.crossDomain ) {

			var script,
					head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;

			return {

				send: function( _, callback ) {

					script = document.createElement( "script" );

					script.async = "async";

					if ( s.scriptCharset ) {
						script.charset = s.scriptCharset;
					}

					script.src = s.url;

					// Attach handlers for all browsers
					script.onload = script.onreadystatechange = function( _, isAbort ) {

						if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

							// Handle memory leak in IE
							script.onload = script.onreadystatechange = null;

							// Remove the script
							if ( head && script.parentNode ) {
								head.removeChild( script );
							}

							// Dereference the script
							script = undefined;

							// Callback if not abort
							if ( !isAbort ) {
								callback( 200, "success" );
							}
						}
					};
					// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
					// This arises when a base node is used (#2709 and #4378).
					head.insertBefore( script, head.firstChild );
				},

				abort: function() {
					if ( script ) {
						script.onload( 0, 1 );
					}
				}
			};
		}
	});




	var // #5280: Internet Explorer will keep connections alive if we don't abort on unload
			xhrOnUnloadAbort = window.ActiveXObject ? function() {
				// Abort all pending requests
				for ( var key in xhrCallbacks ) {
					xhrCallbacks[ key ]( 0, 1 );
				}
			} : false,
			xhrId = 0,
			xhrCallbacks;

// Functions to create xhrs
	function createStandardXHR() {
		try {
			return new window.XMLHttpRequest();
		} catch( e ) {}
	}

	function createActiveXHR() {
		try {
			return new window.ActiveXObject( "Microsoft.XMLHTTP" );
		} catch( e ) {}
	}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
	jQuery.ajaxSettings.xhr = window.ActiveXObject ?
		/* Microsoft failed to properly
		 * implement the XMLHttpRequest in IE7 (can't request local files),
		 * so we use the ActiveXObject when it is available
		 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
		 * we need a fallback.
		 */
			function() {
				return !this.isLocal && createStandardXHR() || createActiveXHR();
			} :
		// For all other browsers, use the standard XMLHttpRequest object
			createStandardXHR;

// Determine support properties
	(function( xhr ) {
		jQuery.extend( jQuery.support, {
			ajax: !!xhr,
			cors: !!xhr && ( "withCredentials" in xhr )
		});
	})( jQuery.ajaxSettings.xhr() );

// Create transport if the browser can provide an xhr
	if ( jQuery.support.ajax ) {

		jQuery.ajaxTransport(function( s ) {
			// Cross domain only allowed if supported through XMLHttpRequest
			if ( !s.crossDomain || jQuery.support.cors ) {

				var callback;

				return {
					send: function( headers, complete ) {

						// Get a new xhr
						var xhr = s.xhr(),
								handle,
								i;

						// Open the socket
						// Passing null username, generates a login popup on Opera (#2865)
						if ( s.username ) {
							xhr.open( s.type, s.url, s.async, s.username, s.password );
						} else {
							xhr.open( s.type, s.url, s.async );
						}

						// Apply custom fields if provided
						if ( s.xhrFields ) {
							for ( i in s.xhrFields ) {
								xhr[ i ] = s.xhrFields[ i ];
							}
						}

						// Override mime type if needed
						if ( s.mimeType && xhr.overrideMimeType ) {
							xhr.overrideMimeType( s.mimeType );
						}

						// X-Requested-With header
						// For cross-domain requests, seeing as conditions for a preflight are
						// akin to a jigsaw puzzle, we simply never set it to be sure.
						// (it can always be set on a per-request basis or even using ajaxSetup)
						// For same-domain requests, won't change header if already provided.
						if ( !s.crossDomain && !headers["X-Requested-With"] ) {
							headers[ "X-Requested-With" ] = "XMLHttpRequest";
						}

						// Need an extra try/catch for cross domain requests in Firefox 3
						try {
							for ( i in headers ) {
								xhr.setRequestHeader( i, headers[ i ] );
							}
						} catch( _ ) {}

						// Do send the request
						// This may raise an exception which is actually
						// handled in jQuery.ajax (so no try/catch here)
						xhr.send( ( s.hasContent && s.data ) || null );

						// Listener
						callback = function( _, isAbort ) {

							var status,
									statusText,
									responseHeaders,
									responses,
									xml;

							// Firefox throws exceptions when accessing properties
							// of an xhr when a network error occured
							// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
							try {

								// Was never called and is aborted or complete
								if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

									// Only called once
									callback = undefined;

									// Do not keep as active anymore
									if ( handle ) {
										xhr.onreadystatechange = jQuery.noop;
										if ( xhrOnUnloadAbort ) {
											delete xhrCallbacks[ handle ];
										}
									}

									// If it's an abort
									if ( isAbort ) {
										// Abort it manually if needed
										if ( xhr.readyState !== 4 ) {
											xhr.abort();
										}
									} else {
										status = xhr.status;
										responseHeaders = xhr.getAllResponseHeaders();
										responses = {};
										xml = xhr.responseXML;

										// Construct response list
										if ( xml && xml.documentElement /* #4958 */ ) {
											responses.xml = xml;
										}

										// When requesting binary data, IE6-9 will throw an exception
										// on any attempt to access responseText (#11426)
										try {
											responses.text = xhr.responseText;
										} catch( _ ) {
										}

										// Firefox throws an exception when accessing
										// statusText for faulty cross-domain requests
										try {
											statusText = xhr.statusText;
										} catch( e ) {
											// We normalize with Webkit giving an empty statusText
											statusText = "";
										}

										// Filter status for non standard behaviors

										// If the request is local and we have data: assume a success
										// (success with no data won't get notified, that's the best we
										// can do given current implementations)
										if ( !status && s.isLocal && !s.crossDomain ) {
											status = responses.text ? 200 : 404;
											// IE - #1450: sometimes returns 1223 when it should be 204
										} else if ( status === 1223 ) {
											status = 204;
										}
									}
								}
							} catch( firefoxAccessException ) {
								if ( !isAbort ) {
									complete( -1, firefoxAccessException );
								}
							}

							// Call complete if needed
							if ( responses ) {
								complete( status, statusText, responses, responseHeaders );
							}
						};

						// if we're in sync mode or it's in cache
						// and has been retrieved directly (IE6 & IE7)
						// we need to manually fire the callback
						if ( !s.async || xhr.readyState === 4 ) {
							callback();
						} else {
							handle = ++xhrId;
							if ( xhrOnUnloadAbort ) {
								// Create the active xhrs callbacks list if needed
								// and attach the unload handler
								if ( !xhrCallbacks ) {
									xhrCallbacks = {};
									jQuery( window ).unload( xhrOnUnloadAbort );
								}
								// Add to list of active xhrs callbacks
								xhrCallbacks[ handle ] = callback;
							}
							xhr.onreadystatechange = callback;
						}
					},

					abort: function() {
						if ( callback ) {
							callback(0,1);
						}
					}
				};
			}
		});
	}




	var elemdisplay = {},
			iframe, iframeDoc,
			rfxtypes = /^(?:toggle|show|hide)$/,
			rfxnum = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
			timerId,
			fxAttrs = [
				// height animations
				[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
				// width animations
				[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
				// opacity animations
				[ "opacity" ]
			],
			fxNow;

	jQuery.fn.extend({
		show: function( speed, easing, callback ) {
			var elem, display;

			if ( speed || speed === 0 ) {
				return this.animate( genFx("show", 3), speed, easing, callback );

			} else {
				for ( var i = 0, j = this.length; i < j; i++ ) {
					elem = this[ i ];

					if ( elem.style ) {
						display = elem.style.display;

						// Reset the inline display of this element to learn if it is
						// being hidden by cascaded rules or not
						if ( !jQuery._data(elem, "olddisplay") && display === "none" ) {
							display = elem.style.display = "";
						}

						// Set elements which have been overridden with display: none
						// in a stylesheet to whatever the default browser style is
						// for such an element
						if ( (display === "" && jQuery.css(elem, "display") === "none") ||
								!jQuery.contains( elem.ownerDocument.documentElement, elem ) ) {
							jQuery._data( elem, "olddisplay", defaultDisplay(elem.nodeName) );
						}
					}
				}

				// Set the display of most of the elements in a second loop
				// to avoid the constant reflow
				for ( i = 0; i < j; i++ ) {
					elem = this[ i ];

					if ( elem.style ) {
						display = elem.style.display;

						if ( display === "" || display === "none" ) {
							elem.style.display = jQuery._data( elem, "olddisplay" ) || "";
						}
					}
				}

				return this;
			}
		},

		hide: function( speed, easing, callback ) {
			if ( speed || speed === 0 ) {
				return this.animate( genFx("hide", 3), speed, easing, callback);

			} else {
				var elem, display,
						i = 0,
						j = this.length;

				for ( ; i < j; i++ ) {
					elem = this[i];
					if ( elem.style ) {
						display = jQuery.css( elem, "display" );

						if ( display !== "none" && !jQuery._data( elem, "olddisplay" ) ) {
							jQuery._data( elem, "olddisplay", display );
						}
					}
				}

				// Set the display of the elements in a second loop
				// to avoid the constant reflow
				for ( i = 0; i < j; i++ ) {
					if ( this[i].style ) {
						this[i].style.display = "none";
					}
				}

				return this;
			}
		},

		// Save the old toggle function
		_toggle: jQuery.fn.toggle,

		toggle: function( fn, fn2, callback ) {
			var bool = typeof fn === "boolean";

			if ( jQuery.isFunction(fn) && jQuery.isFunction(fn2) ) {
				this._toggle.apply( this, arguments );

			} else if ( fn == null || bool ) {
				this.each(function() {
					var state = bool ? fn : jQuery(this).is(":hidden");
					jQuery(this)[ state ? "show" : "hide" ]();
				});

			} else {
				this.animate(genFx("toggle", 3), fn, fn2, callback);
			}

			return this;
		},

		fadeTo: function( speed, to, easing, callback ) {
			return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, easing, callback);
		},

		animate: function( prop, speed, easing, callback ) {
			var optall = jQuery.speed( speed, easing, callback );

			if ( jQuery.isEmptyObject( prop ) ) {
				return this.each( optall.complete, [ false ] );
			}

			// Do not change referenced properties as per-property easing will be lost
			prop = jQuery.extend( {}, prop );

			function doAnimation() {
				// XXX 'this' does not always have a nodeName when running the
				// test suite

				if ( optall.queue === false ) {
					jQuery._mark( this );
				}

				var opt = jQuery.extend( {}, optall ),
						isElement = this.nodeType === 1,
						hidden = isElement && jQuery(this).is(":hidden"),
						name, val, p, e, hooks, replace,
						parts, start, end, unit,
						method;

				// will store per property easing and be used to determine when an animation is complete
				opt.animatedProperties = {};

				// first pass over propertys to expand / normalize
				for ( p in prop ) {
					name = jQuery.camelCase( p );
					if ( p !== name ) {
						prop[ name ] = prop[ p ];
						delete prop[ p ];
					}

					if ( ( hooks = jQuery.cssHooks[ name ] ) && "expand" in hooks ) {
						replace = hooks.expand( prop[ name ] );
						delete prop[ name ];

						// not quite $.extend, this wont overwrite keys already present.
						// also - reusing 'p' from above because we have the correct "name"
						for ( p in replace ) {
							if ( ! ( p in prop ) ) {
								prop[ p ] = replace[ p ];
							}
						}
					}
				}

				for ( name in prop ) {
					val = prop[ name ];
					// easing resolution: per property > opt.specialEasing > opt.easing > 'swing' (default)
					if ( jQuery.isArray( val ) ) {
						opt.animatedProperties[ name ] = val[ 1 ];
						val = prop[ name ] = val[ 0 ];
					} else {
						opt.animatedProperties[ name ] = opt.specialEasing && opt.specialEasing[ name ] || opt.easing || 'swing';
					}

					if ( val === "hide" && hidden || val === "show" && !hidden ) {
						return opt.complete.call( this );
					}

					if ( isElement && ( name === "height" || name === "width" ) ) {
						// Make sure that nothing sneaks out
						// Record all 3 overflow attributes because IE does not
						// change the overflow attribute when overflowX and
						// overflowY are set to the same value
						opt.overflow = [ this.style.overflow, this.style.overflowX, this.style.overflowY ];

						// Set display property to inline-block for height/width
						// animations on inline elements that are having width/height animated
						if ( jQuery.css( this, "display" ) === "inline" &&
								jQuery.css( this, "float" ) === "none" ) {

							// inline-level elements accept inline-block;
							// block-level elements need to be inline with layout
							if ( !jQuery.support.inlineBlockNeedsLayout || defaultDisplay( this.nodeName ) === "inline" ) {
								this.style.display = "inline-block";

							} else {
								this.style.zoom = 1;
							}
						}
					}
				}

				if ( opt.overflow != null ) {
					this.style.overflow = "hidden";
				}

				for ( p in prop ) {
					e = new jQuery.fx( this, opt, p );
					val = prop[ p ];

					if ( rfxtypes.test( val ) ) {

						// Tracks whether to show or hide based on private
						// data attached to the element
						method = jQuery._data( this, "toggle" + p ) || ( val === "toggle" ? hidden ? "show" : "hide" : 0 );
						if ( method ) {
							jQuery._data( this, "toggle" + p, method === "show" ? "hide" : "show" );
							e[ method ]();
						} else {
							e[ val ]();
						}

					} else {
						parts = rfxnum.exec( val );
						start = e.cur();

						if ( parts ) {
							end = parseFloat( parts[2] );
							unit = parts[3] || ( jQuery.cssNumber[ p ] ? "" : "px" );

							// We need to compute starting value
							if ( unit !== "px" ) {
								jQuery.style( this, p, (end || 1) + unit);
								start = ( (end || 1) / e.cur() ) * start;
								jQuery.style( this, p, start + unit);
							}

							// If a +=/-= token was provided, we're doing a relative animation
							if ( parts[1] ) {
								end = ( (parts[ 1 ] === "-=" ? -1 : 1) * end ) + start;
							}

							e.custom( start, end, unit );

						} else {
							e.custom( start, val, "" );
						}
					}
				}

				// For JS strict compliance
				return true;
			}

			return optall.queue === false ?
					this.each( doAnimation ) :
					this.queue( optall.queue, doAnimation );
		},

		stop: function( type, clearQueue, gotoEnd ) {
			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue && type !== false ) {
				this.queue( type || "fx", [] );
			}

			return this.each(function() {
				var index,
						hadTimers = false,
						timers = jQuery.timers,
						data = jQuery._data( this );

				// clear marker counters if we know they won't be
				if ( !gotoEnd ) {
					jQuery._unmark( true, this );
				}

				function stopQueue( elem, data, index ) {
					var hooks = data[ index ];
					jQuery.removeData( elem, index, true );
					hooks.stop( gotoEnd );
				}

				if ( type == null ) {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && index.indexOf(".run") === index.length - 4 ) {
							stopQueue( this, data, index );
						}
					}
				} else if ( data[ index = type + ".run" ] && data[ index ].stop ){
					stopQueue( this, data, index );
				}

				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
						if ( gotoEnd ) {

							// force the next step to be the last
							timers[ index ]( true );
						} else {
							timers[ index ].saveState();
						}
						hadTimers = true;
						timers.splice( index, 1 );
					}
				}

				// start the next in the queue if the last step wasn't forced
				// timers currently will call their complete callbacks, which will dequeue
				// but only if they were gotoEnd
				if ( !( gotoEnd && hadTimers ) ) {
					jQuery.dequeue( this, type );
				}
			});
		}

	});

// Animations created synchronously will run synchronously
	function createFxNow() {
		setTimeout( clearFxNow, 0 );
		return ( fxNow = jQuery.now() );
	}

	function clearFxNow() {
		fxNow = undefined;
	}

// Generate parameters to create a standard animation
	function genFx( type, num ) {
		var obj = {};

		jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice( 0, num )), function() {
			obj[ this ] = type;
		});

		return obj;
	}

// Generate shortcuts for custom animations
	jQuery.each({
		slideDown: genFx( "show", 1 ),
		slideUp: genFx( "hide", 1 ),
		slideToggle: genFx( "toggle", 1 ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	});

	jQuery.extend({
		speed: function( speed, easing, fn ) {
			var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
				complete: fn || !fn && easing ||
						jQuery.isFunction( speed ) && speed,
				duration: speed,
				easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
			};

			opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
					opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

			// normalize opt.queue - true/undefined/null -> "fx"
			if ( opt.queue == null || opt.queue === true ) {
				opt.queue = "fx";
			}

			// Queueing
			opt.old = opt.complete;

			opt.complete = function( noUnmark ) {
				if ( jQuery.isFunction( opt.old ) ) {
					opt.old.call( this );
				}

				if ( opt.queue ) {
					jQuery.dequeue( this, opt.queue );
				} else if ( noUnmark !== false ) {
					jQuery._unmark( this );
				}
			};

			return opt;
		},

		easing: {
			linear: function( p ) {
				return p;
			},
			swing: function( p ) {
				return ( -Math.cos( p*Math.PI ) / 2 ) + 0.5;
			}
		},

		timers: [],

		fx: function( elem, options, prop ) {
			this.options = options;
			this.elem = elem;
			this.prop = prop;

			options.orig = options.orig || {};
		}

	});

	jQuery.fx.prototype = {
		// Simple function for setting a style value
		update: function() {
			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}

			( jQuery.fx.step[ this.prop ] || jQuery.fx.step._default )( this );
		},

		// Get the current size
		cur: function() {
			if ( this.elem[ this.prop ] != null && (!this.elem.style || this.elem.style[ this.prop ] == null) ) {
				return this.elem[ this.prop ];
			}

			var parsed,
					r = jQuery.css( this.elem, this.prop );
			// Empty strings, null, undefined and "auto" are converted to 0,
			// complex values such as "rotate(1rad)" are returned as is,
			// simple values such as "10px" are parsed to Float.
			return isNaN( parsed = parseFloat( r ) ) ? !r || r === "auto" ? 0 : r : parsed;
		},

		// Start an animation from one number to another
		custom: function( from, to, unit ) {
			var self = this,
					fx = jQuery.fx;

			this.startTime = fxNow || createFxNow();
			this.end = to;
			this.now = this.start = from;
			this.pos = this.state = 0;
			this.unit = unit || this.unit || ( jQuery.cssNumber[ this.prop ] ? "" : "px" );

			function t( gotoEnd ) {
				return self.step( gotoEnd );
			}

			t.queue = this.options.queue;
			t.elem = this.elem;
			t.saveState = function() {
				if ( jQuery._data( self.elem, "fxshow" + self.prop ) === undefined ) {
					if ( self.options.hide ) {
						jQuery._data( self.elem, "fxshow" + self.prop, self.start );
					} else if ( self.options.show ) {
						jQuery._data( self.elem, "fxshow" + self.prop, self.end );
					}
				}
			};

			if ( t() && jQuery.timers.push(t) && !timerId ) {
				timerId = setInterval( fx.tick, fx.interval );
			}
		},

		// Simple 'show' function
		show: function() {
			var dataShow = jQuery._data( this.elem, "fxshow" + this.prop );

			// Remember where we started, so that we can go back to it later
			this.options.orig[ this.prop ] = dataShow || jQuery.style( this.elem, this.prop );
			this.options.show = true;

			// Begin the animation
			// Make sure that we start at a small width/height to avoid any flash of content
			if ( dataShow !== undefined ) {
				// This show is picking up where a previous hide or show left off
				this.custom( this.cur(), dataShow );
			} else {
				this.custom( this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur() );
			}

			// Start by showing the element
			jQuery( this.elem ).show();
		},

		// Simple 'hide' function
		hide: function() {
			// Remember where we started, so that we can go back to it later
			this.options.orig[ this.prop ] = jQuery._data( this.elem, "fxshow" + this.prop ) || jQuery.style( this.elem, this.prop );
			this.options.hide = true;

			// Begin the animation
			this.custom( this.cur(), 0 );
		},

		// Each step of an animation
		step: function( gotoEnd ) {
			var p, n, complete,
					t = fxNow || createFxNow(),
					done = true,
					elem = this.elem,
					options = this.options;

			if ( gotoEnd || t >= options.duration + this.startTime ) {
				this.now = this.end;
				this.pos = this.state = 1;
				this.update();

				options.animatedProperties[ this.prop ] = true;

				for ( p in options.animatedProperties ) {
					if ( options.animatedProperties[ p ] !== true ) {
						done = false;
					}
				}

				if ( done ) {
					// Reset the overflow
					if ( options.overflow != null && !jQuery.support.shrinkWrapBlocks ) {

						jQuery.each( [ "", "X", "Y" ], function( index, value ) {
							elem.style[ "overflow" + value ] = options.overflow[ index ];
						});
					}

					// Hide the element if the "hide" operation was done
					if ( options.hide ) {
						jQuery( elem ).hide();
					}

					// Reset the properties, if the item has been hidden or shown
					if ( options.hide || options.show ) {
						for ( p in options.animatedProperties ) {
							jQuery.style( elem, p, options.orig[ p ] );
							jQuery.removeData( elem, "fxshow" + p, true );
							// Toggle data is no longer needed
							jQuery.removeData( elem, "toggle" + p, true );
						}
					}

					// Execute the complete function
					// in the event that the complete function throws an exception
					// we must ensure it won't be called twice. #5684

					complete = options.complete;
					if ( complete ) {

						options.complete = false;
						complete.call( elem );
					}
				}

				return false;

			} else {
				// classical easing cannot be used with an Infinity duration
				if ( options.duration == Infinity ) {
					this.now = t;
				} else {
					n = t - this.startTime;
					this.state = n / options.duration;

					// Perform the easing function, defaults to swing
					this.pos = jQuery.easing[ options.animatedProperties[this.prop] ]( this.state, n, 0, 1, options.duration );
					this.now = this.start + ( (this.end - this.start) * this.pos );
				}
				// Perform the next step of the animation
				this.update();
			}

			return true;
		}
	};

	jQuery.extend( jQuery.fx, {
		tick: function() {
			var timer,
					timers = jQuery.timers,
					i = 0;

			for ( ; i < timers.length; i++ ) {
				timer = timers[ i ];
				// Checks the timer has not already been removed
				if ( !timer() && timers[ i ] === timer ) {
					timers.splice( i--, 1 );
				}
			}

			if ( !timers.length ) {
				jQuery.fx.stop();
			}
		},

		interval: 13,

		stop: function() {
			clearInterval( timerId );
			timerId = null;
		},

		speeds: {
			slow: 600,
			fast: 200,
			// Default speed
			_default: 400
		},

		step: {
			opacity: function( fx ) {
				jQuery.style( fx.elem, "opacity", fx.now );
			},

			_default: function( fx ) {
				if ( fx.elem.style && fx.elem.style[ fx.prop ] != null ) {
					fx.elem.style[ fx.prop ] = fx.now + fx.unit;
				} else {
					fx.elem[ fx.prop ] = fx.now;
				}
			}
		}
	});

// Ensure props that can't be negative don't go there on undershoot easing
	jQuery.each( fxAttrs.concat.apply( [], fxAttrs ), function( i, prop ) {
		// exclude marginTop, marginLeft, marginBottom and marginRight from this list
		if ( prop.indexOf( "margin" ) ) {
			jQuery.fx.step[ prop ] = function( fx ) {
				jQuery.style( fx.elem, prop, Math.max(0, fx.now) + fx.unit );
			};
		}
	});

	if ( jQuery.expr && jQuery.expr.filters ) {
		jQuery.expr.filters.animated = function( elem ) {
			return jQuery.grep(jQuery.timers, function( fn ) {
				return elem === fn.elem;
			}).length;
		};
	}

// Try to restore the default display value of an element
	function defaultDisplay( nodeName ) {

		if ( !elemdisplay[ nodeName ] ) {

			var body = document.body,
					elem = jQuery( "<" + nodeName + ">" ).appendTo( body ),
					display = elem.css( "display" );
			elem.remove();

			// If the simple way fails,
			// get element's real default display by attaching it to a temp iframe
			if ( display === "none" || display === "" ) {
				// No iframe to use yet, so create it
				if ( !iframe ) {
					iframe = document.createElement( "iframe" );
					iframe.frameBorder = iframe.width = iframe.height = 0;
				}

				body.appendChild( iframe );

				// Create a cacheable copy of the iframe document on first call.
				// IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
				// document to it; WebKit & Firefox won't allow reusing the iframe document.
				if ( !iframeDoc || !iframe.createElement ) {
					iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
					iframeDoc.write( ( jQuery.support.boxModel ? "<!doctype html>" : "" ) + "<html><body>" );
					iframeDoc.close();
				}

				elem = iframeDoc.createElement( nodeName );

				iframeDoc.body.appendChild( elem );

				display = jQuery.css( elem, "display" );
				body.removeChild( iframe );
			}

			// Store the correct default display
			elemdisplay[ nodeName ] = display;
		}

		return elemdisplay[ nodeName ];
	}




	var getOffset,
			rtable = /^t(?:able|d|h)$/i,
			rroot = /^(?:body|html)$/i;

	if ( "getBoundingClientRect" in document.documentElement ) {
		getOffset = function( elem, doc, docElem, box ) {
			try {
				box = elem.getBoundingClientRect();
			} catch(e) {}

			// Make sure we're not dealing with a disconnected DOM node
			if ( !box || !jQuery.contains( docElem, elem ) ) {
				return box ? { top: box.top, left: box.left } : { top: 0, left: 0 };
			}

			var body = doc.body,
					win = getWindow( doc ),
					clientTop  = docElem.clientTop  || body.clientTop  || 0,
					clientLeft = docElem.clientLeft || body.clientLeft || 0,
					scrollTop  = win.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop,
					scrollLeft = win.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft,
					top  = box.top  + scrollTop  - clientTop,
					left = box.left + scrollLeft - clientLeft;

			return { top: top, left: left };
		};

	} else {
		getOffset = function( elem, doc, docElem ) {
			var computedStyle,
					offsetParent = elem.offsetParent,
					prevOffsetParent = elem,
					body = doc.body,
					defaultView = doc.defaultView,
					prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
					top = elem.offsetTop,
					left = elem.offsetLeft;

			while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
				if ( jQuery.support.fixedPosition && prevComputedStyle.position === "fixed" ) {
					break;
				}

				computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
				top  -= elem.scrollTop;
				left -= elem.scrollLeft;

				if ( elem === offsetParent ) {
					top  += elem.offsetTop;
					left += elem.offsetLeft;

					if ( jQuery.support.doesNotAddBorder && !(jQuery.support.doesAddBorderForTableAndCells && rtable.test(elem.nodeName)) ) {
						top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
						left += parseFloat( computedStyle.borderLeftWidth ) || 0;
					}

					prevOffsetParent = offsetParent;
					offsetParent = elem.offsetParent;
				}

				if ( jQuery.support.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
					top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
					left += parseFloat( computedStyle.borderLeftWidth ) || 0;
				}

				prevComputedStyle = computedStyle;
			}

			if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
				top  += body.offsetTop;
				left += body.offsetLeft;
			}

			if ( jQuery.support.fixedPosition && prevComputedStyle.position === "fixed" ) {
				top  += Math.max( docElem.scrollTop, body.scrollTop );
				left += Math.max( docElem.scrollLeft, body.scrollLeft );
			}

			return { top: top, left: left };
		};
	}

	jQuery.fn.offset = function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
					this :
					this.each(function( i ) {
						jQuery.offset.setOffset( this, options, i );
					});
		}

		var elem = this[0],
				doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return null;
		}

		if ( elem === doc.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		return getOffset( elem, doc, doc.documentElement );
	};

	jQuery.offset = {

		bodyOffset: function( body ) {
			var top = body.offsetTop,
					left = body.offsetLeft;

			if ( jQuery.support.doesNotIncludeMarginInBodyOffset ) {
				top  += parseFloat( jQuery.css(body, "marginTop") ) || 0;
				left += parseFloat( jQuery.css(body, "marginLeft") ) || 0;
			}

			return { top: top, left: left };
		},

		setOffset: function( elem, options, i ) {
			var position = jQuery.css( elem, "position" );

			// set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}

			var curElem = jQuery( elem ),
					curOffset = curElem.offset(),
					curCSSTop = jQuery.css( elem, "top" ),
					curCSSLeft = jQuery.css( elem, "left" ),
					calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
					props = {}, curPosition = {}, curTop, curLeft;

			// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;
			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}

			if ( jQuery.isFunction( options ) ) {
				options = options.call( elem, i, curOffset );
			}

			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}

			if ( "using" in options ) {
				options.using.call( elem, props );
			} else {
				curElem.css( props );
			}
		}
	};


	jQuery.fn.extend({

		position: function() {
			if ( !this[0] ) {
				return null;
			}

			var elem = this[0],

			// Get *real* offsetParent
					offsetParent = this.offsetParent(),

			// Get correct offsets
					offset       = this.offset(),
					parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

			// Subtract element margins
			// note: when an element has margin: auto the offsetLeft and marginLeft
			// are the same in Safari causing offset.left to incorrectly be 0
			offset.top  -= parseFloat( jQuery.css(elem, "marginTop") ) || 0;
			offset.left -= parseFloat( jQuery.css(elem, "marginLeft") ) || 0;

			// Add offsetParent borders
			parentOffset.top  += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;
			parentOffset.left += parseFloat( jQuery.css(offsetParent[0], "borderLeftWidth") ) || 0;

			// Subtract the two offsets
			return {
				top:  offset.top  - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		},

		offsetParent: function() {
			return this.map(function() {
				var offsetParent = this.offsetParent || document.body;
				while ( offsetParent && (!rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
					offsetParent = offsetParent.offsetParent;
				}
				return offsetParent;
			});
		}
	});


// Create scrollLeft and scrollTop methods
	jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
		var top = /Y/.test( prop );

		jQuery.fn[ method ] = function( val ) {
			return jQuery.access( this, function( elem, method, val ) {
				var win = getWindow( elem );

				if ( val === undefined ) {
					return win ? (prop in win) ? win[ prop ] :
							jQuery.support.boxModel && win.document.documentElement[ method ] ||
									win.document.body[ method ] :
							elem[ method ];
				}

				if ( win ) {
					win.scrollTo(
							!top ? val : jQuery( win ).scrollLeft(),
							top ? val : jQuery( win ).scrollTop()
					);

				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length, null );
		};
	});

	function getWindow( elem ) {
		return jQuery.isWindow( elem ) ?
				elem :
				elem.nodeType === 9 ?
						elem.defaultView || elem.parentWindow :
						false;
	}




// Create width, height, innerHeight, innerWidth, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		var clientProp = "client" + name,
				scrollProp = "scroll" + name,
				offsetProp = "offset" + name;

		// innerHeight and innerWidth
		jQuery.fn[ "inner" + name ] = function() {
			var elem = this[0];
			return elem ?
					elem.style ?
							parseFloat( jQuery.css( elem, type, "padding" ) ) :
							this[ type ]() :
					null;
		};

		// outerHeight and outerWidth
		jQuery.fn[ "outer" + name ] = function( margin ) {
			var elem = this[0];
			return elem ?
					elem.style ?
							parseFloat( jQuery.css( elem, type, margin ? "margin" : "border" ) ) :
							this[ type ]() :
					null;
		};

		jQuery.fn[ type ] = function( value ) {
			return jQuery.access( this, function( elem, type, value ) {
				var doc, docElemProp, orig, ret;

				if ( jQuery.isWindow( elem ) ) {
					// 3rd condition allows Nokia support, as it supports the docElem prop but not CSS1Compat
					doc = elem.document;
					docElemProp = doc.documentElement[ clientProp ];
					return jQuery.support.boxModel && docElemProp ||
							doc.body && doc.body[ clientProp ] || docElemProp;
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					// Either scroll[Width/Height] or offset[Width/Height], whichever is greater
					doc = elem.documentElement;

					// when a window > document, IE6 reports a offset[Width/Height] > client[Width/Height]
					// so we can't use max, as it'll choose the incorrect offset[Width/Height]
					// instead we use the correct client[Width/Height]
					// support:IE6
					if ( doc[ clientProp ] >= doc[ scrollProp ] ) {
						return doc[ clientProp ];
					}

					return Math.max(
							elem.body[ scrollProp ], doc[ scrollProp ],
							elem.body[ offsetProp ], doc[ offsetProp ]
					);
				}

				// Get width or height on the element
				if ( value === undefined ) {
					orig = jQuery.css( elem, type );
					ret = parseFloat( orig );
					return jQuery.isNumeric( ret ) ? ret : orig;
				}

				// Set the width or height on the element
				jQuery( elem ).css( type, value );
			}, type, value, arguments.length, null );
		};
	});




// Expose jQuery to the global object
	window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
	if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
		define( "jquery", [], function () { return jQuery; } );
	}



})( window );

/*********************************************** 
     Begin jquery.json.js 
***********************************************/ 


/*
 * jQuery JSON Plugin
 * version: 2.1 (2009-08-14)
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
 * website's http://www.json.org/json2.js, which proclaims:
 * "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 * I uphold.
 *
 * It is also influenced heavily by MochiKit's serializeJSON, which is
 * copyrighted 2005 by Bob Ippolito.
 */

(function($) {
	/** jQuery.toJSON( json-serializble )
	 Converts the given argument into a JSON respresentation.

	 If an object has a "toJSON" function, that will be used to get the representation.
	 Non-integer/string keys are skipped in the object, as are keys that point to a function.

	 json-serializble:
	 The *thing* to be converted.
	 **/
	$.toJSON = function(o)
	{
		if (typeof(JSON) == 'object' && JSON.stringify)
			return JSON.stringify(o);

		var type = typeof(o);

		if (o === null)
			return "null";

		if (type == "undefined")
			return undefined;

		if (type == "number" || type == "boolean")
			return o + "";

		if (type == "string")
			return $.quoteString(o);

		if (type == 'object')
		{
			if (typeof o.toJSON == "function")
				return $.toJSON( o.toJSON() );

			if (o.constructor === Date)
			{
				var month = o.getUTCMonth() + 1;
				if (month < 10) month = '0' + month;

				var day = o.getUTCDate();
				if (day < 10) day = '0' + day;

				var year = o.getUTCFullYear();

				var hours = o.getUTCHours();
				if (hours < 10) hours = '0' + hours;

				var minutes = o.getUTCMinutes();
				if (minutes < 10) minutes = '0' + minutes;

				var seconds = o.getUTCSeconds();
				if (seconds < 10) seconds = '0' + seconds;

				var milli = o.getUTCMilliseconds();
				if (milli < 100) milli = '0' + milli;
				if (milli < 10) milli = '0' + milli;

				return '"' + year + '-' + month + '-' + day + 'T' +
						hours + ':' + minutes + ':' + seconds +
						'.' + milli + 'Z"';
			}

			if (o.constructor === Array)
			{
				var ret = [];
				for (var i = 0; i < o.length; i++)
					ret.push( $.toJSON(o[i]) || "null" );

				return "[" + ret.join(",") + "]";
			}

			var pairs = [];
			for (var k in o) {
				var name;
				var type = typeof k;

				if (type == "number")
					name = '"' + k + '"';
				else if (type == "string")
					name = $.quoteString(k);
				else
					continue;  //skip non-string or number keys

				if (typeof o[k] == "function")
					continue;  //skip pairs where the value is a function.

				var val = $.toJSON(o[k]);

				pairs.push(name + ":" + val);
			}

			return "{" + pairs.join(", ") + "}";
		}
	};

	/** jQuery.evalJSON(src)
	 Evaluates a given piece of json source.
	 **/
	$.evalJSON = function(src)
	{
		if (typeof(JSON) == 'object' && JSON.parse){
			return JSON.parse(src);
		}
		return eval("(" + src + ")");
	};

	/** jQuery.secureEvalJSON(src)
	 Evals JSON in a way that is *more* secure.
	 **/
	$.secureEvalJSON = function(src)
	{
		if (typeof(JSON) == 'object' && JSON.parse)
			return JSON.parse(src);

		var filtered = src;
		filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
		filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
		filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');

		if (/^[\],:{}\s]*$/.test(filtered))
			return eval("(" + src + ")");
		else
			throw new SyntaxError("Error parsing JSON, source is not valid.");
	};

	/** jQuery.quoteString(string)
	 Returns a string-repr of a string, escaping quotes intelligently.
	 Mostly a support function for toJSON.

	 Examples:
	 >>> jQuery.quoteString("apple")
	 "apple"

	 >>> jQuery.quoteString('"Where are we going?", she asked.')
	 "\"Where are we going?\", she asked."
	 **/
	$.quoteString = function(string)
	{
		if (string.match(_escapeable))
		{
			return '"' + string.replace(_escapeable, function (a)
			{
				var c = _meta[a];
				if (typeof c === 'string') return c;
				c = a.charCodeAt();
				return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
			}) + '"';
		}
		return '"' + string + '"';
	};

	var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;

	var _meta = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"' : '\\"',
		'\\': '\\\\'
	};
})(jQuery);


/*********************************************** 
     Begin jquery.ba-bbq.js 
***********************************************/ 

/*!
 * jQuery BBQ: Back Button & Query Library - v1.3pre - 8/26/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery BBQ: Back Button & Query Library
//
// *Version: 1.3pre, Last updated: 8/26/2010*
//
// Project Home - http://benalman.com/projects/jquery-bbq-plugin/
// GitHub       - http://github.com/cowboy/jquery-bbq/
// Source       - http://github.com/cowboy/jquery-bbq/raw/master/jquery.ba-bbq.js
// (Minified)   - http://github.com/cowboy/jquery-bbq/raw/master/jquery.ba-bbq.min.js (2.2kb gzipped)
//
// About: License
//
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
//
// About: Examples
//
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
//
// Basic AJAX     - http://benalman.com/code/projects/jquery-bbq/examples/fragment-basic/
// Advanced AJAX  - http://benalman.com/code/projects/jquery-bbq/examples/fragment-advanced/
// jQuery UI Tabs - http://benalman.com/code/projects/jquery-bbq/examples/fragment-jquery-ui-tabs/
// Deparam        - http://benalman.com/code/projects/jquery-bbq/examples/deparam/
//
// About: Support and Testing
//
// Information about what version or versions of jQuery this plugin has been
// tested with, what browsers it has been tested in, and where the unit tests
// reside (so you can test it yourself).
//
// jQuery Versions - 1.2.6, 1.3.2, 1.4.1, 1.4.2
// Browsers Tested - Internet Explorer 6-8, Firefox 2-4, Chrome 5-6, Safari 3.2-5,
//                   Opera 9.6-10.60, iPhone 3.1, Android 1.6-2.2, BlackBerry 4.6-5.
// Unit Tests      - http://benalman.com/code/projects/jquery-bbq/unit/
//
// About: Release History
//
// 1.3pre - (8/26/2010) Integrated <jQuery hashchange event> v1.3, which adds
//         document.title and document.domain support in IE6/7, BlackBerry
//         support, better Iframe hiding for accessibility reasons, and the new
//         <jQuery.fn.hashchange> "shortcut" method. Added the
//         <jQuery.param.sorted> method which reduces the possibility of
//         extraneous hashchange event triggering. Added the
//         <jQuery.param.fragment.ajaxCrawlable> method which can be used to
//         enable Google "AJAX Crawlable mode."
// 1.2.1 - (2/17/2010) Actually fixed the stale window.location Safari bug from
//         <jQuery hashchange event> in BBQ, which was the main reason for the
//         previous release!
// 1.2   - (2/16/2010) Integrated <jQuery hashchange event> v1.2, which fixes a
//         Safari bug, the event can now be bound before DOM ready, and IE6/7
//         page should no longer scroll when the event is first bound. Also
//         added the <jQuery.param.fragment.noEscape> method, and reworked the
//         <hashchange event (BBQ)> internal "add" method to be compatible with
//         changes made to the jQuery 1.4.2 special events API.
// 1.1.1 - (1/22/2010) Integrated <jQuery hashchange event> v1.1, which fixes an
//         obscure IE8 EmulateIE7 meta tag compatibility mode bug.
// 1.1   - (1/9/2010) Broke out the jQuery BBQ event.special <hashchange event>
//         functionality into a separate plugin for users who want just the
//         basic event & back button support, without all the extra awesomeness
//         that BBQ provides. This plugin will be included as part of jQuery BBQ,
//         but also be available separately. See <jQuery hashchange event>
//         plugin for more information. Also added the <jQuery.bbq.removeState>
//         method and added additional <jQuery.deparam> examples.
// 1.0.3 - (12/2/2009) Fixed an issue in IE 6 where location.search and
//         location.hash would report incorrectly if the hash contained the ?
//         character. Also <jQuery.param.querystring> and <jQuery.param.fragment>
//         will no longer parse params out of a URL that doesn't contain ? or #,
//         respectively.
// 1.0.2 - (10/10/2009) Fixed an issue in IE 6/7 where the hidden IFRAME caused
//         a "This page contains both secure and nonsecure items." warning when
//         used on an https:// page.
// 1.0.1 - (10/7/2009) Fixed an issue in IE 8. Since both "IE7" and "IE8
//         Compatibility View" modes erroneously report that the browser
//         supports the native window.onhashchange event, a slightly more
//         robust test needed to be added.
// 1.0   - (10/2/2009) Initial release

(function($,window){
	'$:nomunge'; // Used by YUI compressor.

	// Some convenient shortcuts.
	var undefined,
			aps = Array.prototype.slice,
			decode = decodeURIComponent,

	// Method / object references.
			jq_param = $.param,
			jq_param_sorted,
			jq_param_fragment,
			jq_deparam,
			jq_deparam_fragment,
			jq_bbq = $.bbq = $.bbq || {},
			jq_bbq_pushState,
			jq_bbq_getState,
			jq_elemUrlAttr,
			special = $.event.special,

	// Reused strings.
			str_hashchange = 'hashchange',
			str_querystring = 'querystring',
			str_fragment = 'fragment',
			str_elemUrlAttr = 'elemUrlAttr',
			str_href = 'href',
			str_src = 'src',

	// Reused RegExp.
			re_params_querystring = /^.*\?|#.*$/g,
			re_params_fragment,
			re_fragment,
			re_no_escape,

			ajax_crawlable,
			fragment_prefix,

	// Used by jQuery.elemUrlAttr.
			elemUrlAttr_cache = {};

	// A few commonly used bits, broken out to help reduce minified file size.

	function is_string( arg ) {
		return typeof arg === 'string';
	};

	// Why write the same function twice? Let's curry! Mmmm, curry..

	function curry( func ) {
		var args = aps.call( arguments, 1 );

		return function() {
			return func.apply( this, args.concat( aps.call( arguments ) ) );
		};
	};

	// Get location.hash (or what you'd expect location.hash to be) sans any
	// leading #. Thanks for making this necessary, Firefox!
	function get_fragment( url ) {
		return url.replace( re_fragment, '$2' );
	};

	// Get location.search (or what you'd expect location.search to be) sans any
	// leading #. Thanks for making this necessary, IE6!
	function get_querystring( url ) {
		return url.replace( /(?:^[^?#]*\?([^#]*).*$)?.*/, '$1' );
	};

	// Section: Param (to string)
	//
	// Method: jQuery.param.querystring
	//
	// Retrieve the query string from a URL or if no arguments are passed, the
	// current window.location.href.
	//
	// Usage:
	//
	// > jQuery.param.querystring( [ url ] );
	//
	// Arguments:
	//
	//  url - (String) A URL containing query string params to be parsed. If url
	//    is not passed, the current window.location.href is used.
	//
	// Returns:
	//
	//  (String) The parsed query string, with any leading "?" removed.
	//

	// Method: jQuery.param.querystring (build url)
	//
	// Merge a URL, with or without pre-existing query string params, plus any
	// object, params string or URL containing query string params into a new URL.
	//
	// Usage:
	//
	// > jQuery.param.querystring( url, params [, merge_mode ] );
	//
	// Arguments:
	//
	//  url - (String) A valid URL for params to be merged into. This URL may
	//    contain a query string and/or fragment (hash).
	//  params - (String) A params string or URL containing query string params to
	//    be merged into url.
	//  params - (Object) A params object to be merged into url.
	//  merge_mode - (Number) Merge behavior defaults to 0 if merge_mode is not
	//    specified, and is as-follows:
	//
	//    * 0: params in the params argument will override any query string
	//         params in url.
	//    * 1: any query string params in url will override params in the params
	//         argument.
	//    * 2: params argument will completely replace any query string in url.
	//
	// Returns:
	//
	//  (String) A URL with a urlencoded query string in the format '?a=b&c=d&e=f'.

	// Method: jQuery.param.fragment
	//
	// Retrieve the fragment (hash) from a URL or if no arguments are passed, the
	// current window.location.href.
	//
	// Usage:
	//
	// > jQuery.param.fragment( [ url ] );
	//
	// Arguments:
	//
	//  url - (String) A URL containing fragment (hash) params to be parsed. If
	//    url is not passed, the current window.location.href is used.
	//
	// Returns:
	//
	//  (String) The parsed fragment (hash) string, with any leading "#" removed.

	// Method: jQuery.param.fragment (build url)
	//
	// Merge a URL, with or without pre-existing fragment (hash) params, plus any
	// object, params string or URL containing fragment (hash) params into a new
	// URL.
	//
	// Usage:
	//
	// > jQuery.param.fragment( url, params [, merge_mode ] );
	//
	// Arguments:
	//
	//  url - (String) A valid URL for params to be merged into. This URL may
	//    contain a query string and/or fragment (hash).
	//  params - (String) A params string or URL containing fragment (hash) params
	//    to be merged into url.
	//  params - (Object) A params object to be merged into url.
	//  merge_mode - (Number) Merge behavior defaults to 0 if merge_mode is not
	//    specified, and is as-follows:
	//
	//    * 0: params in the params argument will override any fragment (hash)
	//         params in url.
	//    * 1: any fragment (hash) params in url will override params in the
	//         params argument.
	//    * 2: params argument will completely replace any query string in url.
	//
	// Returns:
	//
	//  (String) A URL with a urlencoded fragment (hash) in the format '#a=b&c=d&e=f'.

	function jq_param_sub( is_fragment, get_func, url, params, merge_mode ) {
		var result,
				qs,
				matches,
				url_params,
				hash;

		if ( params !== undefined ) {
			// Build URL by merging params into url string.

			// matches[1] = url part that precedes params, not including trailing ?/#
			// matches[2] = params, not including leading ?/#
			// matches[3] = if in 'querystring' mode, hash including leading #, otherwise ''
			matches = url.match( is_fragment ? re_fragment : /^([^#?]*)\??([^#]*)(#?.*)/ );

			// Get the hash if in 'querystring' mode, and it exists.
			hash = matches[3] || '';

			if ( merge_mode === 2 && is_string( params ) ) {
				// If merge_mode is 2 and params is a string, merge the fragment / query
				// string into the URL wholesale, without converting it into an object.
				qs = params.replace( is_fragment ? re_params_fragment : re_params_querystring, '' );

			} else {
				// Convert relevant params in url to object.
				url_params = jq_deparam( matches[2] );

				params = is_string( params )

					// Convert passed params string into object.
						? jq_deparam[ is_fragment ? str_fragment : str_querystring ]( params )

					// Passed params object.
						: params;

				qs = merge_mode === 2 ? params                              // passed params replace url params
						: merge_mode === 1  ? $.extend( {}, params, url_params )  // url params override passed params
						: $.extend( {}, url_params, params );                     // passed params override url params

				// Convert params object into a sorted params string.
				qs = jq_param_sorted( qs );

				// Unescape characters specified via $.param.noEscape. Since only hash-
				// history users have requested this feature, it's only enabled for
				// fragment-related params strings.
				if ( is_fragment ) {
					qs = qs.replace( re_no_escape, decode );
				}
			}

			// Build URL from the base url, querystring and hash. In 'querystring'
			// mode, ? is only added if a query string exists. In 'fragment' mode, #
			// is always added.
			result = matches[1] + ( is_fragment ? fragment_prefix : qs || !matches[1] ? '?' : '' ) + qs + hash;

		} else {
			// If URL was passed in, parse params from URL string, otherwise parse
			// params from window.location.href.
			result = get_func( url !== undefined ? url : location.href );
		}

		return result;
	};

	jq_param[ str_querystring ]                  = curry( jq_param_sub, 0, get_querystring );
	jq_param[ str_fragment ] = jq_param_fragment = curry( jq_param_sub, 1, get_fragment );

	// Method: jQuery.param.sorted
	//
	// Returns a params string equivalent to that returned by the internal
	// jQuery.param method, but sorted, which makes it suitable for use as a
	// cache key.
	//
	// For example, in most browsers jQuery.param({z:1,a:2}) returns "z=1&a=2"
	// and jQuery.param({a:2,z:1}) returns "a=2&z=1". Even though both the
	// objects being serialized and the resulting params strings are equivalent,
	// if these params strings were set into the location.hash fragment
	// sequentially, the hashchange event would be triggered unnecessarily, since
	// the strings are different (even though the data described by them is the
	// same). By sorting the params string, unecessary hashchange event triggering
	// can be avoided.
	//
	// Usage:
	//
	// > jQuery.param.sorted( obj [, traditional ] );
	//
	// Arguments:
	//
	//  obj - (Object) An object to be serialized.
	//  traditional - (Boolean) Params deep/shallow serialization mode. See the
	//    documentation at http://api.jquery.com/jQuery.param/ for more detail.
	//
	// Returns:
	//
	//  (String) A sorted params string.

	jq_param.sorted = jq_param_sorted = function( a, traditional ) {
		var arr = [],
				obj = {};

		$.each( jq_param( a, traditional ).split( '&' ), function(i,v){
			var key = v.replace( /(?:%5B|=).*$/, '' ),
					key_obj = obj[ key ];

			if ( !key_obj ) {
				key_obj = obj[ key ] = [];
				arr.push( key );
			}

			key_obj.push( v );
		});

		return $.map( arr.sort(), function(v){
			return obj[ v ];
		}).join( '&' );
	};

	// Method: jQuery.param.fragment.noEscape
	//
	// Specify characters that will be left unescaped when fragments are created
	// or merged using <jQuery.param.fragment>, or when the fragment is modified
	// using <jQuery.bbq.pushState>. This option only applies to serialized data
	// object fragments, and not set-as-string fragments. Does not affect the
	// query string. Defaults to ",/" (comma, forward slash).
	//
	// Note that this is considered a purely aesthetic option, and will help to
	// create URLs that "look pretty" in the address bar or bookmarks, without
	// affecting functionality in any way. That being said, be careful to not
	// unescape characters that are used as delimiters or serve a special
	// purpose, such as the "#?&=+" (octothorpe, question mark, ampersand,
	// equals, plus) characters.
	//
	// Usage:
	//
	// > jQuery.param.fragment.noEscape( [ chars ] );
	//
	// Arguments:
	//
	//  chars - (String) The characters to not escape in the fragment. If
	//    unspecified, defaults to empty string (escape all characters).
	//
	// Returns:
	//
	//  Nothing.

	jq_param_fragment.noEscape = function( chars ) {
		chars = chars || '';
		var arr = $.map( chars.split(''), encodeURIComponent );
		re_no_escape = new RegExp( arr.join('|'), 'g' );
	};

	// A sensible default. These are the characters people seem to complain about
	// "uglifying up the URL" the most.
	jq_param_fragment.noEscape( ',/' );

	// Method: jQuery.param.fragment.ajaxCrawlable
	//
	// TODO: DESCRIBE
	//
	// Usage:
	//
	// > jQuery.param.fragment.ajaxCrawlable( [ state ] );
	//
	// Arguments:
	//
	//  state - (Boolean) TODO: DESCRIBE
	//
	// Returns:
	//
	//  (Boolean) The current ajaxCrawlable state.

	jq_param_fragment.ajaxCrawlable = function( state ) {
		if ( state !== undefined ) {
			if ( state ) {
				re_params_fragment = /^.*(?:#!|#)/;
				re_fragment = /^([^#]*)(?:#!|#)?(.*)$/;
				fragment_prefix = '#!';
			} else {
				re_params_fragment = /^.*#/;
				re_fragment = /^([^#]*)#?(.*)$/;
				fragment_prefix = '#';
			}
			ajax_crawlable = !!state;
		}

		return ajax_crawlable;
	};

	jq_param_fragment.ajaxCrawlable( 0 );

	// Section: Deparam (from string)
	//
	// Method: jQuery.deparam
	//
	// Deserialize a params string into an object, optionally coercing numbers,
	// booleans, null and undefined values; this method is the counterpart to the
	// internal jQuery.param method.
	//
	// Usage:
	//
	// > jQuery.deparam( params [, coerce ] );
	//
	// Arguments:
	//
	//  params - (String) A params string to be parsed.
	//  coerce - (Boolean) If true, coerces any numbers or true, false, null, and
	//    undefined to their actual value. Defaults to false if omitted.
	//
	// Returns:
	//
	//  (Object) An object representing the deserialized params string.

	$.deparam = jq_deparam = function( params, coerce ) {
		var obj = {},
				coerce_types = { 'true': !0, 'false': !1, 'null': null };

		// Iterate over all name=value pairs.
		$.each( params.replace( /\+/g, ' ' ).split( '&' ), function(j,v){
			var param = v.split( '=' ),
					key = decode( param[0] ),
					val,
					cur = obj,
					i = 0,

			// If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
			// into its component parts.
					keys = key.split( '][' ),
					keys_last = keys.length - 1;

			// If the first keys part contains [ and the last ends with ], then []
			// are correctly balanced.
			if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
				// Remove the trailing ] from the last keys part.
				keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );

				// Split first keys part into two parts on the [ and add them back onto
				// the beginning of the keys array.
				keys = keys.shift().split('[').concat( keys );

				keys_last = keys.length - 1;
			} else {
				// Basic 'foo' style key.
				keys_last = 0;
			}

			// Are we dealing with a name=value pair, or just a name?
			if ( param.length === 2 ) {
				val = decode( param[1] );

				// Coerce values.
				if ( coerce ) {
					val = val && !isNaN(val)            ? +val              // number
							: val === 'undefined'             ? undefined         // undefined
							: coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
							: val;                                                // string
				}

				if ( keys_last ) {
					// Complex key, build deep object structure based on a few rules:
					// * The 'cur' pointer starts at the object top-level.
					// * [] = array push (n is set to array length), [n] = array if n is
					//   numeric, otherwise object.
					// * If at the last keys part, set the value.
					// * For each keys part, if the current level is undefined create an
					//   object or array based on the type of the next keys part.
					// * Move the 'cur' pointer to the next level.
					// * Rinse & repeat.
					for ( ; i <= keys_last; i++ ) {
						key = keys[i] === '' ? cur.length : keys[i];
						cur = cur[key] = i < keys_last
								? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] )
								: val;
					}

				} else {
					// Simple key, even simpler rules, since only scalars and shallow
					// arrays are allowed.

					if ( $.isArray( obj[key] ) ) {
						// val is already an array, so push on the next value.
						obj[key].push( val );

					} else if ( obj[key] !== undefined ) {
						// val isn't an array, but since a second value has been specified,
						// convert val into an array.
						obj[key] = [ obj[key], val ];

					} else {
						// val is a scalar.
						obj[key] = val;
					}
				}

			} else if ( key ) {
				// No value was defined, so set something meaningful.
				obj[key] = coerce
						? undefined
						: '';
			}
		});

		return obj;
	};

	// Method: jQuery.deparam.querystring
	//
	// Parse the query string from a URL or the current window.location.href,
	// deserializing it into an object, optionally coercing numbers, booleans,
	// null and undefined values.
	//
	// Usage:
	//
	// > jQuery.deparam.querystring( [ url ] [, coerce ] );
	//
	// Arguments:
	//
	//  url - (String) An optional params string or URL containing query string
	//    params to be parsed. If url is omitted, the current
	//    window.location.href is used.
	//  coerce - (Boolean) If true, coerces any numbers or true, false, null, and
	//    undefined to their actual value. Defaults to false if omitted.
	//
	// Returns:
	//
	//  (Object) An object representing the deserialized params string.

	// Method: jQuery.deparam.fragment
	//
	// Parse the fragment (hash) from a URL or the current window.location.href,
	// deserializing it into an object, optionally coercing numbers, booleans,
	// null and undefined values.
	//
	// Usage:
	//
	// > jQuery.deparam.fragment( [ url ] [, coerce ] );
	//
	// Arguments:
	//
	//  url - (String) An optional params string or URL containing fragment (hash)
	//    params to be parsed. If url is omitted, the current window.location.href
	//    is used.
	//  coerce - (Boolean) If true, coerces any numbers or true, false, null, and
	//    undefined to their actual value. Defaults to false if omitted.
	//
	// Returns:
	//
	//  (Object) An object representing the deserialized params string.

	function jq_deparam_sub( is_fragment, url_or_params, coerce ) {
		if ( url_or_params === undefined || typeof url_or_params === 'boolean' ) {
			// url_or_params not specified.
			coerce = url_or_params;
			url_or_params = jq_param[ is_fragment ? str_fragment : str_querystring ]();
		} else {
			url_or_params = is_string( url_or_params )
					? url_or_params.replace( is_fragment ? re_params_fragment : re_params_querystring, '' )
					: url_or_params;
		}

		return jq_deparam( url_or_params, coerce );
	};

	jq_deparam[ str_querystring ]                    = curry( jq_deparam_sub, 0 );
	jq_deparam[ str_fragment ] = jq_deparam_fragment = curry( jq_deparam_sub, 1 );

	// Section: Element manipulation
	//
	// Method: jQuery.elemUrlAttr
	//
	// Get the internal "Default URL attribute per tag" list, or augment the list
	// with additional tag-attribute pairs, in case the defaults are insufficient.
	//
	// In the <jQuery.fn.querystring> and <jQuery.fn.fragment> methods, this list
	// is used to determine which attribute contains the URL to be modified, if
	// an "attr" param is not specified.
	//
	// Default Tag-Attribute List:
	//
	//  a      - href
	//  base   - href
	//  iframe - src
	//  img    - src
	//  input  - src
	//  form   - action
	//  link   - href
	//  script - src
	//
	// Usage:
	//
	// > jQuery.elemUrlAttr( [ tag_attr ] );
	//
	// Arguments:
	//
	//  tag_attr - (Object) An object containing a list of tag names and their
	//    associated default attribute names in the format { tag: 'attr', ... } to
	//    be merged into the internal tag-attribute list.
	//
	// Returns:
	//
	//  (Object) An object containing all stored tag-attribute values.

	// Only define function and set defaults if function doesn't already exist, as
	// the urlInternal plugin will provide this method as well.
	$[ str_elemUrlAttr ] || ($[ str_elemUrlAttr ] = function( obj ) {
		return $.extend( elemUrlAttr_cache, obj );
	})({
		a: str_href,
		base: str_href,
		iframe: str_src,
		img: str_src,
		input: str_src,
		form: 'action',
		link: str_href,
		script: str_src
	});

	jq_elemUrlAttr = $[ str_elemUrlAttr ];

	// Method: jQuery.fn.querystring
	//
	// Update URL attribute in one or more elements, merging the current URL (with
	// or without pre-existing query string params) plus any params object or
	// string into a new URL, which is then set into that attribute. Like
	// <jQuery.param.querystring (build url)>, but for all elements in a jQuery
	// collection.
	//
	// Usage:
	//
	// > jQuery('selector').querystring( [ attr, ] params [, merge_mode ] );
	//
	// Arguments:
	//
	//  attr - (String) Optional name of an attribute that will contain a URL to
	//    merge params or url into. See <jQuery.elemUrlAttr> for a list of default
	//    attributes.
	//  params - (Object) A params object to be merged into the URL attribute.
	//  params - (String) A URL containing query string params, or params string
	//    to be merged into the URL attribute.
	//  merge_mode - (Number) Merge behavior defaults to 0 if merge_mode is not
	//    specified, and is as-follows:
	//
	//    * 0: params in the params argument will override any params in attr URL.
	//    * 1: any params in attr URL will override params in the params argument.
	//    * 2: params argument will completely replace any query string in attr
	//         URL.
	//
	// Returns:
	//
	//  (jQuery) The initial jQuery collection of elements, but with modified URL
	//  attribute values.

	// Method: jQuery.fn.fragment
	//
	// Update URL attribute in one or more elements, merging the current URL (with
	// or without pre-existing fragment/hash params) plus any params object or
	// string into a new URL, which is then set into that attribute. Like
	// <jQuery.param.fragment (build url)>, but for all elements in a jQuery
	// collection.
	//
	// Usage:
	//
	// > jQuery('selector').fragment( [ attr, ] params [, merge_mode ] );
	//
	// Arguments:
	//
	//  attr - (String) Optional name of an attribute that will contain a URL to
	//    merge params into. See <jQuery.elemUrlAttr> for a list of default
	//    attributes.
	//  params - (Object) A params object to be merged into the URL attribute.
	//  params - (String) A URL containing fragment (hash) params, or params
	//    string to be merged into the URL attribute.
	//  merge_mode - (Number) Merge behavior defaults to 0 if merge_mode is not
	//    specified, and is as-follows:
	//
	//    * 0: params in the params argument will override any params in attr URL.
	//    * 1: any params in attr URL will override params in the params argument.
	//    * 2: params argument will completely replace any fragment (hash) in attr
	//         URL.
	//
	// Returns:
	//
	//  (jQuery) The initial jQuery collection of elements, but with modified URL
	//  attribute values.

	function jq_fn_sub( mode, force_attr, params, merge_mode ) {
		if ( !is_string( params ) && typeof params !== 'object' ) {
			// force_attr not specified.
			merge_mode = params;
			params = force_attr;
			force_attr = undefined;
		}

		return this.each(function(){
			var that = $(this),

			// Get attribute specified, or default specified via $.elemUrlAttr.
					attr = force_attr || jq_elemUrlAttr()[ ( this.nodeName || '' ).toLowerCase() ] || '',

			// Get URL value.
					url = attr && that.attr( attr ) || '';

			// Update attribute with new URL.
			that.attr( attr, jq_param[ mode ]( url, params, merge_mode ) );
		});

	};

	$.fn[ str_querystring ] = curry( jq_fn_sub, str_querystring );
	$.fn[ str_fragment ]    = curry( jq_fn_sub, str_fragment );

	// Section: History, hashchange event
	//
	// Method: jQuery.bbq.pushState
	//
	// Adds a 'state' into the browser history at the current position, setting
	// location.hash and triggering any bound <hashchange event> callbacks
	// (provided the new state is different than the previous state).
	//
	// If no arguments are passed, an empty state is created, which is just a
	// shortcut for jQuery.bbq.pushState( {}, 2 ).
	//
	// Usage:
	//
	// > jQuery.bbq.pushState( [ params [, merge_mode ] ] );
	//
	// Arguments:
	//
	//  params - (String) A serialized params string or a hash string beginning
	//    with # to merge into location.hash.
	//  params - (Object) A params object to merge into location.hash.
	//  merge_mode - (Number) Merge behavior defaults to 0 if merge_mode is not
	//    specified (unless a hash string beginning with # is specified, in which
	//    case merge behavior defaults to 2), and is as-follows:
	//
	//    * 0: params in the params argument will override any params in the
	//         current state.
	//    * 1: any params in the current state will override params in the params
	//         argument.
	//    * 2: params argument will completely replace current state.
	//
	// Returns:
	//
	//  Nothing.
	//
	// Additional Notes:
	//
	//  * Setting an empty state may cause the browser to scroll.
	//  * Unlike the fragment and querystring methods, if a hash string beginning
	//    with # is specified as the params agrument, merge_mode defaults to 2.

	jq_bbq.pushState = jq_bbq_pushState = function( params, merge_mode ) {
		if ( is_string( params ) && /^#/.test( params ) && merge_mode === undefined ) {
			// Params string begins with # and merge_mode not specified, so completely
			// overwrite window.location.hash.
			merge_mode = 2;
		}

		var has_args = params !== undefined,
		// Merge params into window.location using $.param.fragment.
				url = jq_param_fragment( location.href,
						has_args ? params : {}, has_args ? merge_mode : 2 );

		// Set new window.location.href. Note that Safari 3 & Chrome barf on
		// location.hash = '#' so the entire URL is set.
		location.href = url;
	};

	// Method: jQuery.bbq.getState
	//
	// Retrieves the current 'state' from the browser history, parsing
	// location.hash for a specific key or returning an object containing the
	// entire state, optionally coercing numbers, booleans, null and undefined
	// values.
	//
	// Usage:
	//
	// > jQuery.bbq.getState( [ key ] [, coerce ] );
	//
	// Arguments:
	//
	//  key - (String) An optional state key for which to return a value.
	//  coerce - (Boolean) If true, coerces any numbers or true, false, null, and
	//    undefined to their actual value. Defaults to false.
	//
	// Returns:
	//
	//  (Anything) If key is passed, returns the value corresponding with that key
	//    in the location.hash 'state', or undefined. If not, an object
	//    representing the entire 'state' is returned.

	jq_bbq.getState = jq_bbq_getState = function( key, coerce ) {
		return key === undefined || typeof key === 'boolean'
				? jq_deparam_fragment( key ) // 'key' really means 'coerce' here
				: jq_deparam_fragment( coerce )[ key ];
	};

	// Method: jQuery.bbq.removeState
	//
	// Remove one or more keys from the current browser history 'state', creating
	// a new state, setting location.hash and triggering any bound
	// <hashchange event> callbacks (provided the new state is different than
	// the previous state).
	//
	// If no arguments are passed, an empty state is created, which is just a
	// shortcut for jQuery.bbq.pushState( {}, 2 ).
	//
	// Usage:
	//
	// > jQuery.bbq.removeState( [ key [, key ... ] ] );
	//
	// Arguments:
	//
	//  key - (String) One or more key values to remove from the current state,
	//    passed as individual arguments.
	//  key - (Array) A single array argument that contains a list of key values
	//    to remove from the current state.
	//
	// Returns:
	//
	//  Nothing.
	//
	// Additional Notes:
	//
	//  * Setting an empty state may cause the browser to scroll.

	jq_bbq.removeState = function( arr ) {
		var state = {};

		// If one or more arguments is passed..
		if ( arr !== undefined ) {

			// Get the current state.
			state = jq_bbq_getState();

			// For each passed key, delete the corresponding property from the current
			// state.
			$.each( $.isArray( arr ) ? arr : arguments, function(i,v){
				delete state[ v ];
			});
		}

		// Set the state, completely overriding any existing state.
		jq_bbq_pushState( state, 2 );
	};

	// Event: hashchange event (BBQ)
	//
	// Usage in jQuery 1.4 and newer:
	//
	// In jQuery 1.4 and newer, the event object passed into any hashchange event
	// callback is augmented with a copy of the location.hash fragment at the time
	// the event was triggered as its event.fragment property. In addition, the
	// event.getState method operates on this property (instead of location.hash)
	// which allows this fragment-as-a-state to be referenced later, even after
	// window.location may have changed.
	//
	// Note that event.fragment and event.getState are not defined according to
	// W3C (or any other) specification, but will still be available whether or
	// not the hashchange event exists natively in the browser, because of the
	// utility they provide.
	//
	// The event.fragment property contains the output of <jQuery.param.fragment>
	// and the event.getState method is equivalent to the <jQuery.bbq.getState>
	// method.
	//
	// > $(window).bind( 'hashchange', function( event ) {
	// >   var hash_str = event.fragment,
	// >     param_obj = event.getState(),
	// >     param_val = event.getState( 'param_name' ),
	// >     param_val_coerced = event.getState( 'param_name', true );
	// >   ...
	// > });
	//
	// Usage in jQuery 1.3.2:
	//
	// In jQuery 1.3.2, the event object cannot to be augmented as in jQuery 1.4+,
	// so the fragment state isn't bound to the event object and must instead be
	// parsed using the <jQuery.param.fragment> and <jQuery.bbq.getState> methods.
	//
	// > $(window).bind( 'hashchange', function( event ) {
	// >   var hash_str = $.param.fragment(),
	// >     param_obj = $.bbq.getState(),
	// >     param_val = $.bbq.getState( 'param_name' ),
	// >     param_val_coerced = $.bbq.getState( 'param_name', true );
	// >   ...
	// > });
	//
	// Additional Notes:
	//
	// * Due to changes in the special events API, jQuery BBQ v1.2 or newer is
	//   required to enable the augmented event object in jQuery 1.4.2 and newer.
	// * See <jQuery hashchange event> for more detailed information.

	special[ str_hashchange ] = $.extend( special[ str_hashchange ], {

		// Augmenting the event object with the .fragment property and .getState
		// method requires jQuery 1.4 or newer. Note: with 1.3.2, everything will
		// work, but the event won't be augmented)
		add: function( handleObj ) {
			var old_handler;

			function new_handler(e) {
				// e.fragment is set to the value of location.hash (with any leading #
				// removed) at the time the event is triggered.
				var hash = e[ str_fragment ] = jq_param_fragment();

				// e.getState() works just like $.bbq.getState(), but uses the
				// e.fragment property stored on the event object.
				e.getState = function( key, coerce ) {
					return key === undefined || typeof key === 'boolean'
							? jq_deparam( hash, key ) // 'key' really means 'coerce' here
							: jq_deparam( hash, coerce )[ key ];
				};

				old_handler.apply( this, arguments );
			};

			// This may seem a little complicated, but it normalizes the special event
			// .add method between jQuery 1.4/1.4.1 and 1.4.2+
			if ( $.isFunction( handleObj ) ) {
				// 1.4, 1.4.1
				old_handler = handleObj;
				return new_handler;
			} else {
				// 1.4.2+
				old_handler = handleObj.handler;
				handleObj.handler = new_handler;
			}
		}

	});

})(jQuery,this);

/*!
 * jQuery hashchange event - v1.3 - 7/21/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery hashchange event
//
// *Version: 1.3, Last updated: 7/21/2010*
//
// Project Home - http://benalman.com/projects/jquery-hashchange-plugin/
// GitHub       - http://github.com/cowboy/jquery-hashchange/
// Source       - http://github.com/cowboy/jquery-hashchange/raw/master/jquery.ba-hashchange.js
// (Minified)   - http://github.com/cowboy/jquery-hashchange/raw/master/jquery.ba-hashchange.min.js (0.8kb gzipped)
//
// About: License
//
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
//
// About: Examples
//
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
//
// hashchange event - http://benalman.com/code/projects/jquery-hashchange/examples/hashchange/
// document.domain - http://benalman.com/code/projects/jquery-hashchange/examples/document_domain/
//
// About: Support and Testing
//
// Information about what version or versions of jQuery this plugin has been
// tested with, what browsers it has been tested in, and where the unit tests
// reside (so you can test it yourself).
//
// jQuery Versions - 1.2.6, 1.3.2, 1.4.1, 1.4.2
// Browsers Tested - Internet Explorer 6-8, Firefox 2-4, Chrome 5-6, Safari 3.2-5,
//                   Opera 9.6-10.60, iPhone 3.1, Android 1.6-2.2, BlackBerry 4.6-5.
// Unit Tests      - http://benalman.com/code/projects/jquery-hashchange/unit/
//
// About: Known issues
//
// While this jQuery hashchange event implementation is quite stable and
// robust, there are a few unfortunate browser bugs surrounding expected
// hashchange event-based behaviors, independent of any JavaScript
// window.onhashchange abstraction. See the following examples for more
// information:
//
// Chrome: Back Button - http://benalman.com/code/projects/jquery-hashchange/examples/bug-chrome-back-button/
// Firefox: Remote XMLHttpRequest - http://benalman.com/code/projects/jquery-hashchange/examples/bug-firefox-remote-xhr/
// WebKit: Back Button in an Iframe - http://benalman.com/code/projects/jquery-hashchange/examples/bug-webkit-hash-iframe/
// Safari: Back Button from a different domain - http://benalman.com/code/projects/jquery-hashchange/examples/bug-safari-back-from-diff-domain/
//
// Also note that should a browser natively support the window.onhashchange
// event, but not report that it does, the fallback polling loop will be used.
//
// About: Release History
//
// 1.3   - (7/21/2010) Reorganized IE6/7 Iframe code to make it more
//         "removable" for mobile-only development. Added IE6/7 document.title
//         support. Attempted to make Iframe as hidden as possible by using
//         techniques from http://www.paciellogroup.com/blog/?p=604. Added
//         support for the "shortcut" format $(window).hashchange( fn ) and
//         $(window).hashchange() like jQuery provides for built-in events.
//         Renamed jQuery.hashchangeDelay to <jQuery.fn.hashchange.delay> and
//         lowered its default value to 50. Added <jQuery.fn.hashchange.domain>
//         and <jQuery.fn.hashchange.src> properties plus document-domain.html
//         file to address access denied issues when setting document.domain in
//         IE6/7.
// 1.2   - (2/11/2010) Fixed a bug where coming back to a page using this plugin
//         from a page on another domain would cause an error in Safari 4. Also,
//         IE6/7 Iframe is now inserted after the body (this actually works),
//         which prevents the page from scrolling when the event is first bound.
//         Event can also now be bound before DOM ready, but it won't be usable
//         before then in IE6/7.
// 1.1   - (1/21/2010) Incorporated document.documentMode test to fix IE8 bug
//         where browser version is incorrectly reported as 8.0, despite
//         inclusion of the X-UA-Compatible IE=EmulateIE7 meta tag.
// 1.0   - (1/9/2010) Initial Release. Broke out the jQuery BBQ event.special
//         window.onhashchange functionality into a separate plugin for users
//         who want just the basic event & back button support, without all the
//         extra awesomeness that BBQ provides. This plugin will be included as
//         part of jQuery BBQ, but also be available separately.

(function($,window,undefined){
	'$:nomunge'; // Used by YUI compressor.

	// Reused string.
	var str_hashchange = 'hashchange',

	// Method / object references.
			doc = document,
			fake_onhashchange,
			special = $.event.special,

	// Does the browser support window.onhashchange? Note that IE8 running in
	// IE7 compatibility mode reports true for 'onhashchange' in window, even
	// though the event isn't supported, so also test document.documentMode.
			doc_mode = doc.documentMode,
			supports_onhashchange = 'on' + str_hashchange in window && ( doc_mode === undefined || doc_mode > 7 );

	// Get location.hash (or what you'd expect location.hash to be) sans any
	// leading #. Thanks for making this necessary, Firefox!
	function get_fragment( url ) {
		url = url || location.href;
		return '#' + url.replace( /^[^#]*#?(.*)$/, '$1' );
	};

	// Method: jQuery.fn.hashchange
	//
	// Bind a handler to the window.onhashchange event or trigger all bound
	// window.onhashchange event handlers. This behavior is consistent with
	// jQuery's built-in event handlers.
	//
	// Usage:
	//
	// > jQuery(window).hashchange( [ handler ] );
	//
	// Arguments:
	//
	//  handler - (Function) Optional handler to be bound to the hashchange
	//    event. This is a "shortcut" for the more verbose form:
	//    jQuery(window).bind( 'hashchange', handler ). If handler is omitted,
	//    all bound window.onhashchange event handlers will be triggered. This
	//    is a shortcut for the more verbose
	//    jQuery(window).trigger( 'hashchange' ). These forms are described in
	//    the <hashchange event> section.
	//
	// Returns:
	//
	//  (jQuery) The initial jQuery collection of elements.

	// Allow the "shortcut" format $(elem).hashchange( fn ) for binding and
	// $(elem).hashchange() for triggering, like jQuery does for built-in events.
	$.fn[ str_hashchange ] = function( fn ) {
		return fn ? this.bind( str_hashchange, fn ) : this.trigger( str_hashchange );
	};

	// Property: jQuery.fn.hashchange.delay
	//
	// The numeric interval (in milliseconds) at which the <hashchange event>
	// polling loop executes. Defaults to 50.

	// Property: jQuery.fn.hashchange.domain
	//
	// If you're setting document.domain in your JavaScript, and you want hash
	// history to work in IE6/7, not only must this property be set, but you must
	// also set document.domain BEFORE jQuery is loaded into the page. This
	// property is only applicable if you are supporting IE6/7 (or IE8 operating
	// in "IE7 compatibility" mode).
	//
	// In addition, the <jQuery.fn.hashchange.src> property must be set to the
	// path of the included "document-domain.html" file, which can be renamed or
	// modified if necessary (note that the document.domain specified must be the
	// same in both your main JavaScript as well as in this file).
	//
	// Usage:
	//
	// jQuery.fn.hashchange.domain = document.domain;

	// Property: jQuery.fn.hashchange.src
	//
	// If, for some reason, you need to specify an Iframe src file (for example,
	// when setting document.domain as in <jQuery.fn.hashchange.domain>), you can
	// do so using this property. Note that when using this property, history
	// won't be recorded in IE6/7 until the Iframe src file loads. This property
	// is only applicable if you are supporting IE6/7 (or IE8 operating in "IE7
	// compatibility" mode).
	//
	// Usage:
	//
	// jQuery.fn.hashchange.src = 'path/to/file.html';

	$.fn[ str_hashchange ].delay = 50;
	/*
	 $.fn[ str_hashchange ].domain = null;
	 $.fn[ str_hashchange ].src = null;
	 */

	// Event: hashchange event
	//
	// Fired when location.hash changes. In browsers that support it, the native
	// HTML5 window.onhashchange event is used, otherwise a polling loop is
	// initialized, running every <jQuery.fn.hashchange.delay> milliseconds to
	// see if the hash has changed. In IE6/7 (and IE8 operating in "IE7
	// compatibility" mode), a hidden Iframe is created to allow the back button
	// and hash-based history to work.
	//
	// Usage as described in <jQuery.fn.hashchange>:
	//
	// > // Bind an event handler.
	// > jQuery(window).hashchange( function(e) {
	// >   var hash = location.hash;
	// >   ...
	// > });
	// >
	// > // Manually trigger the event handler.
	// > jQuery(window).hashchange();
	//
	// A more verbose usage that allows for event namespacing:
	//
	// > // Bind an event handler.
	// > jQuery(window).bind( 'hashchange', function(e) {
	// >   var hash = location.hash;
	// >   ...
	// > });
	// >
	// > // Manually trigger the event handler.
	// > jQuery(window).trigger( 'hashchange' );
	//
	// Additional Notes:
	//
	// * The polling loop and Iframe are not created until at least one handler
	//   is actually bound to the 'hashchange' event.
	// * If you need the bound handler(s) to execute immediately, in cases where
	//   a location.hash exists on page load, via bookmark or page refresh for
	//   example, use jQuery(window).hashchange() or the more verbose
	//   jQuery(window).trigger( 'hashchange' ).
	// * The event can be bound before DOM ready, but since it won't be usable
	//   before then in IE6/7 (due to the necessary Iframe), recommended usage is
	//   to bind it inside a DOM ready handler.

	// Override existing $.event.special.hashchange methods (allowing this plugin
	// to be defined after jQuery BBQ in BBQ's source code).
	special[ str_hashchange ] = $.extend( special[ str_hashchange ], {

		// Called only when the first 'hashchange' event is bound to window.
		setup: function() {
			// If window.onhashchange is supported natively, there's nothing to do..
			if ( supports_onhashchange ) { return false; }

			// Otherwise, we need to create our own. And we don't want to call this
			// until the user binds to the event, just in case they never do, since it
			// will create a polling loop and possibly even a hidden Iframe.
			$( fake_onhashchange.start );
		},

		// Called only when the last 'hashchange' event is unbound from window.
		teardown: function() {
			// If window.onhashchange is supported natively, there's nothing to do..
			if ( supports_onhashchange ) { return false; }

			// Otherwise, we need to stop ours (if possible).
			$( fake_onhashchange.stop );
		}

	});

	// fake_onhashchange does all the work of triggering the window.onhashchange
	// event for browsers that don't natively support it, including creating a
	// polling loop to watch for hash changes and in IE 6/7 creating a hidden
	// Iframe to enable back and forward.
	fake_onhashchange = (function(){
		var self = {},
				timeout_id,

		// Remember the initial hash so it doesn't get triggered immediately.
				last_hash = get_fragment(),

				fn_retval = function(val){ return val; },
				history_set = fn_retval,
				history_get = fn_retval;

		// Start the polling loop.
		self.start = function() {
			timeout_id || poll();
		};

		// Stop the polling loop.
		self.stop = function() {
			timeout_id && clearTimeout( timeout_id );
			timeout_id = undefined;
		};

		// This polling loop checks every $.fn.hashchange.delay milliseconds to see
		// if location.hash has changed, and triggers the 'hashchange' event on
		// window when necessary.
		function poll() {
			var hash = get_fragment(),
					history_hash = history_get( last_hash );

			if ( hash !== last_hash ) {
				history_set( last_hash = hash, history_hash );

				$(window).trigger( str_hashchange );

			} else if ( history_hash !== last_hash ) {
				location.href = location.href.replace( /#.*/, '' ) + history_hash;
			}

			timeout_id = setTimeout( poll, $.fn[ str_hashchange ].delay );
		};

		// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
		// vvvvvvvvvvvvvvvvvvv REMOVE IF NOT SUPPORTING IE6/7/8 vvvvvvvvvvvvvvvvvvv
		// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
		$.browser.msie && !supports_onhashchange && (function(){
			// Not only do IE6/7 need the "magical" Iframe treatment, but so does IE8
			// when running in "IE7 compatibility" mode.

			var iframe,
					iframe_src;

			// When the event is bound and polling starts in IE 6/7, create a hidden
			// Iframe for history handling.
			self.start = function(){
				if ( !iframe ) {
					iframe_src = $.fn[ str_hashchange ].src;
					iframe_src = iframe_src && iframe_src + get_fragment();

					// Create hidden Iframe. Attempt to make Iframe as hidden as possible
					// by using techniques from http://www.paciellogroup.com/blog/?p=604.
					iframe = $('<iframe tabindex="-1" title="empty"/>').hide()

						// When Iframe has completely loaded, initialize the history and
						// start polling.
							.one( 'load', function(){
								iframe_src || history_set( get_fragment() );
								poll();
							})

						// Load Iframe src if specified, otherwise nothing.
							.attr( 'src', iframe_src || 'javascript:0' )

						// Append Iframe after the end of the body to prevent unnecessary
						// initial page scrolling (yes, this works).
							.insertAfter( 'body' )[0].contentWindow;

					// Whenever `document.title` changes, update the Iframe's title to
					// prettify the back/next history menu entries. Since IE sometimes
					// errors with "Unspecified error" the very first time this is set
					// (yes, very useful) wrap this with a try/catch block.
					doc.onpropertychange = function(){
						try {
							if ( event.propertyName === 'title' ) {
								iframe.document.title = doc.title;
							}
						} catch(e) {}
					};

				}
			};

			// Override the "stop" method since an IE6/7 Iframe was created. Even
			// if there are no longer any bound event handlers, the polling loop
			// is still necessary for back/next to work at all!
			self.stop = fn_retval;

			// Get history by looking at the hidden Iframe's location.hash.
			history_get = function() {
				return get_fragment( iframe.location.href );
			};

			// Set a new history item by opening and then closing the Iframe
			// document, *then* setting its location.hash. If document.domain has
			// been set, update that as well.
			history_set = function( hash, history_hash ) {
				var iframe_doc = iframe.document,
						domain = $.fn[ str_hashchange ].domain;

				if ( hash !== history_hash ) {
					// Update Iframe with any initial `document.title` that might be set.
					iframe_doc.title = doc.title;

					// Opening the Iframe's document after it has been closed is what
					// actually adds a history entry.
					iframe_doc.open();

					// Set document.domain for the Iframe document as well, if necessary.
					domain && iframe_doc.write( '<script>document.domain="' + domain + '"</script>' );

					iframe_doc.close();

					// Update the Iframe's hash, for great justice.
					iframe.location.hash = hash;
				}
			};

		})();
		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		// ^^^^^^^^^^^^^^^^^^^ REMOVE IF NOT SUPPORTING IE6/7/8 ^^^^^^^^^^^^^^^^^^^
		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

		return self;
	})();

})(jQuery,this);

/*********************************************** 
     Begin jquery.base64.js 
***********************************************/ 

/*jslint adsafe: false, bitwise: true, browser: true, cap: false, css: false,
 debug: false, devel: true, eqeqeq: true, es5: false, evil: false,
 forin: false, fragment: false, immed: true, laxbreak: false, newcap: true,
 nomen: false, on: false, onevar: true, passfail: false, plusplus: true,
 regexp: false, rhino: true, safe: false, strict: false, sub: false,
 undef: true, white: false, widget: false, windows: false */
/*global jQuery: false, window: false */
"use strict";

/*
 * Original code (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * jQuery port (c) 2010 Carlo Zottmann
 * http://github.com/carlo/jquery-base64
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* base64 encode/decode compatible with window.btoa/atob
 *
 * window.atob/btoa is a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * It is also found in Safari and Chrome.  It is not available in IE.
 *
 * if (!window.btoa) window.btoa = $.base64.encode
 * if (!window.atob) window.atob = $.base64.decode
 *
 * The original spec's for atob/btoa are a bit lacking
 * https://developer.mozilla.org/en/DOM/window.atob
 * https://developer.mozilla.org/en/DOM/window.btoa
 *
 * window.btoa and $.base64.encode takes a string where charCodeAt is [0,255]
 * If any character is not [0,255], then an exception is thrown.
 *
 * window.atob and $.base64.decode take a base64-encoded string
 * If the input length is not a multiple of 4, or contains invalid characters
 *   then an exception is thrown.
 */

jQuery.base64 = ( function( $ ) {

	var _PADCHAR = "=",
			_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
			_VERSION = "1.0";


	function _getbyte64( s, i ) {
		// This is oddly fast, except on Chrome/V8.
		// Minimal or no improvement in performance by using a
		// object with properties mapping chars to value (eg. 'A': 0)

		var idx = _ALPHA.indexOf( s.charAt( i ) );

		if ( idx === -1 ) {
			throw "Cannot decode base64";
		}

		return idx;
	}


	function _decode( s ) {
		var pads = 0,
				i,
				b10,
				imax = s.length,
				x = [];

		s = String( s );

		if ( imax === 0 ) {
			return s;
		}

		if ( imax % 4 !== 0 ) {
			throw "Cannot decode base64";
		}

		if ( s.charAt( imax - 1 ) === _PADCHAR ) {
			pads = 1;

			if ( s.charAt( imax - 2 ) === _PADCHAR ) {
				pads = 2;
			}

			// either way, we want to ignore this last block
			imax -= 4;
		}

		for ( i = 0; i < imax; i += 4 ) {
			b10 = ( _getbyte64( s, i ) << 18 ) | ( _getbyte64( s, i + 1 ) << 12 ) | ( _getbyte64( s, i + 2 ) << 6 ) | _getbyte64( s, i + 3 );
			x.push( String.fromCharCode( b10 >> 16, ( b10 >> 8 ) & 0xff, b10 & 0xff ) );
		}

		switch ( pads ) {
			case 1:
				b10 = ( _getbyte64( s, i ) << 18 ) | ( _getbyte64( s, i + 1 ) << 12 ) | ( _getbyte64( s, i + 2 ) << 6 );
				x.push( String.fromCharCode( b10 >> 16, ( b10 >> 8 ) & 0xff ) );
				break;

			case 2:
				b10 = ( _getbyte64( s, i ) << 18) | ( _getbyte64( s, i + 1 ) << 12 );
				x.push( String.fromCharCode( b10 >> 16 ) );
				break;
		}

		return x.join( "" );
	}


	function _getbyte( s, i ) {
		var x = s.charCodeAt( i );

		if ( x > 255 ) {
			throw "INVALID_CHARACTER_ERR: DOM Exception 5";
		}

		return x;
	}


	function _encode( s ) {
		if ( arguments.length !== 1 ) {
			throw "SyntaxError: exactly one argument required";
		}

		s = String( s );

		var i,
				b10,
				x = [],
				imax = s.length - s.length % 3;

		if ( s.length === 0 ) {
			return s;
		}

		for ( i = 0; i < imax; i += 3 ) {
			b10 = ( _getbyte( s, i ) << 16 ) | ( _getbyte( s, i + 1 ) << 8 ) | _getbyte( s, i + 2 );
			x.push( _ALPHA.charAt( b10 >> 18 ) );
			x.push( _ALPHA.charAt( ( b10 >> 12 ) & 0x3F ) );
			x.push( _ALPHA.charAt( ( b10 >> 6 ) & 0x3f ) );
			x.push( _ALPHA.charAt( b10 & 0x3f ) );
		}

		switch ( s.length - imax ) {
			case 1:
				b10 = _getbyte( s, i ) << 16;
				x.push( _ALPHA.charAt( b10 >> 18 ) + _ALPHA.charAt( ( b10 >> 12 ) & 0x3F ) + _PADCHAR + _PADCHAR );
				break;

			case 2:
				b10 = ( _getbyte( s, i ) << 16 ) | ( _getbyte( s, i + 1 ) << 8 );
				x.push( _ALPHA.charAt( b10 >> 18 ) + _ALPHA.charAt( ( b10 >> 12 ) & 0x3F ) + _ALPHA.charAt( ( b10 >> 6 ) & 0x3f ) + _PADCHAR );
				break;
		}

		return x.join( "" );
	}


	return {
		decode: _decode,
		encode: _encode,
		VERSION: _VERSION
	};

}( jQuery ) );


/*********************************************** 
     Begin jquery.cookie.js 
***********************************************/ 

/*jshint eqnull:true */
/*!
 * jQuery Cookie Plugin v1.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function($, document) {

	var pluses = /\+/g;
	function raw(s) {
		return s;
	}
	function decoded(s) {
		return decodeURIComponent(s.replace(pluses, ' '));
	}

	$.cookie = function(key, value, options) {

		// key and at least value given, set cookie...
		if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value == null)) {
			options = $.extend({}, $.cookie.defaults, options);

			if (value == null) {
				options.expires = -1;
			}

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			value = String(value);

			return (document.cookie = [
				encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// key and possibly options given, get cookie...
		options = value || $.cookie.defaults || {};
		var decode = options.raw ? raw : decoded;
		var cookies = document.cookie.split('; ');
		for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')); i++) {
			if (decode(parts.shift()) === key) {
				return decode(parts.join('='));
			}
		}
		return null;
	};

	$.cookie.defaults = {};

})(jQuery, document);

/*********************************************** 
     Begin jquery.selectboxes.js 
***********************************************/ 

/*
 *
 * Copyright (c) 2006-2010 Sam Collett (http://www.texotela.co.uk)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version 2.2.5
 * Demo: http://www.texotela.co.uk/code/jquery/select/
 *
 *
 */

;(function($) {

	/**
	 * Adds (single/multiple) options to a select box (or series of select boxes)
	 *
	 * @name     addOption
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @example  $("#myselect").addOption("Value", "Text"); // add single value (will be selected)
	 * @example  $("#myselect").addOption("Value 2", "Text 2", false); // add single value (won't be selected)
	 * @example  $("#myselect").addOption({"foo":"bar","bar":"baz"}, false); // add multiple values, but don't select
	 *
	 */
	$.fn.addOption = function()
	{
		var add = function(el, v, t, sO, index)
		{
			var option = document.createElement("option");
			option.value = v, option.text = t;
			// get options
			var o = el.options;
			// get number of options
			var oL = o.length;
			if(!el.cache)
			{
				el.cache = {};
				// loop through existing options, adding to cache
				for(var i = 0; i < oL; i++)
				{
					el.cache[o[i].value] = i;
				}
			}
			if (index || index == 0)
			{
				// we're going to insert these starting  at a specific index...
				// this has the side effect of el.cache[v] being the
				// correct value for the typeof check below
				var ti = option;
				for(var ii =index; ii <= oL; ii++)
				{
					var tmp = el.options[ii];
					el.options[ii] = ti;
					o[ii] = ti;
					el.cache[o[ii].value] = ii;
					ti = tmp;
				}
			}

			// add to cache if it isn't already
			if(typeof el.cache[v] == "undefined") el.cache[v] = oL;
			el.options[el.cache[v]] = option;
			if(sO)
			{
				option.selected = true;
			}
		};

		var a = arguments;
		if(a.length == 0) return this;
		// select option when added? default is true
		var sO = true;
		// multiple items
		var m = false;
		// other variables
		var items, v, t;
		if(typeof(a[0]) == "object")
		{
			m = true;
			items = a[0];
		}
		if(a.length >= 2)
		{
			if(typeof(a[1]) == "boolean")
			{
				sO = a[1];
				startindex = a[2];
			}
			else if(typeof(a[2]) == "boolean")
			{
				sO = a[2];
				startindex = a[1];
			}
			else
			{
				startindex = a[1];
			}
			if(!m)
			{
				v = a[0];
				t = a[1];
			}
		}
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return;
					if(m)
					{
						for(var item in items)
						{
							add(this, item, items[item], sO, startindex);
							startindex += 1;
						}
					}
					else
					{
						add(this, v, t, sO, startindex);
					}
				}
		);
		return this;
	};

	/**
	 * Add options via ajax
	 *
	 * @name     ajaxAddOption
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @param    String url      Page to get options from (must be valid JSON)
	 * @param    Object params   (optional) Any parameters to send with the request
	 * @param    Boolean select  (optional) Select the added options, default true
	 * @param    Function fn     (optional) Call this function with the select object as param after completion
	 * @param    Array args      (optional) Array with params to pass to the function afterwards
	 * @example  $("#myselect").ajaxAddOption("myoptions.php");
	 * @example  $("#myselect").ajaxAddOption("myoptions.php", {"code" : "007"});
	 * @example  $("#myselect").ajaxAddOption("myoptions.php", {"code" : "007"}, false, sortoptions, [{"dir": "desc"}]);
	 *
	 */
	$.fn.ajaxAddOption = function(url, params, select, fn, args)
	{
		if(typeof(url) != "string") return this;
		if(typeof(params) != "object") params = {};
		if(typeof(select) != "boolean") select = true;
		this.each(
				function()
				{
					var el = this;
					$.getJSON(url,
							params,
							function(r)
							{
								$(el).addOption(r, select);
								if(typeof fn == "function")
								{
									if(typeof args == "object")
									{
										fn.apply(el, args);
									}
									else
									{
										fn.call(el);
									}
								}
							}
					);
				}
		);
		return this;
	};

	/**
	 * Removes an option (by value or index) from a select box (or series of select boxes)
	 *
	 * @name     removeOption
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @param    String|RegExp|Number what  Option to remove
	 * @param    Boolean selectedOnly       (optional) Remove only if it has been selected (default false)
	 * @example  $("#myselect").removeOption("Value"); // remove by value
	 * @example  $("#myselect").removeOption(/^val/i); // remove options with a value starting with 'val'
	 * @example  $("#myselect").removeOption(/./); // remove all options
	 * @example  $("#myselect").removeOption(/./, true); // remove all options that have been selected
	 * @example  $("#myselect").removeOption(0); // remove by index
	 * @example  $("#myselect").removeOption(["myselect_1","myselect_2"]); // values contained in passed array
	 *
	 */
	$.fn.removeOption = function()
	{
		var a = arguments;
		if(a.length == 0) return this;
		var ta = typeof(a[0]);
		var v, index;
		// has to be a string or regular expression (object in IE, function in Firefox)
		if(ta == "string" || ta == "object" || ta == "function" )
		{
			v = a[0];
			// if an array, remove items
			if(v.constructor == Array)
			{
				var l = v.length;
				for(var i = 0; i<l; i++)
				{
					this.removeOption(v[i], a[1]);
				}
				return this;
			}
		}
		else if(ta == "number") index = a[0];
		else return this;
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return;
					// clear cache
					if(this.cache) this.cache = null;
					// does the option need to be removed?
					var remove = false;
					// get options
					var o = this.options;
					if(!!v)
					{
						// get number of options
						var oL = o.length;
						for(var i=oL-1; i>=0; i--)
						{
							if(v.constructor == RegExp)
							{
								if(o[i].value.match(v))
								{
									remove = true;
								}
							}
							else if(o[i].value == v)
							{
								remove = true;
							}
							// if the option is only to be removed if selected
							if(remove && a[1] === true) remove = o[i].selected;
							if(remove)
							{
								o[i] = null;
							}
							remove = false;
						}
					}
					else
					{
						// only remove if selected?
						if(a[1] === true)
						{
							remove = o[index].selected;
						}
						else
						{
							remove = true;
						}
						if(remove)
						{
							this.remove(index);
						}
					}
				}
		);
		return this;
	};

	/**
	 * Sort options (ascending or descending) in a select box (or series of select boxes)
	 *
	 * @name     sortOptions
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @param    Boolean ascending   (optional) Sort ascending (true/undefined), or descending (false)
	 * @example  // ascending
	 * $("#myselect").sortOptions(); // or $("#myselect").sortOptions(true);
	 * @example  // descending
	 * $("#myselect").sortOptions(false);
	 *
	 */
	$.fn.sortOptions = function(ascending)
	{
		// get selected values first
		var sel = $(this).selectedValues();
		var a = typeof(ascending) == "undefined" ? true : !!ascending;
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return;
					// get options
					var o = this.options;
					// get number of options
					var oL = o.length;
					// create an array for sorting
					var sA = [];
					// loop through options, adding to sort array
					for(var i = 0; i<oL; i++)
					{
						sA[i] = {
							v: o[i].value,
							t: o[i].text
						}
					}
					// sort items in array
					sA.sort(
							function(o1, o2)
							{
								// option text is made lowercase for case insensitive sorting
								o1t = o1.t.toLowerCase(), o2t = o2.t.toLowerCase();
								// if options are the same, no sorting is needed
								if(o1t == o2t) return 0;
								if(a)
								{
									return o1t < o2t ? -1 : 1;
								}
								else
								{
									return o1t > o2t ? -1 : 1;
								}
							}
					);
					// change the options to match the sort array
					for(var i = 0; i<oL; i++)
					{
						o[i].text = sA[i].t;
						o[i].value = sA[i].v;
					}
				}
		).selectOptions(sel, true); // select values, clearing existing ones
		return this;
	};
	/**
	 * Selects an option by value
	 *
	 * @name     selectOptions
	 * @author   Mathias Bank (http://www.mathias-bank.de), original function
	 * @author   Sam Collett (http://www.texotela.co.uk), addition of regular expression matching
	 * @type     jQuery
	 * @param    String|RegExp|Array value  Which options should be selected
	 * can be a string or regular expression, or an array of strings / regular expressions
	 * @param    Boolean clear  Clear existing selected options, default false
	 * @example  $("#myselect").selectOptions("val1"); // with the value 'val1'
	 * @example  $("#myselect").selectOptions(["val1","val2","val3"]); // with the values 'val1' 'val2' 'val3'
	 * @example  $("#myselect").selectOptions(/^val/i); // with the value starting with 'val', case insensitive
	 *
	 */
	$.fn.selectOptions = function(value, clear)
	{
		var v = value;
		var vT = typeof(value);
		// handle arrays
		if(vT == "object" && v.constructor == Array)
		{
			var $this = this;
			$.each(v, function()
					{
						$this.selectOptions(this, clear);
					}
			);
		};
		var c = clear || false;
		// has to be a string or regular expression (object in IE, function in Firefox)
		if(vT != "string" && vT != "function" && vT != "object") return this;
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return this;
					// get options
					var o = this.options;
					// get number of options
					var oL = o.length;
					for(var i = 0; i<oL; i++)
					{
						if(v.constructor == RegExp)
						{
							if(o[i].value.match(v))
							{
								o[i].selected = true;
							}
							else if(c)
							{
								o[i].selected = false;
							}
						}
						else
						{
							if(o[i].value == v)
							{
								o[i].selected = true;
							}
							else if(c)
							{
								o[i].selected = false;
							}
						}
					}
				}
		);
		return this;
	};

	/**
	 * Copy options to another select
	 *
	 * @name     copyOptions
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @param    String to  Element to copy to
	 * @param    String which  (optional) Specifies which options should be copied - 'all' or 'selected'. Default is 'selected'
	 * @example  $("#myselect").copyOptions("#myselect2"); // copy selected options from 'myselect' to 'myselect2'
	 * @example  $("#myselect").copyOptions("#myselect2","selected"); // same as above
	 * @example  $("#myselect").copyOptions("#myselect2","all"); // copy all options from 'myselect' to 'myselect2'
	 *
	 */
	$.fn.copyOptions = function(to, which)
	{
		var w = which || "selected";
		if($(to).size() == 0) return this;
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return this;
					// get options
					var o = this.options;
					// get number of options
					var oL = o.length;
					for(var i = 0; i<oL; i++)
					{
						if(w == "all" || (w == "selected" && o[i].selected))
						{
							$(to).addOption(o[i].value, o[i].text);
						}
					}
				}
		);
		return this;
	};

	/**
	 * Checks if a select box has an option with the supplied value
	 *
	 * @name     containsOption
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     Boolean|jQuery
	 * @param    String|RegExp value  Which value to check for. Can be a string or regular expression
	 * @param    Function fn          (optional) Function to apply if an option with the given value is found.
	 * Use this if you don't want to break the chaining
	 * @example  if($("#myselect").containsOption("val1")) alert("Has an option with the value 'val1'");
	 * @example  if($("#myselect").containsOption(/^val/i)) alert("Has an option with the value starting with 'val'");
	 * @example  $("#myselect").containsOption("val1", copyoption).doSomethingElseWithSelect(); // calls copyoption (user defined function) for any options found, chain is continued
	 *
	 */
	$.fn.containsOption = function(value, fn)
	{
		var found = false;
		var v = value;
		var vT = typeof(v);
		var fT = typeof(fn);
		// has to be a string or regular expression (object in IE, function in Firefox)
		if(vT != "string" && vT != "function" && vT != "object") return fT == "function" ? this: found;
		this.each(
				function()
				{
					if(this.nodeName.toLowerCase() != "select") return this;
					// option already found
					if(found && fT != "function") return false;
					// get options
					var o = this.options;
					// get number of options
					var oL = o.length;
					for(var i = 0; i<oL; i++)
					{
						if(v.constructor == RegExp)
						{
							if (o[i].value.match(v))
							{
								found = true;
								if(fT == "function") fn.call(o[i], i);
							}
						}
						else
						{
							if (o[i].value == v)
							{
								found = true;
								if(fT == "function") fn.call(o[i], i);
							}
						}
					}
				}
		);
		return fT == "function" ? this : found;
	};

	/**
	 * Returns values which have been selected
	 *
	 * @name     selectedValues
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     Array
	 * @example  $("#myselect").selectedValues();
	 *
	 */
	$.fn.selectedValues = function()
	{
		var v = [];
		this.selectedOptions().each(
				function()
				{
					v[v.length] = this.value;
				}
		);
		return v;
	};

	/**
	 * Returns text which has been selected
	 *
	 * @name     selectedTexts
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     Array
	 * @example  $("#myselect").selectedTexts();
	 *
	 */
	$.fn.selectedTexts = function()
	{
		var t = [];
		this.selectedOptions().each(
				function()
				{
					t[t.length] = this.text;
				}
		);
		return t;
	};

	/**
	 * Returns options which have been selected
	 *
	 * @name     selectedOptions
	 * @author   Sam Collett (http://www.texotela.co.uk)
	 * @type     jQuery
	 * @example  $("#myselect").selectedOptions();
	 *
	 */
	$.fn.selectedOptions = function()
	{
		return this.find("option:selected");
	};

})(jQuery);

/*********************************************** 
     Begin md5.js 
***********************************************/ 

// http://www.myersdaily.org/joseph/javascript/md5-text.html
function md5cycle(x, k) {
	var a = x[0], b = x[1], c = x[2], d = x[3];

	a = ff(a, b, c, d, k[0], 7, -680876936);
	d = ff(d, a, b, c, k[1], 12, -389564586);
	c = ff(c, d, a, b, k[2], 17, 606105819);
	b = ff(b, c, d, a, k[3], 22, -1044525330);
	a = ff(a, b, c, d, k[4], 7, -176418897);
	d = ff(d, a, b, c, k[5], 12, 1200080426);
	c = ff(c, d, a, b, k[6], 17, -1473231341);
	b = ff(b, c, d, a, k[7], 22, -45705983);
	a = ff(a, b, c, d, k[8], 7, 1770035416);
	d = ff(d, a, b, c, k[9], 12, -1958414417);
	c = ff(c, d, a, b, k[10], 17, -42063);
	b = ff(b, c, d, a, k[11], 22, -1990404162);
	a = ff(a, b, c, d, k[12], 7, 1804603682);
	d = ff(d, a, b, c, k[13], 12, -40341101);
	c = ff(c, d, a, b, k[14], 17, -1502002290);
	b = ff(b, c, d, a, k[15], 22, 1236535329);

	a = gg(a, b, c, d, k[1], 5, -165796510);
	d = gg(d, a, b, c, k[6], 9, -1069501632);
	c = gg(c, d, a, b, k[11], 14, 643717713);
	b = gg(b, c, d, a, k[0], 20, -373897302);
	a = gg(a, b, c, d, k[5], 5, -701558691);
	d = gg(d, a, b, c, k[10], 9, 38016083);
	c = gg(c, d, a, b, k[15], 14, -660478335);
	b = gg(b, c, d, a, k[4], 20, -405537848);
	a = gg(a, b, c, d, k[9], 5, 568446438);
	d = gg(d, a, b, c, k[14], 9, -1019803690);
	c = gg(c, d, a, b, k[3], 14, -187363961);
	b = gg(b, c, d, a, k[8], 20, 1163531501);
	a = gg(a, b, c, d, k[13], 5, -1444681467);
	d = gg(d, a, b, c, k[2], 9, -51403784);
	c = gg(c, d, a, b, k[7], 14, 1735328473);
	b = gg(b, c, d, a, k[12], 20, -1926607734);

	a = hh(a, b, c, d, k[5], 4, -378558);
	d = hh(d, a, b, c, k[8], 11, -2022574463);
	c = hh(c, d, a, b, k[11], 16, 1839030562);
	b = hh(b, c, d, a, k[14], 23, -35309556);
	a = hh(a, b, c, d, k[1], 4, -1530992060);
	d = hh(d, a, b, c, k[4], 11, 1272893353);
	c = hh(c, d, a, b, k[7], 16, -155497632);
	b = hh(b, c, d, a, k[10], 23, -1094730640);
	a = hh(a, b, c, d, k[13], 4, 681279174);
	d = hh(d, a, b, c, k[0], 11, -358537222);
	c = hh(c, d, a, b, k[3], 16, -722521979);
	b = hh(b, c, d, a, k[6], 23, 76029189);
	a = hh(a, b, c, d, k[9], 4, -640364487);
	d = hh(d, a, b, c, k[12], 11, -421815835);
	c = hh(c, d, a, b, k[15], 16, 530742520);
	b = hh(b, c, d, a, k[2], 23, -995338651);

	a = ii(a, b, c, d, k[0], 6, -198630844);
	d = ii(d, a, b, c, k[7], 10, 1126891415);
	c = ii(c, d, a, b, k[14], 15, -1416354905);
	b = ii(b, c, d, a, k[5], 21, -57434055);
	a = ii(a, b, c, d, k[12], 6, 1700485571);
	d = ii(d, a, b, c, k[3], 10, -1894986606);
	c = ii(c, d, a, b, k[10], 15, -1051523);
	b = ii(b, c, d, a, k[1], 21, -2054922799);
	a = ii(a, b, c, d, k[8], 6, 1873313359);
	d = ii(d, a, b, c, k[15], 10, -30611744);
	c = ii(c, d, a, b, k[6], 15, -1560198380);
	b = ii(b, c, d, a, k[13], 21, 1309151649);
	a = ii(a, b, c, d, k[4], 6, -145523070);
	d = ii(d, a, b, c, k[11], 10, -1120210379);
	c = ii(c, d, a, b, k[2], 15, 718787259);
	b = ii(b, c, d, a, k[9], 21, -343485551);

	x[0] = add32(a, x[0]);
	x[1] = add32(b, x[1]);
	x[2] = add32(c, x[2]);
	x[3] = add32(d, x[3]);

}

function cmn(q, a, b, x, s, t) {
	a = add32(add32(a, q), add32(x, t));
	return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
	return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
	return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
	return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
	return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s) {
	txt = '';
	var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
	for (i = 64; i <= s.length; i += 64) {
		md5cycle(state, md5blk(s.substring(i - 64, i)));
	}
	s = s.substring(i - 64);
	var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (i = 0; i < s.length; i++)
		tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
	tail[i >> 2] |= 0x80 << ((i % 4) << 3);
	if (i > 55) {
		md5cycle(state, tail);
		for (i = 0; i < 16; i++) tail[i] = 0;
	}
	tail[14] = n * 8;
	md5cycle(state, tail);
	return state;
}

/* there needs to be support for Unicode here,
 * unless we pretend that we can redefine the MD-5
 * algorithm for multi-byte characters (perhaps
 * by adding every four 16-bit characters and
 * shortening the sum to 32 bits). Otherwise
 * I suggest performing MD-5 as if every character
 * was two bytes--e.g., 0040 0025 = @%--but then
 * how will an ordinary MD-5 sum be matched?
 * There is no way to standardize text to something
 * like UTF-8 before transformation; speed cost is
 * utterly prohibitive. The JavaScript standard
 * itself needs to look at this: it should start
 * providing access to strings as preformed UTF-8
 * 8-bit unsigned value arrays.
 */
function md5blk(s) { /* I figured global was faster.   */
	var md5blks = [], i;
	/* Andy King said do it this way. */
	for (i = 0; i < 64; i += 4) {
		md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
	}
	return md5blks;
}

var hex_chr = '0123456789abcdef'.split('');

function rhex(n) {
	var s = '', j = 0;
	for (; j < 4; j++)
		s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
	return s;
}

function hex(x) {
	for (var i = 0; i < x.length; i++)
		x[i] = rhex(x[i]);
	return x.join('');
}

function md5(s) {
	return hex(md51(s));
}

/* this function is much faster,
 so if possible we use it. Some IEs
 are the only ones I know of that
 need the idiotic second function,
 generated by an if clause.  */

function add32(a, b) {
	return (a + b) & 0xFFFFFFFF;
}

if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
	function add32(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}
}

/*********************************************** 
     Begin jquery.ui.core.js 
***********************************************/ 

/*!
 * jQuery UI 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI
 */
(function( $, undefined ) {

// prevent duplicate loading
// this is only a problem because we proxy existing functions
// and we don't want to double proxy them
$.ui = $.ui || {};
if ( $.ui.version ) {
	return;
}

$.extend( $.ui, {
	version: "1.8.22",

	keyCode: {
		ALT: 18,
		BACKSPACE: 8,
		CAPS_LOCK: 20,
		COMMA: 188,
		COMMAND: 91,
		COMMAND_LEFT: 91, // COMMAND
		COMMAND_RIGHT: 93,
		CONTROL: 17,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		INSERT: 45,
		LEFT: 37,
		MENU: 93, // COMMAND_RIGHT
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SHIFT: 16,
		SPACE: 32,
		TAB: 9,
		UP: 38,
		WINDOWS: 91 // COMMAND
	}
});

// plugins
$.fn.extend({
	propAttr: $.fn.prop || $.fn.attr,

	_focus: $.fn.focus,
	focus: function( delay, fn ) {
		return typeof delay === "number" ?
			this.each(function() {
				var elem = this;
				setTimeout(function() {
					$( elem ).focus();
					if ( fn ) {
						fn.call( elem );
					}
				}, delay );
			}) :
			this._focus.apply( this, arguments );
	},

	scrollParent: function() {
		var scrollParent;
		if (($.browser.msie && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.curCSS(this,'position',1)) && (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.curCSS(this,'overflow',1)+$.curCSS(this,'overflow-y',1)+$.curCSS(this,'overflow-x',1));
			}).eq(0);
		}

		return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},

	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.curCSS( elem, "padding" + this, true) ) || 0;
				if ( border ) {
					size -= parseFloat( $.curCSS( elem, "border" + this + "Width", true) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.curCSS( elem, "margin" + this, true) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		var map = element.parentNode,
			mapName = map.name,
			img;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap=#" + mapName + "]" )[0];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName )
		? !element.disabled
		: "a" == nodeName
			? element.href || isTabIndexNotNaN
			: isTabIndexNotNaN)
		// the element and all of its ancestors must be visible
		&& visible( element );
}

function visible( element ) {
	return !$( element ).parents().andSelf().filter(function() {
		return $.curCSS( this, "visibility" ) === "hidden" ||
			$.expr.filters.hidden( this );
	}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support
$(function() {
	var body = document.body,
		div = body.appendChild( div = document.createElement( "div" ) );

	// access offsetHeight before setting the style to prevent a layout bug
	// in IE 9 which causes the elemnt to continue to take up space even
	// after it is removed from the DOM (#8026)
	div.offsetHeight;

	$.extend( div.style, {
		minHeight: "100px",
		height: "auto",
		padding: 0,
		borderWidth: 0
	});

	$.support.minHeight = div.offsetHeight === 100;
	$.support.selectstart = "onselectstart" in div;

	// set display to none to avoid a layout bug in IE
	// http://dev.jquery.com/ticket/4014
	body.removeChild( div ).style.display = "none";
});

// jQuery <1.4.3 uses curCSS, in 1.4.3 - 1.7.2 curCSS = css, 1.8+ only has css
if ( !$.curCSS ) {
	$.curCSS = $.css;
}





// deprecated
$.extend( $.ui, {
	// $.ui.plugin is deprecated.  Use the proxy pattern instead.
	plugin: {
		add: function( module, option, set ) {
			var proto = $.ui[ module ].prototype;
			for ( var i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode ) {
				return;
			}
	
			for ( var i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},
	
	// will be deprecated when we switch to jQuery 1.4 - use jQuery.contains()
	contains: function( a, b ) {
		return document.compareDocumentPosition ?
			a.compareDocumentPosition( b ) & 16 :
			a !== b && a.contains( b );
	},
	
	// only used by resizable
	hasScroll: function( el, a ) {
	
		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}
	
		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;
	
		if ( el[ scroll ] > 0 ) {
			return true;
		}
	
		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	},
	
	// these are odd functions, fix the API or move into individual plugins
	isOverAxis: function( x, reference, size ) {
		//Determines when x coordinate is over "b" element axis
		return ( x > reference ) && ( x < ( reference + size ) );
	},
	isOver: function( y, x, top, left, height, width ) {
		//Determines when x, y coordinates is over "b" element
		return $.ui.isOverAxis( y, top, height ) && $.ui.isOverAxis( x, left, width );
	}
});

})( jQuery );


/*********************************************** 
     Begin jquery.ui.widget.js 
***********************************************/ 

/*!
 * jQuery UI Widget 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Widget
 */
(function( $, undefined ) {

// jQuery 1.4+
if ( $.cleanData ) {
	var _cleanData = $.cleanData;
	$.cleanData = function( elems ) {
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			try {
				$( elem ).triggerHandler( "remove" );
			// http://bugs.jquery.com/ticket/8235
			} catch( e ) {}
		}
		_cleanData( elems );
	};
} else {
	var _remove = $.fn.remove;
	$.fn.remove = function( selector, keepData ) {
		return this.each(function() {
			if ( !keepData ) {
				if ( !selector || $.filter( selector, [ this ] ).length ) {
					$( "*", this ).add( [ this ] ).each(function() {
						try {
							$( this ).triggerHandler( "remove" );
						// http://bugs.jquery.com/ticket/8235
						} catch( e ) {}
					});
				}
			}
			return _remove.call( $(this), selector, keepData );
		});
	};
}

$.widget = function( name, base, prototype ) {
	var namespace = name.split( "." )[ 0 ],
		fullName;
	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName ] = function( elem ) {
		return !!$.data( elem, name );
	};

	$[ namespace ] = $[ namespace ] || {};
	$[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without initializing for simple inheritance
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	var basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
//	$.each( basePrototype, function( key, val ) {
//		if ( $.isPlainObject(val) ) {
//			basePrototype[ key ] = $.extend( {}, val );
//		}
//	});
	basePrototype.options = $.extend( true, {}, basePrototype.options );
	$[ namespace ][ name ].prototype = $.extend( true, basePrototype, {
		namespace: namespace,
		widgetName: name,
		widgetEventPrefix: $[ namespace ][ name ].prototype.widgetEventPrefix || name,
		widgetBaseClass: fullName
	}, prototype );

	$.widget.bridge( name, $[ namespace ][ name ] );
};

$.widget.bridge = function( name, object ) {
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = Array.prototype.slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.extend.apply( null, [ true, options ].concat(args) ) :
			options;

		// prevent calls to internal methods
		if ( isMethodCall && options.charAt( 0 ) === "_" ) {
			return returnValue;
		}

		if ( isMethodCall ) {
			this.each(function() {
				var instance = $.data( this, name ),
					methodValue = instance && $.isFunction( instance[options] ) ?
						instance[ options ].apply( instance, args ) :
						instance;
				// TODO: add this back in 1.9 and use $.error() (see #5972)
//				if ( !instance ) {
//					throw "cannot call methods on " + name + " prior to initialization; " +
//						"attempted to call method '" + options + "'";
//				}
//				if ( !$.isFunction( instance[options] ) ) {
//					throw "no such method '" + options + "' for " + name + " widget instance";
//				}
//				var methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, name );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, name, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( options, element ) {
	// allow instantiation without initializing for simple inheritance
	if ( arguments.length ) {
		this._createWidget( options, element );
	}
};

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	options: {
		disabled: false
	},
	_createWidget: function( options, element ) {
		// $.widget.bridge stores the plugin instance, but we do it anyway
		// so that it's stored even before the _create function runs
		$.data( element, this.widgetName, this );
		this.element = $( element );
		this.options = $.extend( true, {},
			this.options,
			this._getCreateOptions(),
			options );

		var self = this;
		this.element.bind( "remove." + this.widgetName, function() {
			self.destroy();
		});

		this._create();
		this._trigger( "create" );
		this._init();
	},
	_getCreateOptions: function() {
		return $.metadata && $.metadata.get( this.element[0] )[ this.widgetName ];
	},
	_create: function() {},
	_init: function() {},

	destroy: function() {
		this.element
			.unbind( "." + this.widgetName )
			.removeData( this.widgetName );
		this.widget()
			.unbind( "." + this.widgetName )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetBaseClass + "-disabled " +
				"ui-state-disabled" );
	},

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.extend( {}, this.options );
		}

		if  (typeof key === "string" ) {
			if ( value === undefined ) {
				return this.options[ key ];
			}
			options = {};
			options[ key ] = value;
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var self = this;
		$.each( options, function( key, value ) {
			self._setOption( key, value );
		});

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				[ value ? "addClass" : "removeClass"](
					this.widgetBaseClass + "-disabled" + " " +
					"ui-state-disabled" )
				.attr( "aria-disabled", value );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );

		return !( $.isFunction(callback) &&
			callback.call( this.element[0], event, data ) === false ||
			event.isDefaultPrevented() );
	}
};

})( jQuery );


/*********************************************** 
     Begin jquery.ui.position.js 
***********************************************/ 

/*!
 * jQuery UI Position 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Position
 */
(function( $, undefined ) {

$.ui = $.ui || {};

var horizontalPositions = /left|center|right/,
	verticalPositions = /top|center|bottom/,
	center = "center",
	support = {},
	_position = $.fn.position,
	_offset = $.fn.offset;

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var target = $( options.of ),
		targetElem = target[0],
		collision = ( options.collision || "flip" ).split( " " ),
		offset = options.offset ? options.offset.split( " " ) : [ 0, 0 ],
		targetWidth,
		targetHeight,
		basePosition;

	if ( targetElem.nodeType === 9 ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: 0, left: 0 };
	// TODO: use $.isWindow() in 1.9
	} else if ( targetElem.setTimeout ) {
		targetWidth = target.width();
		targetHeight = target.height();
		basePosition = { top: target.scrollTop(), left: target.scrollLeft() };
	} else if ( targetElem.preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
		targetWidth = targetHeight = 0;
		basePosition = { top: options.of.pageY, left: options.of.pageX };
	} else {
		targetWidth = target.outerWidth();
		targetHeight = target.outerHeight();
		basePosition = target.offset();
	}

	// force my and at to have valid horizontal and veritcal positions
	// if a value is missing or invalid, it will be converted to center 
	$.each( [ "my", "at" ], function() {
		var pos = ( options[this] || "" ).split( " " );
		if ( pos.length === 1) {
			pos = horizontalPositions.test( pos[0] ) ?
				pos.concat( [center] ) :
				verticalPositions.test( pos[0] ) ?
					[ center ].concat( pos ) :
					[ center, center ];
		}
		pos[ 0 ] = horizontalPositions.test( pos[0] ) ? pos[ 0 ] : center;
		pos[ 1 ] = verticalPositions.test( pos[1] ) ? pos[ 1 ] : center;
		options[ this ] = pos;
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	// normalize offset option
	offset[ 0 ] = parseInt( offset[0], 10 ) || 0;
	if ( offset.length === 1 ) {
		offset[ 1 ] = offset[ 0 ];
	}
	offset[ 1 ] = parseInt( offset[1], 10 ) || 0;

	if ( options.at[0] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[0] === center ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[1] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[1] === center ) {
		basePosition.top += targetHeight / 2;
	}

	basePosition.left += offset[ 0 ];
	basePosition.top += offset[ 1 ];

	return this.each(function() {
		var elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseInt( $.curCSS( this, "marginLeft", true ) ) || 0,
			marginTop = parseInt( $.curCSS( this, "marginTop", true ) ) || 0,
			collisionWidth = elemWidth + marginLeft +
				( parseInt( $.curCSS( this, "marginRight", true ) ) || 0 ),
			collisionHeight = elemHeight + marginTop +
				( parseInt( $.curCSS( this, "marginBottom", true ) ) || 0 ),
			position = $.extend( {}, basePosition ),
			collisionPosition;

		if ( options.my[0] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[0] === center ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[1] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[1] === center ) {
			position.top -= elemHeight / 2;
		}

		// prevent fractions if jQuery version doesn't support them (see #5280)
		if ( !support.fractions ) {
			position.left = Math.round( position.left );
			position.top = Math.round( position.top );
		}

		collisionPosition = {
			left: position.left - marginLeft,
			top: position.top - marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[i] ] ) {
				$.ui.position[ collision[i] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: offset,
					my: options.my,
					at: options.at
				});
			}
		});

		if ( $.fn.bgiframe ) {
			elem.bgiframe();
		}
		elem.offset( $.extend( position, { using: options.using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft();
			position.left = over > 0 ? position.left - over : Math.max( position.left - data.collisionPosition.left, position.left );
		},
		top: function( position, data ) {
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop();
			position.top = over > 0 ? position.top - over : Math.max( position.top - data.collisionPosition.top, position.top );
		}
	},

	flip: {
		left: function( position, data ) {
			if ( data.at[0] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft(),
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					-data.targetWidth,
				offset = -2 * data.offset[ 0 ];
			position.left += data.collisionPosition.left < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		},
		top: function( position, data ) {
			if ( data.at[1] === center ) {
				return;
			}
			var win = $( window ),
				over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop(),
				myOffset = data.my[ 1 ] === "top" ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					-data.targetHeight,
				offset = -2 * data.offset[ 1 ];
			position.top += data.collisionPosition.top < 0 ?
				myOffset + atOffset + offset :
				over > 0 ?
					myOffset + atOffset + offset :
					0;
		}
	}
};

// offset setter from jQuery 1.4
if ( !$.offset.setOffset ) {
	$.offset.setOffset = function( elem, options ) {
		// set position first, in-case top/left are set even on static elem
		if ( /static/.test( $.curCSS( elem, "position" ) ) ) {
			elem.style.position = "relative";
		}
		var curElem   = $( elem ),
			curOffset = curElem.offset(),
			curTop    = parseInt( $.curCSS( elem, "top",  true ), 10 ) || 0,
			curLeft   = parseInt( $.curCSS( elem, "left", true ), 10)  || 0,
			props     = {
				top:  (options.top  - curOffset.top)  + curTop,
				left: (options.left - curOffset.left) + curLeft
			};
		
		if ( 'using' in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	};

	$.fn.offset = function( options ) {
		var elem = this[ 0 ];
		if ( !elem || !elem.ownerDocument ) { return null; }
		if ( options ) {
			if ( $.isFunction( options ) ) {
				return this.each(function( i ) {
					$( this ).offset( options.call( this, i, $( this ).offset() ) );
				});
			}
			return this.each(function() {
				$.offset.setOffset( this, options );
			});
		}
		return _offset.call( this );
	};
}

// fraction support test (older versions of jQuery don't support fractions)
(function () {
	var body = document.getElementsByTagName( "body" )[ 0 ], 
		div = document.createElement( "div" ),
		testElement, testElementParent, testElementStyle, offset, offsetTotal;

	//Create a "fake body" for testing based on method used in jQuery.support
	testElement = document.createElement( body ? "div" : "body" );
	testElementStyle = {
		visibility: "hidden",
		width: 0,
		height: 0,
		border: 0,
		margin: 0,
		background: "none"
	};
	if ( body ) {
		$.extend( testElementStyle, {
			position: "absolute",
			left: "-1000px",
			top: "-1000px"
		});
	}
	for ( var i in testElementStyle ) {
		testElement.style[ i ] = testElementStyle[ i ];
	}
	testElement.appendChild( div );
	testElementParent = body || document.documentElement;
	testElementParent.insertBefore( testElement, testElementParent.firstChild );

	div.style.cssText = "position: absolute; left: 10.7432222px; top: 10.432325px; height: 30px; width: 201px;";

	offset = $( div ).offset( function( _, offset ) {
		return offset;
	}).offset();

	testElement.innerHTML = "";
	testElementParent.removeChild( testElement );

	offsetTotal = offset.top + offset.left + ( body ? 2000 : 0 );
	support.fractions = offsetTotal > 21 && offsetTotal < 22;
})();

}( jQuery ));


/*********************************************** 
     Begin jquery.ui.datepicker.js 
***********************************************/ 

/*!
 * jQuery UI Datepicker 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Datepicker
 *
 * Depends:
 *	jquery.ui.core.js
 */
(function( $, undefined ) {

$.extend($.ui, { datepicker: { version: "1.8.22" } });

var PROP_NAME = 'datepicker';
var dpuuid = new Date().getTime();
var instActive;

/* Date picker manager.
   Use the singleton instance of this class, $.datepicker, to interact with the date picker.
   Settings for (groups of) date pickers are maintained in an instance object,
   allowing multiple different settings on the same page. */

function Datepicker() {
	this.debug = false; // Change this to true to start debugging
	this._curInst = null; // The current instance in use
	this._keyEvent = false; // If the last event was a key event
	this._disabledInputs = []; // List of date picker inputs that have been disabled
	this._datepickerShowing = false; // True if the popup picker is showing , false if not
	this._inDialog = false; // True if showing within a "dialog", false if not
	this._mainDivId = 'ui-datepicker-div'; // The ID of the main datepicker division
	this._inlineClass = 'ui-datepicker-inline'; // The name of the inline marker class
	this._appendClass = 'ui-datepicker-append'; // The name of the append marker class
	this._triggerClass = 'ui-datepicker-trigger'; // The name of the trigger marker class
	this._dialogClass = 'ui-datepicker-dialog'; // The name of the dialog marker class
	this._disableClass = 'ui-datepicker-disabled'; // The name of the disabled covering marker class
	this._unselectableClass = 'ui-datepicker-unselectable'; // The name of the unselectable cell marker class
	this._currentClass = 'ui-datepicker-current-day'; // The name of the current day marker class
	this._dayOverClass = 'ui-datepicker-days-cell-over'; // The name of the day hover marker class
	this.regional = []; // Available regional settings, indexed by language code
	this.regional[''] = { // Default regional settings
		closeText: 'Done', // Display text for close link
		prevText: 'Prev', // Display text for previous month link
		nextText: 'Next', // Display text for next month link
		//eturino clear function
		clearText: 'Clear', // Display text for clean date link
		currentText: 'Today', // Display text for current month link
		monthNames: ['January','February','March','April','May','June',
			'July','August','September','October','November','December'], // Names of months for drop-down and formatting
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], // For formatting
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], // For formatting
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], // For formatting
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'], // Column headings for days starting at Sunday
		weekHeader: 'Wk', // Column header for week of the year
		dateFormat: 'mm/dd/yy', // See format options on parseDate
		firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
		isRTL: false, // True if right-to-left language, false if left-to-right
		showMonthAfterYear: false, // True if the year select precedes month, false for month then year
		yearSuffix: '' // Additional text to append to the year in the month headers
	};
	this._defaults = { // Global defaults for all the date picker instances
		showOn: 'focus', // 'focus' for popup on focus,
			// 'button' for trigger button, or 'both' for either
		showAnim: 'fadeIn', // Name of jQuery animation for popup
		showOptions: {}, // Options for enhanced animations
		defaultDate: null, // Used when field is blank: actual date,
			// +/-number for offset from today, null for today
		appendText: '', // Display text following the input box, e.g. showing the format
		buttonText: '...', // Text for trigger button
		buttonImage: '', // URL for trigger button image
		buttonImageOnly: false, // True if the image appears alone, false if it appears on a button
		hideIfNoPrevNext: false, // True to hide next/previous month links
			// if not applicable, false to just disable them
		navigationAsDateFormat: false, // True if date formatting applied to prev/today/next links
		gotoCurrent: false, // True if today link goes back to current selection instead
		changeMonth: false, // True if month can be selected directly, false if only prev/next
		changeYear: false, // True if year can be selected directly, false if only prev/next
		yearRange: 'c-10:c+10', // Range of years to display in drop-down,
			// either relative to today's year (-nn:+nn), relative to currently displayed year
			// (c-nn:c+nn), absolute (nnnn:nnnn), or a combination of the above (nnnn:-n)
		showOtherMonths: false, // True to show dates in other months, false to leave blank
		selectOtherMonths: false, // True to allow selection of dates in other months, false for unselectable
		showWeek: false, // True to show week of the year, false to not show it
		calculateWeek: this.iso8601Week, // How to calculate the week of the year,
			// takes a Date and returns the number of the week for it
		shortYearCutoff: '+10', // Short year values < this are in the current century,
			// > this are in the previous century,
			// string value starting with '+' for current year + value
		minDate: null, // The earliest selectable date, or null for no limit
		maxDate: null, // The latest selectable date, or null for no limit
		duration: 'fast', // Duration of display/closure
		beforeShowDay: null, // Function that takes a date and returns an array with
			// [0] = true if selectable, false if not, [1] = custom CSS class name(s) or '',
			// [2] = cell title (optional), e.g. $.datepicker.noWeekends
		beforeShow: null, // Function that takes an input field and
			// returns a set of custom settings for the date picker
		onSelect: null, // Define a callback function when a date is selected
		onChangeMonthYear: null, // Define a callback function when the month or year is changed
		onClose: null, // Define a callback function when the datepicker is closed
		numberOfMonths: 1, // Number of months to show at a time
		showCurrentAtPos: 0, // The position in multipe months at which to show the current month (starting at 0)
		stepMonths: 1, // Number of months to step back/forward
		stepBigMonths: 12, // Number of months to step back/forward for the big links
		altField: '', // Selector for an alternate field to store selected dates into
		altFormat: '', // The date format to use for the alternate field
		constrainInput: true, // The input is constrained by the current date format
		showButtonPanel: false, // True to show button panel, false to not show it
		autoSize: false, // True to size the input for the date format, false to leave as is
		disabled: false // The initial disabled state
	};
	$.extend(this._defaults, this.regional['']);
	this.dpDiv = bindHover($('<div id="' + this._mainDivId + '" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'));
}

$.extend(Datepicker.prototype, {
	/* Class name added to elements to indicate already configured with a date picker. */
	markerClassName: 'hasDatepicker',
	
	//Keep track of the maximum number of rows displayed (see #7043)
	maxRows: 4,

	/* Debug logging (if enabled). */
	log: function () {
		if (this.debug)
			console.log.apply('', arguments);
	},
	
	// TODO rename to "widget" when switching to widget factory
	_widgetDatepicker: function() {
		return this.dpDiv;
	},

	/* Override the default settings for all instances of the date picker.
	   @param  settings  object - the new settings to use as defaults (anonymous object)
	   @return the manager object */
	setDefaults: function(settings) {
		extendRemove(this._defaults, settings || {});
		return this;
	},

	/* Attach the date picker to a jQuery selection.
	   @param  target    element - the target input field or division or span
	   @param  settings  object - the new settings to use for this date picker instance (anonymous) */
	_attachDatepicker: function(target, settings) {
		// check for settings on the control itself - in namespace 'date:'
		var inlineSettings = null;
		for (var attrName in this._defaults) {
			var attrValue = target.getAttribute('date:' + attrName);
			if (attrValue) {
				inlineSettings = inlineSettings || {};
				try {
					inlineSettings[attrName] = eval(attrValue);
				} catch (err) {
					inlineSettings[attrName] = attrValue;
				}
			}
		}
		var nodeName = target.nodeName.toLowerCase();
		var inline = (nodeName == 'div' || nodeName == 'span');
		if (!target.id) {
			this.uuid += 1;
			target.id = 'dp' + this.uuid;
		}
		var inst = this._newInst($(target), inline);
		inst.settings = $.extend({}, settings || {}, inlineSettings || {});
		if (nodeName == 'input') {
			this._connectDatepicker(target, inst);
		} else if (inline) {
			this._inlineDatepicker(target, inst);
		}
	},

	/* Create a new instance object. */
	_newInst: function(target, inline) {
		var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1'); // escape jQuery meta chars
		return {id: id, input: target, // associated target
			selectedDay: 0, selectedMonth: 0, selectedYear: 0, // current selection
			drawMonth: 0, drawYear: 0, // month being drawn
			inline: inline, // is datepicker inline or not
			dpDiv: (!inline ? this.dpDiv : // presentation div
			bindHover($('<div class="' + this._inlineClass + ' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>')))};
	},

	/* Attach the date picker to an input field. */
	_connectDatepicker: function(target, inst) {
		var input = $(target);
		inst.append = $([]);
		inst.trigger = $([]);
		if (input.hasClass(this.markerClassName))
			return;
		this._attachments(input, inst);
		input.addClass(this.markerClassName).keydown(this._doKeyDown).
			keypress(this._doKeyPress).keyup(this._doKeyUp).
			bind("setData.datepicker", function(event, key, value) {
				inst.settings[key] = value;
			}).bind("getData.datepicker", function(event, key) {
				return this._get(inst, key);
			});
		this._autoSize(inst);
		$.data(target, PROP_NAME, inst);
		//If disabled option is true, disable the datepicker once it has been attached to the input (see ticket #5665)
		if( inst.settings.disabled ) {
			this._disableDatepicker( target );
		}
	},

	/* Make attachments based on settings. */
	_attachments: function(input, inst) {
		var appendText = this._get(inst, 'appendText');
		var isRTL = this._get(inst, 'isRTL');
		if (inst.append)
			inst.append.remove();
		if (appendText) {
			inst.append = $('<span class="' + this._appendClass + '">' + appendText + '</span>');
			input[isRTL ? 'before' : 'after'](inst.append);
		}
		input.unbind('focus', this._showDatepicker);
		if (inst.trigger)
			inst.trigger.remove();
		var showOn = this._get(inst, 'showOn');
		if (showOn == 'focus' || showOn == 'both') // pop-up date picker when in the marked field
			input.focus(this._showDatepicker);
		if (showOn == 'button' || showOn == 'both') { // pop-up date picker when button clicked
			var buttonText = this._get(inst, 'buttonText');
			var buttonImage = this._get(inst, 'buttonImage');
			inst.trigger = $(this._get(inst, 'buttonImageOnly') ?
				$('<img/>').addClass(this._triggerClass).
					attr({ src: buttonImage, alt: buttonText, title: buttonText }) :
				$('<button type="button"></button>').addClass(this._triggerClass).
					html(buttonImage == '' ? buttonText : $('<img/>').attr(
					{ src:buttonImage, alt:buttonText, title:buttonText })));
			input[isRTL ? 'before' : 'after'](inst.trigger);
			inst.trigger.click(function() {
				if ($.datepicker._datepickerShowing && $.datepicker._lastInput == input[0])
					$.datepicker._hideDatepicker();
				else if ($.datepicker._datepickerShowing && $.datepicker._lastInput != input[0]) {
					$.datepicker._hideDatepicker(); 
					$.datepicker._showDatepicker(input[0]);
				} else
					$.datepicker._showDatepicker(input[0]);
				return false;
			});
		}
	},

	/* Apply the maximum length for the date format. */
	_autoSize: function(inst) {
		if (this._get(inst, 'autoSize') && !inst.inline) {
			var date = new Date(2009, 12 - 1, 20); // Ensure double digits
			var dateFormat = this._get(inst, 'dateFormat');
			if (dateFormat.match(/[DM]/)) {
				var findMax = function(names) {
					var max = 0;
					var maxI = 0;
					for (var i = 0; i < names.length; i++) {
						if (names[i].length > max) {
							max = names[i].length;
							maxI = i;
						}
					}
					return maxI;
				};
				date.setMonth(findMax(this._get(inst, (dateFormat.match(/MM/) ?
					'monthNames' : 'monthNamesShort'))));
				date.setDate(findMax(this._get(inst, (dateFormat.match(/DD/) ?
					'dayNames' : 'dayNamesShort'))) + 20 - date.getDay());
			}
			inst.input.attr('size', this._formatDate(inst, date).length);
		}
	},

	/* Attach an inline date picker to a div. */
	_inlineDatepicker: function(target, inst) {
		var divSpan = $(target);
		if (divSpan.hasClass(this.markerClassName))
			return;
		divSpan.addClass(this.markerClassName).append(inst.dpDiv).
			bind("setData.datepicker", function(event, key, value){
				inst.settings[key] = value;
			}).bind("getData.datepicker", function(event, key){
				return this._get(inst, key);
			});
		$.data(target, PROP_NAME, inst);
		this._setDate(inst, this._getDefaultDate(inst), true);
		this._updateDatepicker(inst);
		this._updateAlternate(inst);
		//If disabled option is true, disable the datepicker before showing it (see ticket #5665)
		if( inst.settings.disabled ) {
			this._disableDatepicker( target );
		}
		// Set display:block in place of inst.dpDiv.show() which won't work on disconnected elements
		// http://bugs.jqueryui.com/ticket/7552 - A Datepicker created on a detached div has zero height
		inst.dpDiv.css( "display", "block" );
	},

	/* Pop-up the date picker in a "dialog" box.
	   @param  input     element - ignored
	   @param  date      string or Date - the initial date to display
	   @param  onSelect  function - the function to call when a date is selected
	   @param  settings  object - update the dialog date picker instance's settings (anonymous object)
	   @param  pos       int[2] - coordinates for the dialog's position within the screen or
	                     event - with x/y coordinates or
	                     leave empty for default (screen centre)
	   @return the manager object */
	_dialogDatepicker: function(input, date, onSelect, settings, pos) {
		var inst = this._dialogInst; // internal instance
		if (!inst) {
			this.uuid += 1;
			var id = 'dp' + this.uuid;
			this._dialogInput = $('<input type="text" id="' + id +
				'" style="position: absolute; top: -100px; width: 0px;"/>');
			this._dialogInput.keydown(this._doKeyDown);
			$('body').append(this._dialogInput);
			inst = this._dialogInst = this._newInst(this._dialogInput, false);
			inst.settings = {};
			$.data(this._dialogInput[0], PROP_NAME, inst);
		}
		extendRemove(inst.settings, settings || {});
		date = (date && date.constructor == Date ? this._formatDate(inst, date) : date);
		this._dialogInput.val(date);

		this._pos = (pos ? (pos.length ? pos : [pos.pageX, pos.pageY]) : null);
		if (!this._pos) {
			var browserWidth = document.documentElement.clientWidth;
			var browserHeight = document.documentElement.clientHeight;
			var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
			var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
			this._pos = // should use actual width/height below
				[(browserWidth / 2) - 100 + scrollX, (browserHeight / 2) - 150 + scrollY];
		}

		// move input on screen for focus, but hidden behind dialog
		this._dialogInput.css('left', (this._pos[0] + 20) + 'px').css('top', this._pos[1] + 'px');
		inst.settings.onSelect = onSelect;
		this._inDialog = true;
		this.dpDiv.addClass(this._dialogClass);
		this._showDatepicker(this._dialogInput[0]);
		if ($.blockUI)
			$.blockUI(this.dpDiv);
		$.data(this._dialogInput[0], PROP_NAME, inst);
		return this;
	},

	/* Detach a datepicker from its control.
	   @param  target    element - the target input field or division or span */
	_destroyDatepicker: function(target) {
		var $target = $(target);
		var inst = $.data(target, PROP_NAME);
		if (!$target.hasClass(this.markerClassName)) {
			return;
		}
		var nodeName = target.nodeName.toLowerCase();
		$.removeData(target, PROP_NAME);
		if (nodeName == 'input') {
			inst.append.remove();
			inst.trigger.remove();
			$target.removeClass(this.markerClassName).
				unbind('focus', this._showDatepicker).
				unbind('keydown', this._doKeyDown).
				unbind('keypress', this._doKeyPress).
				unbind('keyup', this._doKeyUp);
		} else if (nodeName == 'div' || nodeName == 'span')
			$target.removeClass(this.markerClassName).empty();
	},

	/* Enable the date picker to a jQuery selection.
	   @param  target    element - the target input field or division or span */
	_enableDatepicker: function(target) {
		var $target = $(target);
		var inst = $.data(target, PROP_NAME);
		if (!$target.hasClass(this.markerClassName)) {
			return;
		}
		var nodeName = target.nodeName.toLowerCase();
		if (nodeName == 'input') {
			target.disabled = false;
			inst.trigger.filter('button').
				each(function() { this.disabled = false; }).end().
				filter('img').css({opacity: '1.0', cursor: ''});
		}
		else if (nodeName == 'div' || nodeName == 'span') {
			var inline = $target.children('.' + this._inlineClass);
			inline.children().removeClass('ui-state-disabled');
			inline.find("select.ui-datepicker-month, select.ui-datepicker-year").
				removeAttr("disabled");
		}
		this._disabledInputs = $.map(this._disabledInputs,
			function(value) { return (value == target ? null : value); }); // delete entry
	},

	/* Disable the date picker to a jQuery selection.
	   @param  target    element - the target input field or division or span */
	_disableDatepicker: function(target) {
		var $target = $(target);
		var inst = $.data(target, PROP_NAME);
		if (!$target.hasClass(this.markerClassName)) {
			return;
		}
		var nodeName = target.nodeName.toLowerCase();
		if (nodeName == 'input') {
			target.disabled = true;
			inst.trigger.filter('button').
				each(function() { this.disabled = true; }).end().
				filter('img').css({opacity: '0.5', cursor: 'default'});
		}
		else if (nodeName == 'div' || nodeName == 'span') {
			var inline = $target.children('.' + this._inlineClass);
			inline.children().addClass('ui-state-disabled');
			inline.find("select.ui-datepicker-month, select.ui-datepicker-year").
				attr("disabled", "disabled");
		}
		this._disabledInputs = $.map(this._disabledInputs,
			function(value) { return (value == target ? null : value); }); // delete entry
		this._disabledInputs[this._disabledInputs.length] = target;
	},

	/* Is the first field in a jQuery collection disabled as a datepicker?
	   @param  target    element - the target input field or division or span
	   @return boolean - true if disabled, false if enabled */
	_isDisabledDatepicker: function(target) {
		if (!target) {
			return false;
		}
		for (var i = 0; i < this._disabledInputs.length; i++) {
			if (this._disabledInputs[i] == target)
				return true;
		}
		return false;
	},

	/* Retrieve the instance data for the target control.
	   @param  target  element - the target input field or division or span
	   @return  object - the associated instance data
	   @throws  error if a jQuery problem getting data */
	_getInst: function(target) {
		try {
			return $.data(target, PROP_NAME);
		}
		catch (err) {
			throw 'Missing instance data for this datepicker';
		}
	},

	/* Update or retrieve the settings for a date picker attached to an input field or division.
	   @param  target  element - the target input field or division or span
	   @param  name    object - the new settings to update or
	                   string - the name of the setting to change or retrieve,
	                   when retrieving also 'all' for all instance settings or
	                   'defaults' for all global defaults
	   @param  value   any - the new value for the setting
	                   (omit if above is an object or to retrieve a value) */
	_optionDatepicker: function(target, name, value) {
		var inst = this._getInst(target);
		if (arguments.length == 2 && typeof name == 'string') {
			return (name == 'defaults' ? $.extend({}, $.datepicker._defaults) :
				(inst ? (name == 'all' ? $.extend({}, inst.settings) :
				this._get(inst, name)) : null));
		}
		var settings = name || {};
		if (typeof name == 'string') {
			settings = {};
			settings[name] = value;
		}
		if (inst) {
			if (this._curInst == inst) {
				this._hideDatepicker();
			}
			var date = this._getDateDatepicker(target, true);
			var minDate = this._getMinMaxDate(inst, 'min');
			var maxDate = this._getMinMaxDate(inst, 'max');
			extendRemove(inst.settings, settings);
			// reformat the old minDate/maxDate values if dateFormat changes and a new minDate/maxDate isn't provided
			if (minDate !== null && settings['dateFormat'] !== undefined && settings['minDate'] === undefined)
				inst.settings.minDate = this._formatDate(inst, minDate);
			if (maxDate !== null && settings['dateFormat'] !== undefined && settings['maxDate'] === undefined)
				inst.settings.maxDate = this._formatDate(inst, maxDate);
			this._attachments($(target), inst);
			this._autoSize(inst);
			this._setDate(inst, date);
			this._updateAlternate(inst);
			this._updateDatepicker(inst);
		}
	},

	// change method deprecated
	_changeDatepicker: function(target, name, value) {
		this._optionDatepicker(target, name, value);
	},

	/* Redraw the date picker attached to an input field or division.
	   @param  target  element - the target input field or division or span */
	_refreshDatepicker: function(target) {
		var inst = this._getInst(target);
		if (inst) {
			this._updateDatepicker(inst);
		}
	},

	/* Set the dates for a jQuery selection.
	   @param  target   element - the target input field or division or span
	   @param  date     Date - the new date */
	_setDateDatepicker: function(target, date) {
		var inst = this._getInst(target);
		if (inst) {
			this._setDate(inst, date);
			this._updateDatepicker(inst);
			this._updateAlternate(inst);
		}
	},

	/* Get the date(s) for the first entry in a jQuery selection.
	   @param  target     element - the target input field or division or span
	   @param  noDefault  boolean - true if no default date is to be used
	   @return Date - the current date */
	_getDateDatepicker: function(target, noDefault) {
		var inst = this._getInst(target);
		if (inst && !inst.inline)
			this._setDateFromField(inst, noDefault);
		return (inst ? this._getDate(inst) : null);
	},

	/* Handle keystrokes. */
	_doKeyDown: function(event) {
		var inst = $.datepicker._getInst(event.target);
		var handled = true;
		var isRTL = inst.dpDiv.is('.ui-datepicker-rtl');
		inst._keyEvent = true;
		if ($.datepicker._datepickerShowing)
			switch (event.keyCode) {
				case 9: $.datepicker._hideDatepicker();
						handled = false;
						break; // hide on tab out
				case 13: var sel = $('td.' + $.datepicker._dayOverClass + ':not(.' + 
									$.datepicker._currentClass + ')', inst.dpDiv);
						if (sel[0])
							$.datepicker._selectDay(event.target, inst.selectedMonth, inst.selectedYear, sel[0]);
							var onSelect = $.datepicker._get(inst, 'onSelect');
							if (onSelect) {
								var dateStr = $.datepicker._formatDate(inst);

								// trigger custom callback
								onSelect.apply((inst.input ? inst.input[0] : null), [dateStr, inst]);
							}
						else
							$.datepicker._hideDatepicker();
						return false; // don't submit the form
						break; // select the value on enter
				case 27: $.datepicker._hideDatepicker();
						break; // hide on escape
				case 33: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							-$.datepicker._get(inst, 'stepBigMonths') :
							-$.datepicker._get(inst, 'stepMonths')), 'M');
						break; // previous month/year on page up/+ ctrl
				case 34: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							+$.datepicker._get(inst, 'stepBigMonths') :
							+$.datepicker._get(inst, 'stepMonths')), 'M');
						break; // next month/year on page down/+ ctrl
				case 35: if (event.ctrlKey || event.metaKey) $.datepicker._clearDate(event.target);
						handled = event.ctrlKey || event.metaKey;
						break; // clear on ctrl or command +end
				case 36: if (event.ctrlKey || event.metaKey) $.datepicker._gotoToday(event.target);
						handled = event.ctrlKey || event.metaKey;
						break; // current on ctrl or command +home
				case 37: if (event.ctrlKey || event.metaKey) $.datepicker._adjustDate(event.target, (isRTL ? +1 : -1), 'D');
						handled = event.ctrlKey || event.metaKey;
						// -1 day on ctrl or command +left
						if (event.originalEvent.altKey) $.datepicker._adjustDate(event.target, (event.ctrlKey ?
									-$.datepicker._get(inst, 'stepBigMonths') :
									-$.datepicker._get(inst, 'stepMonths')), 'M');
						// next month/year on alt +left on Mac
						break;
				case 38: if (event.ctrlKey || event.metaKey) $.datepicker._adjustDate(event.target, -7, 'D');
						handled = event.ctrlKey || event.metaKey;
						break; // -1 week on ctrl or command +up
				case 39: if (event.ctrlKey || event.metaKey) $.datepicker._adjustDate(event.target, (isRTL ? -1 : +1), 'D');
						handled = event.ctrlKey || event.metaKey;
						// +1 day on ctrl or command +right
						if (event.originalEvent.altKey) $.datepicker._adjustDate(event.target, (event.ctrlKey ?
									+$.datepicker._get(inst, 'stepBigMonths') :
									+$.datepicker._get(inst, 'stepMonths')), 'M');
						// next month/year on alt +right
						break;
				case 40: if (event.ctrlKey || event.metaKey) $.datepicker._adjustDate(event.target, +7, 'D');
						handled = event.ctrlKey || event.metaKey;
						break; // +1 week on ctrl or command +down
				default: handled = false;
			}
		else if (event.keyCode == 36 && event.ctrlKey) // display the date picker on ctrl+home
			$.datepicker._showDatepicker(this);
		else {
			handled = false;
		}
		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
	},

	/* Filter entered characters - based on date format. */
	_doKeyPress: function(event) {
		var inst = $.datepicker._getInst(event.target);
		if ($.datepicker._get(inst, 'constrainInput')) {
			var chars = $.datepicker._possibleChars($.datepicker._get(inst, 'dateFormat'));
			var chr = String.fromCharCode(event.charCode == undefined ? event.keyCode : event.charCode);
			return event.ctrlKey || event.metaKey || (chr < ' ' || !chars || chars.indexOf(chr) > -1);
		}
	},

	/* Synchronise manual entry and field/alternate field. */
	_doKeyUp: function(event) {
		var inst = $.datepicker._getInst(event.target);
		if (inst.input.val() != inst.lastVal) {
			try {
				var date = $.datepicker.parseDate($.datepicker._get(inst, 'dateFormat'),
					(inst.input ? inst.input.val() : null),
					$.datepicker._getFormatConfig(inst));
				if (date) { // only if valid
					$.datepicker._setDateFromField(inst);
					$.datepicker._updateAlternate(inst);
					$.datepicker._updateDatepicker(inst);
				}
			}
			catch (err) {
				$.datepicker.log(err);
			}
		}
		return true;
	},

	/* Pop-up the date picker for a given input field.
       If false returned from beforeShow event handler do not show. 
	   @param  input  element - the input field attached to the date picker or
	                  event - if triggered by focus */
	_showDatepicker: function(input) {
		input = input.target || input;
		if (input.nodeName.toLowerCase() != 'input') // find from button/image trigger
			input = $('input', input.parentNode)[0];
		if ($.datepicker._isDisabledDatepicker(input) || $.datepicker._lastInput == input) // already here
			return;
		var inst = $.datepicker._getInst(input);
		if ($.datepicker._curInst && $.datepicker._curInst != inst) {
			$.datepicker._curInst.dpDiv.stop(true, true);
			if ( inst && $.datepicker._datepickerShowing ) {
				$.datepicker._hideDatepicker( $.datepicker._curInst.input[0] );
			}
		}
		var beforeShow = $.datepicker._get(inst, 'beforeShow');
		var beforeShowSettings = beforeShow ? beforeShow.apply(input, [input, inst]) : {};
		if(beforeShowSettings === false){
            //false
			return;
		}
		extendRemove(inst.settings, beforeShowSettings);
		inst.lastVal = null;
		$.datepicker._lastInput = input;
		$.datepicker._setDateFromField(inst);
		if ($.datepicker._inDialog) // hide cursor
			input.value = '';
		if (!$.datepicker._pos) { // position below input
			$.datepicker._pos = $.datepicker._findPos(input);
			$.datepicker._pos[1] += input.offsetHeight; // add the height
		}
		var isFixed = false;
		$(input).parents().each(function() {
			isFixed |= $(this).css('position') == 'fixed';
			return !isFixed;
		});
		if (isFixed && $.browser.opera) { // correction for Opera when fixed and scrolled
			$.datepicker._pos[0] -= document.documentElement.scrollLeft;
			$.datepicker._pos[1] -= document.documentElement.scrollTop;
		}
		var offset = {left: $.datepicker._pos[0], top: $.datepicker._pos[1]};
		$.datepicker._pos = null;
		//to avoid flashes on Firefox
		inst.dpDiv.empty();
		// determine sizing offscreen
		inst.dpDiv.css({position: 'absolute', display: 'block', top: '-1000px'});
		$.datepicker._updateDatepicker(inst);
		// fix width for dynamic number of date pickers
		// and adjust position before showing
		offset = $.datepicker._checkOffset(inst, offset, isFixed);
		inst.dpDiv.css({position: ($.datepicker._inDialog && $.blockUI ?
			'static' : (isFixed ? 'fixed' : 'absolute')), display: 'none',
			left: offset.left + 'px', top: offset.top + 'px'});
		if (!inst.inline) {
			var showAnim = $.datepicker._get(inst, 'showAnim');
			var duration = $.datepicker._get(inst, 'duration');
			var postProcess = function() {
				var cover = inst.dpDiv.find('iframe.ui-datepicker-cover'); // IE6- only
				if( !! cover.length ){
					var borders = $.datepicker._getBorders(inst.dpDiv);
					cover.css({left: -borders[0], top: -borders[1],
						width: inst.dpDiv.outerWidth(), height: inst.dpDiv.outerHeight()});
				}
			};
			inst.dpDiv.zIndex($(input).zIndex()+1);
			$.datepicker._datepickerShowing = true;
			if ($.effects && $.effects[showAnim])
				inst.dpDiv.show(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
			else
				inst.dpDiv[showAnim || 'show']((showAnim ? duration : null), postProcess);
			if (!showAnim || !duration)
				postProcess();
			if (inst.input.is(':visible') && !inst.input.is(':disabled'))
				inst.input.focus();
			$.datepicker._curInst = inst;
		}
	},

	/* Generate the date picker content. */
	_updateDatepicker: function(inst) {
		var self = this;
		self.maxRows = 4; //Reset the max number of rows being displayed (see #7043)
		var borders = $.datepicker._getBorders(inst.dpDiv);
		instActive = inst; // for delegate hover events
		inst.dpDiv.empty().append(this._generateHTML(inst));
		this._attachHandlers(inst);
		var cover = inst.dpDiv.find('iframe.ui-datepicker-cover'); // IE6- only
		if( !!cover.length ){ //avoid call to outerXXXX() when not in IE6
			cover.css({left: -borders[0], top: -borders[1], width: inst.dpDiv.outerWidth(), height: inst.dpDiv.outerHeight()})
		}
		inst.dpDiv.find('.' + this._dayOverClass + ' a').mouseover();
		var numMonths = this._getNumberOfMonths(inst);
		var cols = numMonths[1];
		var width = 17;
		inst.dpDiv.removeClass('ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4').width('');
		if (cols > 1)
			inst.dpDiv.addClass('ui-datepicker-multi-' + cols).css('width', (width * cols) + 'em');
		inst.dpDiv[(numMonths[0] != 1 || numMonths[1] != 1 ? 'add' : 'remove') +
			'Class']('ui-datepicker-multi');
		inst.dpDiv[(this._get(inst, 'isRTL') ? 'add' : 'remove') +
			'Class']('ui-datepicker-rtl');
		if (inst == $.datepicker._curInst && $.datepicker._datepickerShowing && inst.input &&
				// #6694 - don't focus the input if it's already focused
				// this breaks the change event in IE
				inst.input.is(':visible') && !inst.input.is(':disabled') && inst.input[0] != document.activeElement)
			inst.input.focus();
		// deffered render of the years select (to avoid flashes on Firefox) 
		if( inst.yearshtml ){
			var origyearshtml = inst.yearshtml;
			setTimeout(function(){
				//assure that inst.yearshtml didn't change.
				if( origyearshtml === inst.yearshtml && inst.yearshtml ){
					inst.dpDiv.find('select.ui-datepicker-year:first').replaceWith(inst.yearshtml);
				}
				origyearshtml = inst.yearshtml = null;
			}, 0);
		}
	},

	/* Retrieve the size of left and top borders for an element.
	   @param  elem  (jQuery object) the element of interest
	   @return  (number[2]) the left and top borders */
	_getBorders: function(elem) {
		var convert = function(value) {
			return {thin: 1, medium: 2, thick: 3}[value] || value;
		};
		return [parseFloat(convert(elem.css('border-left-width'))),
			parseFloat(convert(elem.css('border-top-width')))];
	},

	/* Check positioning to remain on screen. */
	_checkOffset: function(inst, offset, isFixed) {
		var dpWidth = inst.dpDiv.outerWidth();
		var dpHeight = inst.dpDiv.outerHeight();
		var inputWidth = inst.input ? inst.input.outerWidth() : 0;
		var inputHeight = inst.input ? inst.input.outerHeight() : 0;
		var viewWidth = document.documentElement.clientWidth + (isFixed ? 0 : $(document).scrollLeft());
		var viewHeight = document.documentElement.clientHeight + (isFixed ? 0 : $(document).scrollTop());

		offset.left -= (this._get(inst, 'isRTL') ? (dpWidth - inputWidth) : 0);
		offset.left -= (isFixed && offset.left == inst.input.offset().left) ? $(document).scrollLeft() : 0;
		offset.top -= (isFixed && offset.top == (inst.input.offset().top + inputHeight)) ? $(document).scrollTop() : 0;

		// now check if datepicker is showing outside window viewport - move to a better place if so.
		offset.left -= Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
			Math.abs(offset.left + dpWidth - viewWidth) : 0);
		offset.top -= Math.min(offset.top, (offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
			Math.abs(dpHeight + inputHeight) : 0);

		return offset;
	},

	/* Find an object's position on the screen. */
	_findPos: function(obj) {
		var inst = this._getInst(obj);
		var isRTL = this._get(inst, 'isRTL');
        while (obj && (obj.type == 'hidden' || obj.nodeType != 1 || $.expr.filters.hidden(obj))) {
            obj = obj[isRTL ? 'previousSibling' : 'nextSibling'];
        }
        var position = $(obj).offset();
	    return [position.left, position.top];
	},

	/* Hide the date picker from view.
	   @param  input  element - the input field attached to the date picker */
	_hideDatepicker: function(input) {
		var inst = this._curInst;
		if (!inst || (input && inst != $.data(input, PROP_NAME)))
			return;
		if (this._datepickerShowing) {
			var showAnim = this._get(inst, 'showAnim');
			var duration = this._get(inst, 'duration');
			var postProcess = function() {
				$.datepicker._tidyDialog(inst);
			};
			if ($.effects && $.effects[showAnim])
				inst.dpDiv.hide(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
			else
				inst.dpDiv[(showAnim == 'slideDown' ? 'slideUp' :
					(showAnim == 'fadeIn' ? 'fadeOut' : 'hide'))]((showAnim ? duration : null), postProcess);
			if (!showAnim)
				postProcess();
			this._datepickerShowing = false;
			var onClose = this._get(inst, 'onClose');
			if (onClose)
				onClose.apply((inst.input ? inst.input[0] : null),
					[(inst.input ? inst.input.val() : ''), inst]);
			this._lastInput = null;
			if (this._inDialog) {
				this._dialogInput.css({ position: 'absolute', left: '0', top: '-100px' });
				if ($.blockUI) {
					$.unblockUI();
					$('body').append(this.dpDiv);
				}
			}
			this._inDialog = false;
		}
	},

	/* Tidy up after a dialog display. */
	_tidyDialog: function(inst) {
		inst.dpDiv.removeClass(this._dialogClass).unbind('.ui-datepicker-calendar');
	},

	/* Close date picker if clicked elsewhere. */
	_checkExternalClick: function(event) {
		if (!$.datepicker._curInst)
			return;

		var $target = $(event.target),
			inst = $.datepicker._getInst($target[0]);

		if ( ( ( $target[0].id != $.datepicker._mainDivId &&
				$target.parents('#' + $.datepicker._mainDivId).length == 0 &&
				!$target.hasClass($.datepicker.markerClassName) &&
				!$target.closest("." + $.datepicker._triggerClass).length &&
				$.datepicker._datepickerShowing && !($.datepicker._inDialog && $.blockUI) ) ) ||
			( $target.hasClass($.datepicker.markerClassName) && $.datepicker._curInst != inst ) )
			$.datepicker._hideDatepicker();
	},

	/* Adjust one of the date sub-fields. */
	_adjustDate: function(id, offset, period) {
		var target = $(id);
		var inst = this._getInst(target[0]);
		if (this._isDisabledDatepicker(target[0])) {
			return;
		}
		this._adjustInstDate(inst, offset +
			(period == 'M' ? this._get(inst, 'showCurrentAtPos') : 0), // undo positioning
			period);
		this._updateDatepicker(inst);
	},

	/* Action for current link. */
	_gotoToday: function(id) {
		var target = $(id);
		var inst = this._getInst(target[0]);
		if (this._get(inst, 'gotoCurrent') && inst.currentDay) {
			inst.selectedDay = inst.currentDay;
			inst.drawMonth = inst.selectedMonth = inst.currentMonth;
			inst.drawYear = inst.selectedYear = inst.currentYear;
		}
		else {
			var date = new Date();
			inst.selectedDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = date.getFullYear();
		}
		this._notifyChange(inst);
		this._adjustDate(target);
	},

	/* Action for selecting a new month/year. */
	_selectMonthYear: function(id, select, period) {
		var target = $(id);
		var inst = this._getInst(target[0]);
		inst['selected' + (period == 'M' ? 'Month' : 'Year')] =
		inst['draw' + (period == 'M' ? 'Month' : 'Year')] =
			parseInt(select.options[select.selectedIndex].value,10);
		this._notifyChange(inst);
		this._adjustDate(target);
	},

	/* Action for selecting a day. */
	_selectDay: function(id, month, year, td) {
		var target = $(id);
		if ($(td).hasClass(this._unselectableClass) || this._isDisabledDatepicker(target[0])) {
			return;
		}
		var inst = this._getInst(target[0]);
		inst.selectedDay = inst.currentDay = $('a', td).html();
		inst.selectedMonth = inst.currentMonth = month;
		inst.selectedYear = inst.currentYear = year;
		this._selectDate(id, this._formatDate(inst,
			inst.currentDay, inst.currentMonth, inst.currentYear));
	},

	/* Erase the input field and hide the date picker. */
	_clearDate: function(id) {
		var target = $(id);
		var inst = this._getInst(target[0]);
		this._selectDate(target, '');
	},

	/* Update the input field with the selected date. */
	_selectDate: function(id, dateStr) {
		var target = $(id);
		var inst = this._getInst(target[0]);
		dateStr = (dateStr != null ? dateStr : this._formatDate(inst));
		if (inst.input)
			inst.input.val(dateStr);
		this._updateAlternate(inst);
		var onSelect = this._get(inst, 'onSelect');
		if (onSelect)
			onSelect.apply((inst.input ? inst.input[0] : null), [dateStr, inst]);  // trigger custom callback
		else if (inst.input)
			inst.input.trigger('change'); // fire the change event
		if (inst.inline)
			this._updateDatepicker(inst);
		else {
			this._hideDatepicker();
			this._lastInput = inst.input[0];
			if (typeof(inst.input[0]) != 'object')
				inst.input.focus(); // restore focus
			this._lastInput = null;
		}
	},

	/* Update any alternate field to synchronise with the main field. */
	_updateAlternate: function(inst) {
		var altField = this._get(inst, 'altField');
		if (altField) { // update alternate field too
			var altFormat = this._get(inst, 'altFormat') || this._get(inst, 'dateFormat');
			var date = this._getDate(inst);
			var dateStr = this.formatDate(altFormat, date, this._getFormatConfig(inst));
			$(altField).each(function() { $(this).val(dateStr); });
		}
	},

	/* Set as beforeShowDay function to prevent selection of weekends.
	   @param  date  Date - the date to customise
	   @return [boolean, string] - is this date selectable?, what is its CSS class? */
	noWeekends: function(date) {
		var day = date.getDay();
		return [(day > 0 && day < 6), ''];
	},

	/* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
	   @param  date  Date - the date to get the week for
	   @return  number - the number of the week within the year that contains this date */
	iso8601Week: function(date) {
		var checkDate = new Date(date.getTime());
		// Find Thursday of this week starting on Monday
		checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
		var time = checkDate.getTime();
		checkDate.setMonth(0); // Compare with Jan 1
		checkDate.setDate(1);
		return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
	},

	/* Parse a string value into a date object.
	   See formatDate below for the possible formats.

	   @param  format    string - the expected format of the date
	   @param  value     string - the date in the above format
	   @param  settings  Object - attributes include:
	                     shortYearCutoff  number - the cutoff year for determining the century (optional)
	                     dayNamesShort    string[7] - abbreviated names of the days from Sunday (optional)
	                     dayNames         string[7] - names of the days from Sunday (optional)
	                     monthNamesShort  string[12] - abbreviated names of the months (optional)
	                     monthNames       string[12] - names of the months (optional)
	   @return  Date - the extracted date value or null if value is blank */
	parseDate: function (format, value, settings) {
		if (format == null || value == null)
			throw 'Invalid arguments';
		value = (typeof value == 'object' ? value.toString() : value + '');
		if (value == '')
			return null;
		var shortYearCutoff = (settings ? settings.shortYearCutoff : null) || this._defaults.shortYearCutoff;
		shortYearCutoff = (typeof shortYearCutoff != 'string' ? shortYearCutoff :
				new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
		var dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort;
		var dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames;
		var monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort;
		var monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames;
		var year = -1;
		var month = -1;
		var day = -1;
		var doy = -1;
		var literal = false;
		// Check whether a format character is doubled
		var lookAhead = function(match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
			if (matches)
				iFormat++;
			return matches;
		};
		// Extract a number from the string value
		var getNumber = function(match) {
			var isDoubled = lookAhead(match);
			var size = (match == '@' ? 14 : (match == '!' ? 20 :
				(match == 'y' && isDoubled ? 4 : (match == 'o' ? 3 : 2))));
			var digits = new RegExp('^\\d{1,' + size + '}');
			var num = value.substring(iValue).match(digits);
			if (!num)
				throw 'Missing number at position ' + iValue;
			iValue += num[0].length;
			return parseInt(num[0], 10);
		};
		// Extract a name from the string value and convert to an index
		var getName = function(match, shortNames, longNames) {
			var names = $.map(lookAhead(match) ? longNames : shortNames, function (v, k) {
				return [ [k, v] ];
			}).sort(function (a, b) {
				return -(a[1].length - b[1].length);
			});
			var index = -1;
			$.each(names, function (i, pair) {
				var name = pair[1];
				if (value.substr(iValue, name.length).toLowerCase() == name.toLowerCase()) {
					index = pair[0];
					iValue += name.length;
					return false;
				}
			});
			if (index != -1)
				return index + 1;
			else
				throw 'Unknown name at position ' + iValue;
		};
		// Confirm that a literal character matches the string value
		var checkLiteral = function() {
			if (value.charAt(iValue) != format.charAt(iFormat))
				throw 'Unexpected literal at position ' + iValue;
			iValue++;
		};
		var iValue = 0;
		for (var iFormat = 0; iFormat < format.length; iFormat++) {
			if (literal)
				if (format.charAt(iFormat) == "'" && !lookAhead("'"))
					literal = false;
				else
					checkLiteral();
			else
				switch (format.charAt(iFormat)) {
					case 'd':
						day = getNumber('d');
						break;
					case 'D':
						getName('D', dayNamesShort, dayNames);
						break;
					case 'o':
						doy = getNumber('o');
						break;
					case 'm':
						month = getNumber('m');
						break;
					case 'M':
						month = getName('M', monthNamesShort, monthNames);
						break;
					case 'y':
						year = getNumber('y');
						break;
					case '@':
						var date = new Date(getNumber('@'));
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case '!':
						var date = new Date((getNumber('!') - this._ticksTo1970) / 10000);
						year = date.getFullYear();
						month = date.getMonth() + 1;
						day = date.getDate();
						break;
					case "'":
						if (lookAhead("'"))
							checkLiteral();
						else
							literal = true;
						break;
					default:
						checkLiteral();
				}
		}
		if (iValue < value.length){
			throw "Extra/unparsed characters found in date: " + value.substring(iValue);
		}
		if (year == -1)
			year = new Date().getFullYear();
		else if (year < 100)
			year += new Date().getFullYear() - new Date().getFullYear() % 100 +
				(year <= shortYearCutoff ? 0 : -100);
		if (doy > -1) {
			month = 1;
			day = doy;
			do {
				var dim = this._getDaysInMonth(year, month - 1);
				if (day <= dim)
					break;
				month++;
				day -= dim;
			} while (true);
		}
		var date = this._daylightSavingAdjust(new Date(year, month - 1, day));
		if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day)
			throw 'Invalid date'; // E.g. 31/02/00
		return date;
	},

	/* Standard date formats. */
	ATOM: 'yy-mm-dd', // RFC 3339 (ISO 8601)
	COOKIE: 'D, dd M yy',
	ISO_8601: 'yy-mm-dd',
	RFC_822: 'D, d M y',
	RFC_850: 'DD, dd-M-y',
	RFC_1036: 'D, d M y',
	RFC_1123: 'D, d M yy',
	RFC_2822: 'D, d M yy',
	RSS: 'D, d M y', // RFC 822
	TICKS: '!',
	TIMESTAMP: '@',
	W3C: 'yy-mm-dd', // ISO 8601

	_ticksTo1970: (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
		Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000),

	/* Format a date object into a string value.
	   The format can be combinations of the following:
	   d  - day of month (no leading zero)
	   dd - day of month (two digit)
	   o  - day of year (no leading zeros)
	   oo - day of year (three digit)
	   D  - day name short
	   DD - day name long
	   m  - month of year (no leading zero)
	   mm - month of year (two digit)
	   M  - month name short
	   MM - month name long
	   y  - year (two digit)
	   yy - year (four digit)
	   @ - Unix timestamp (ms since 01/01/1970)
	   ! - Windows ticks (100ns since 01/01/0001)
	   '...' - literal text
	   '' - single quote

	   @param  format    string - the desired format of the date
	   @param  date      Date - the date value to format
	   @param  settings  Object - attributes include:
	                     dayNamesShort    string[7] - abbreviated names of the days from Sunday (optional)
	                     dayNames         string[7] - names of the days from Sunday (optional)
	                     monthNamesShort  string[12] - abbreviated names of the months (optional)
	                     monthNames       string[12] - names of the months (optional)
	   @return  string - the date in the above format */
	formatDate: function (format, date, settings) {
		if (!date)
			return '';
		var dayNamesShort = (settings ? settings.dayNamesShort : null) || this._defaults.dayNamesShort;
		var dayNames = (settings ? settings.dayNames : null) || this._defaults.dayNames;
		var monthNamesShort = (settings ? settings.monthNamesShort : null) || this._defaults.monthNamesShort;
		var monthNames = (settings ? settings.monthNames : null) || this._defaults.monthNames;
		// Check whether a format character is doubled
		var lookAhead = function(match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
			if (matches)
				iFormat++;
			return matches;
		};
		// Format a number, with leading zero if necessary
		var formatNumber = function(match, value, len) {
			var num = '' + value;
			if (lookAhead(match))
				while (num.length < len)
					num = '0' + num;
			return num;
		};
		// Format a name, short or long as requested
		var formatName = function(match, value, shortNames, longNames) {
			return (lookAhead(match) ? longNames[value] : shortNames[value]);
		};
		var output = '';
		var literal = false;
		if (date)
			for (var iFormat = 0; iFormat < format.length; iFormat++) {
				if (literal)
					if (format.charAt(iFormat) == "'" && !lookAhead("'"))
						literal = false;
					else
						output += format.charAt(iFormat);
				else
					switch (format.charAt(iFormat)) {
						case 'd':
							output += formatNumber('d', date.getDate(), 2);
							break;
						case 'D':
							output += formatName('D', date.getDay(), dayNamesShort, dayNames);
							break;
						case 'o':
							output += formatNumber('o',
								Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
							break;
						case 'm':
							output += formatNumber('m', date.getMonth() + 1, 2);
							break;
						case 'M':
							output += formatName('M', date.getMonth(), monthNamesShort, monthNames);
							break;
						case 'y':
							output += (lookAhead('y') ? date.getFullYear() :
								(date.getYear() % 100 < 10 ? '0' : '') + date.getYear() % 100);
							break;
						case '@':
							output += date.getTime();
							break;
						case '!':
							output += date.getTime() * 10000 + this._ticksTo1970;
							break;
						case "'":
							if (lookAhead("'"))
								output += "'";
							else
								literal = true;
							break;
						default:
							output += format.charAt(iFormat);
					}
			}
		return output;
	},

	/* Extract all possible characters from the date format. */
	_possibleChars: function (format) {
		var chars = '';
		var literal = false;
		// Check whether a format character is doubled
		var lookAhead = function(match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
			if (matches)
				iFormat++;
			return matches;
		};
		for (var iFormat = 0; iFormat < format.length; iFormat++)
			if (literal)
				if (format.charAt(iFormat) == "'" && !lookAhead("'"))
					literal = false;
				else
					chars += format.charAt(iFormat);
			else
				switch (format.charAt(iFormat)) {
					case 'd': case 'm': case 'y': case '@':
						chars += '0123456789';
						break;
					case 'D': case 'M':
						return null; // Accept anything
					case "'":
						if (lookAhead("'"))
							chars += "'";
						else
							literal = true;
						break;
					default:
						chars += format.charAt(iFormat);
				}
		return chars;
	},

	/* Get a setting value, defaulting if necessary. */
	_get: function(inst, name) {
		return inst.settings[name] !== undefined ?
			inst.settings[name] : this._defaults[name];
	},

	/* Parse existing date and initialise date picker. */
	_setDateFromField: function(inst, noDefault) {
		if (inst.input.val() == inst.lastVal) {
			return;
		}
		var dateFormat = this._get(inst, 'dateFormat');
		var dates = inst.lastVal = inst.input ? inst.input.val() : null;
		var date, defaultDate;
		date = defaultDate = this._getDefaultDate(inst);
		var settings = this._getFormatConfig(inst);
		try {
			date = this.parseDate(dateFormat, dates, settings) || defaultDate;
		} catch (event) {
			this.log(event);
			dates = (noDefault ? '' : dates);
		}
		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		inst.currentDay = (dates ? date.getDate() : 0);
		inst.currentMonth = (dates ? date.getMonth() : 0);
		inst.currentYear = (dates ? date.getFullYear() : 0);
		this._adjustInstDate(inst);
	},

	/* Retrieve the default date shown on opening. */
	_getDefaultDate: function(inst) {
		return this._restrictMinMax(inst,
			this._determineDate(inst, this._get(inst, 'defaultDate'), new Date()));
	},

	/* A date may be specified as an exact value or a relative one. */
	_determineDate: function(inst, date, defaultDate) {
		var offsetNumeric = function(offset) {
			var date = new Date();
			date.setDate(date.getDate() + offset);
			return date;
		};
		var offsetString = function(offset) {
			try {
				return $.datepicker.parseDate($.datepicker._get(inst, 'dateFormat'),
					offset, $.datepicker._getFormatConfig(inst));
			}
			catch (e) {
				// Ignore
			}
			var date = (offset.toLowerCase().match(/^c/) ?
				$.datepicker._getDate(inst) : null) || new Date();
			var year = date.getFullYear();
			var month = date.getMonth();
			var day = date.getDate();
			var pattern = /([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
			var matches = pattern.exec(offset);
			while (matches) {
				switch (matches[2] || 'd') {
					case 'd' : case 'D' :
						day += parseInt(matches[1],10); break;
					case 'w' : case 'W' :
						day += parseInt(matches[1],10) * 7; break;
					case 'm' : case 'M' :
						month += parseInt(matches[1],10);
						day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
						break;
					case 'y': case 'Y' :
						year += parseInt(matches[1],10);
						day = Math.min(day, $.datepicker._getDaysInMonth(year, month));
						break;
				}
				matches = pattern.exec(offset);
			}
			return new Date(year, month, day);
		};
		var newDate = (date == null || date === '' ? defaultDate : (typeof date == 'string' ? offsetString(date) :
			(typeof date == 'number' ? (isNaN(date) ? defaultDate : offsetNumeric(date)) : new Date(date.getTime()))));
		newDate = (newDate && newDate.toString() == 'Invalid Date' ? defaultDate : newDate);
		if (newDate) {
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setSeconds(0);
			newDate.setMilliseconds(0);
		}
		return this._daylightSavingAdjust(newDate);
	},

	/* Handle switch to/from daylight saving.
	   Hours may be non-zero on daylight saving cut-over:
	   > 12 when midnight changeover, but then cannot generate
	   midnight datetime, so jump to 1AM, otherwise reset.
	   @param  date  (Date) the date to check
	   @return  (Date) the corrected date */
	_daylightSavingAdjust: function(date) {
		if (!date) return null;
		date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
		return date;
	},

	/* Set the date(s) directly. */
	_setDate: function(inst, date, noChange) {
		var clear = !date;
		var origMonth = inst.selectedMonth;
		var origYear = inst.selectedYear;
		var newDate = this._restrictMinMax(inst, this._determineDate(inst, date, new Date()));
		inst.selectedDay = inst.currentDay = newDate.getDate();
		inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
		inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
		if ((origMonth != inst.selectedMonth || origYear != inst.selectedYear) && !noChange)
			this._notifyChange(inst);
		this._adjustInstDate(inst);
		if (inst.input) {
			inst.input.val(clear ? '' : this._formatDate(inst));
		}
	},

	/* Retrieve the date(s) directly. */
	_getDate: function(inst) {
		var startDate = (!inst.currentYear || (inst.input && inst.input.val() == '') ? null :
			this._daylightSavingAdjust(new Date(
			inst.currentYear, inst.currentMonth, inst.currentDay)));
			return startDate;
	},

	/* Attach the onxxx handlers.  These are declared statically so
	 * they work with static code transformers like Caja.
	 */
	_attachHandlers: function(inst) {
		var stepMonths = this._get(inst, 'stepMonths');
		var id = '#' + inst.id;
		inst.dpDiv.find('[data-handler]').map(function () {
			var handler = {
				prev: function () {
					window['DP_jQuery_' + dpuuid].datepicker._adjustDate(id, -stepMonths, 'M');
				},
				next: function () {
					window['DP_jQuery_' + dpuuid].datepicker._adjustDate(id, +stepMonths, 'M');
				},
				hide: function () {
					window['DP_jQuery_' + dpuuid].datepicker._hideDatepicker();
				},
				today: function () {
					window['DP_jQuery_' + dpuuid].datepicker._gotoToday(id);
				},
				//eturino clear function
				clear: function () {
					window['DP_jQuery_' + dpuuid].datepicker._clearDate(id);
				},
				selectDay: function () {
					window['DP_jQuery_' + dpuuid].datepicker._selectDay(id, +this.getAttribute('data-month'), +this.getAttribute('data-year'), this);
					return false;
				},
				selectMonth: function () {
					window['DP_jQuery_' + dpuuid].datepicker._selectMonthYear(id, this, 'M');
					return false;
				},
				selectYear: function () {
					window['DP_jQuery_' + dpuuid].datepicker._selectMonthYear(id, this, 'Y');
					return false;
				}
			};
			$(this).bind(this.getAttribute('data-event'), handler[this.getAttribute('data-handler')]);
		});
	},
	
	/* Generate the HTML for the current state of the date picker. */
	_generateHTML: function(inst) {
		var today = new Date();
		today = this._daylightSavingAdjust(
			new Date(today.getFullYear(), today.getMonth(), today.getDate())); // clear time
		var isRTL = this._get(inst, 'isRTL');
		var showButtonPanel = this._get(inst, 'showButtonPanel');
		var hideIfNoPrevNext = this._get(inst, 'hideIfNoPrevNext');
		var navigationAsDateFormat = this._get(inst, 'navigationAsDateFormat');
		var numMonths = this._getNumberOfMonths(inst);
		var showCurrentAtPos = this._get(inst, 'showCurrentAtPos');
		var stepMonths = this._get(inst, 'stepMonths');
		var isMultiMonth = (numMonths[0] != 1 || numMonths[1] != 1);
		var currentDate = this._daylightSavingAdjust((!inst.currentDay ? new Date(9999, 9, 9) :
			new Date(inst.currentYear, inst.currentMonth, inst.currentDay)));
		var minDate = this._getMinMaxDate(inst, 'min');
		var maxDate = this._getMinMaxDate(inst, 'max');
		var drawMonth = inst.drawMonth - showCurrentAtPos;
		var drawYear = inst.drawYear;
		if (drawMonth < 0) {
			drawMonth += 12;
			drawYear--;
		}
		if (maxDate) {
			var maxDraw = this._daylightSavingAdjust(new Date(maxDate.getFullYear(),
				maxDate.getMonth() - (numMonths[0] * numMonths[1]) + 1, maxDate.getDate()));
			maxDraw = (minDate && maxDraw < minDate ? minDate : maxDraw);
			while (this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
				drawMonth--;
				if (drawMonth < 0) {
					drawMonth = 11;
					drawYear--;
				}
			}
		}
		inst.drawMonth = drawMonth;
		inst.drawYear = drawYear;
		var prevText = this._get(inst, 'prevText');
		prevText = (!navigationAsDateFormat ? prevText : this.formatDate(prevText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth - stepMonths, 1)),
			this._getFormatConfig(inst)));
		var prev = (this._canAdjustMonth(inst, -1, drawYear, drawMonth) ?
			'<a class="ui-datepicker-prev ui-corner-all" data-handler="prev" data-event="click"' +
			' title="' + prevText + '"><span class="ui-icon ui-icon-circle-triangle-' + ( isRTL ? 'e' : 'w') + '">' + prevText + '</span></a>' :
			(hideIfNoPrevNext ? '' : '<a class="ui-datepicker-prev ui-corner-all ui-state-disabled" title="'+ prevText +'"><span class="ui-icon ui-icon-circle-triangle-' + ( isRTL ? 'e' : 'w') + '">' + prevText + '</span></a>'));
		var nextText = this._get(inst, 'nextText');
		nextText = (!navigationAsDateFormat ? nextText : this.formatDate(nextText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth + stepMonths, 1)),
			this._getFormatConfig(inst)));
		var next = (this._canAdjustMonth(inst, +1, drawYear, drawMonth) ?
			'<a class="ui-datepicker-next ui-corner-all" data-handler="next" data-event="click"' +
			' title="' + nextText + '"><span class="ui-icon ui-icon-circle-triangle-' + ( isRTL ? 'w' : 'e') + '">' + nextText + '</span></a>' :
			(hideIfNoPrevNext ? '' : '<a class="ui-datepicker-next ui-corner-all ui-state-disabled" title="'+ nextText + '"><span class="ui-icon ui-icon-circle-triangle-' + ( isRTL ? 'w' : 'e') + '">' + nextText + '</span></a>'));
		//eturino clear function
		var clearText = this._get(inst, "clearText");
		var currentText = this._get(inst, 'currentText');
		var gotoDate = (this._get(inst, 'gotoCurrent') && inst.currentDay ? currentDate : today);
		currentText = (!navigationAsDateFormat ? currentText :
			this.formatDate(currentText, gotoDate, this._getFormatConfig(inst)));
		var controls = (!inst.inline ? '<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" data-handler="hide" data-event="click">' +
			this._get(inst, 'closeText') + '</button>' : '');
		//eturino modifico para el CLEAR
//		var buttonPanel = (showButtonPanel) ? '<div class="ui-datepicker-buttonpane ui-widget-content">' + (isRTL ? controls : '') +
//			(this._isInRange(inst, gotoDate) ? '<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="today" data-event="click"' +
//			'>' + currentText + '</button>' : '') + (isRTL ? '' : controls) + '</div>' : '';
		var buttonPanel = (showButtonPanel) ? '<div class="ui-datepicker-buttonpane ui-widget-content">' + (isRTL ? controls : '') +
				(this._isInRange(inst, gotoDate) ? '<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="today" data-event="click"' +
						'>' + currentText + '</button>' : '') + ('<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="clear" data-event="click"' +
						'>' + clearText + '</button>') + (isRTL ? '' : controls) + '</div>' : '';
		var firstDay = parseInt(this._get(inst, 'firstDay'),10);
		firstDay = (isNaN(firstDay) ? 0 : firstDay);
		var showWeek = this._get(inst, 'showWeek');
		var dayNames = this._get(inst, 'dayNames');
		var dayNamesShort = this._get(inst, 'dayNamesShort');
		var dayNamesMin = this._get(inst, 'dayNamesMin');
		var monthNames = this._get(inst, 'monthNames');
		var monthNamesShort = this._get(inst, 'monthNamesShort');
		var beforeShowDay = this._get(inst, 'beforeShowDay');
		var showOtherMonths = this._get(inst, 'showOtherMonths');
		var selectOtherMonths = this._get(inst, 'selectOtherMonths');
		var calculateWeek = this._get(inst, 'calculateWeek') || this.iso8601Week;
		var defaultDate = this._getDefaultDate(inst);
		var html = '';
		for (var row = 0; row < numMonths[0]; row++) {
			var group = '';
			this.maxRows = 4;
			for (var col = 0; col < numMonths[1]; col++) {
				var selectedDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));
				var cornerClass = ' ui-corner-all';
				var calender = '';
				if (isMultiMonth) {
					calender += '<div class="ui-datepicker-group';
					if (numMonths[1] > 1)
						switch (col) {
							case 0: calender += ' ui-datepicker-group-first';
								cornerClass = ' ui-corner-' + (isRTL ? 'right' : 'left'); break;
							case numMonths[1]-1: calender += ' ui-datepicker-group-last';
								cornerClass = ' ui-corner-' + (isRTL ? 'left' : 'right'); break;
							default: calender += ' ui-datepicker-group-middle'; cornerClass = ''; break;
						}
					calender += '">';
				}
				calender += '<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix' + cornerClass + '">' +
					(/all|left/.test(cornerClass) && row == 0 ? (isRTL ? next : prev) : '') +
					(/all|right/.test(cornerClass) && row == 0 ? (isRTL ? prev : next) : '') +
					this._generateMonthYearHeader(inst, drawMonth, drawYear, minDate, maxDate,
					row > 0 || col > 0, monthNames, monthNamesShort) + // draw month headers
					'</div><table class="ui-datepicker-calendar"><thead>' +
					'<tr>';
				var thead = (showWeek ? '<th class="ui-datepicker-week-col">' + this._get(inst, 'weekHeader') + '</th>' : '');
				for (var dow = 0; dow < 7; dow++) { // days of the week
					var day = (dow + firstDay) % 7;
					thead += '<th' + ((dow + firstDay + 6) % 7 >= 5 ? ' class="ui-datepicker-week-end"' : '') + '>' +
						'<span title="' + dayNames[day] + '">' + dayNamesMin[day] + '</span></th>';
				}
				calender += thead + '</tr></thead><tbody>';
				var daysInMonth = this._getDaysInMonth(drawYear, drawMonth);
				if (drawYear == inst.selectedYear && drawMonth == inst.selectedMonth)
					inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
				var leadDays = (this._getFirstDayOfMonth(drawYear, drawMonth) - firstDay + 7) % 7;
				var curRows = Math.ceil((leadDays + daysInMonth) / 7); // calculate the number of rows to generate
				var numRows = (isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows); //If multiple months, use the higher number of rows (see #7043)
				this.maxRows = numRows;
				var printDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));
				for (var dRow = 0; dRow < numRows; dRow++) { // create date picker rows
					calender += '<tr>';
					var tbody = (!showWeek ? '' : '<td class="ui-datepicker-week-col">' +
						this._get(inst, 'calculateWeek')(printDate) + '</td>');
					for (var dow = 0; dow < 7; dow++) { // create date picker days
						var daySettings = (beforeShowDay ?
							beforeShowDay.apply((inst.input ? inst.input[0] : null), [printDate]) : [true, '']);
						var otherMonth = (printDate.getMonth() != drawMonth);
						var unselectable = (otherMonth && !selectOtherMonths) || !daySettings[0] ||
							(minDate && printDate < minDate) || (maxDate && printDate > maxDate);
						tbody += '<td class="' +
							((dow + firstDay + 6) % 7 >= 5 ? ' ui-datepicker-week-end' : '') + // highlight weekends
							(otherMonth ? ' ui-datepicker-other-month' : '') + // highlight days from other months
							((printDate.getTime() == selectedDate.getTime() && drawMonth == inst.selectedMonth && inst._keyEvent) || // user pressed key
							(defaultDate.getTime() == printDate.getTime() && defaultDate.getTime() == selectedDate.getTime()) ?
							// or defaultDate is current printedDate and defaultDate is selectedDate
							' ' + this._dayOverClass : '') + // highlight selected day
							(unselectable ? ' ' + this._unselectableClass + ' ui-state-disabled': '') +  // highlight unselectable days
							(otherMonth && !showOtherMonths ? '' : ' ' + daySettings[1] + // highlight custom dates
							(printDate.getTime() == currentDate.getTime() ? ' ' + this._currentClass : '') + // highlight selected day
							(printDate.getTime() == today.getTime() ? ' ui-datepicker-today' : '')) + '"' + // highlight today (if different)
							((!otherMonth || showOtherMonths) && daySettings[2] ? ' title="' + daySettings[2] + '"' : '') + // cell title
							(unselectable ? '' : ' data-handler="selectDay" data-event="click" data-month="' + printDate.getMonth() + '" data-year="' + printDate.getFullYear() + '"') + '>' + // actions
							(otherMonth && !showOtherMonths ? '&#xa0;' : // display for other months
							(unselectable ? '<span class="ui-state-default">' + printDate.getDate() + '</span>' : '<a class="ui-state-default' +
							(printDate.getTime() == today.getTime() ? ' ui-state-highlight' : '') +
							(printDate.getTime() == currentDate.getTime() ? ' ui-state-active' : '') + // highlight selected day
							(otherMonth ? ' ui-priority-secondary' : '') + // distinguish dates from other months
							'" href="#">' + printDate.getDate() + '</a>')) + '</td>'; // display selectable date
						printDate.setDate(printDate.getDate() + 1);
						printDate = this._daylightSavingAdjust(printDate);
					}
					calender += tbody + '</tr>';
				}
				drawMonth++;
				if (drawMonth > 11) {
					drawMonth = 0;
					drawYear++;
				}
				calender += '</tbody></table>' + (isMultiMonth ? '</div>' + 
							((numMonths[0] > 0 && col == numMonths[1]-1) ? '<div class="ui-datepicker-row-break"></div>' : '') : '');
				group += calender;
			}
			html += group;
		}
		html += buttonPanel + ($.browser.msie && parseInt($.browser.version,10) < 7 && !inst.inline ?
			'<iframe src="javascript:false;" class="ui-datepicker-cover" frameborder="0"></iframe>' : '');
		inst._keyEvent = false;
		return html;
	},

	/* Generate the month and year header. */
	_generateMonthYearHeader: function(inst, drawMonth, drawYear, minDate, maxDate,
			secondary, monthNames, monthNamesShort) {
		var changeMonth = this._get(inst, 'changeMonth');
		var changeYear = this._get(inst, 'changeYear');
		var showMonthAfterYear = this._get(inst, 'showMonthAfterYear');
		var html = '<div class="ui-datepicker-title">';
		var monthHtml = '';
		// month selection
		if (secondary || !changeMonth)
			monthHtml += '<span class="ui-datepicker-month">' + monthNames[drawMonth] + '</span>';
		else {
			var inMinYear = (minDate && minDate.getFullYear() == drawYear);
			var inMaxYear = (maxDate && maxDate.getFullYear() == drawYear);
			monthHtml += '<select class="ui-datepicker-month" data-handler="selectMonth" data-event="change">';
			for (var month = 0; month < 12; month++) {
				if ((!inMinYear || month >= minDate.getMonth()) &&
						(!inMaxYear || month <= maxDate.getMonth()))
					monthHtml += '<option value="' + month + '"' +
						(month == drawMonth ? ' selected="selected"' : '') +
						'>' + monthNamesShort[month] + '</option>';
			}
			monthHtml += '</select>';
		}
		if (!showMonthAfterYear)
			html += monthHtml + (secondary || !(changeMonth && changeYear) ? '&#xa0;' : '');
		// year selection
		if ( !inst.yearshtml ) {
			inst.yearshtml = '';
			if (secondary || !changeYear)
				html += '<span class="ui-datepicker-year">' + drawYear + '</span>';
			else {
				// determine range of years to display
				var years = this._get(inst, 'yearRange').split(':');
				var thisYear = new Date().getFullYear();
				var determineYear = function(value) {
					var year = (value.match(/c[+-].*/) ? drawYear + parseInt(value.substring(1), 10) :
						(value.match(/[+-].*/) ? thisYear + parseInt(value, 10) :
						parseInt(value, 10)));
					return (isNaN(year) ? thisYear : year);
				};
				var year = determineYear(years[0]);
				var endYear = Math.max(year, determineYear(years[1] || ''));
				year = (minDate ? Math.max(year, minDate.getFullYear()) : year);
				endYear = (maxDate ? Math.min(endYear, maxDate.getFullYear()) : endYear);
				inst.yearshtml += '<select class="ui-datepicker-year" data-handler="selectYear" data-event="change">';
				for (; year <= endYear; year++) {
					inst.yearshtml += '<option value="' + year + '"' +
						(year == drawYear ? ' selected="selected"' : '') +
						'>' + year + '</option>';
				}
				inst.yearshtml += '</select>';
				
				html += inst.yearshtml;
				inst.yearshtml = null;
			}
		}
		html += this._get(inst, 'yearSuffix');
		if (showMonthAfterYear)
			html += (secondary || !(changeMonth && changeYear) ? '&#xa0;' : '') + monthHtml;
		html += '</div>'; // Close datepicker_header
		return html;
	},

	/* Adjust one of the date sub-fields. */
	_adjustInstDate: function(inst, offset, period) {
		var year = inst.drawYear + (period == 'Y' ? offset : 0);
		var month = inst.drawMonth + (period == 'M' ? offset : 0);
		var day = Math.min(inst.selectedDay, this._getDaysInMonth(year, month)) +
			(period == 'D' ? offset : 0);
		var date = this._restrictMinMax(inst,
			this._daylightSavingAdjust(new Date(year, month, day)));
		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		if (period == 'M' || period == 'Y')
			this._notifyChange(inst);
	},

	/* Ensure a date is within any min/max bounds. */
	_restrictMinMax: function(inst, date) {
		var minDate = this._getMinMaxDate(inst, 'min');
		var maxDate = this._getMinMaxDate(inst, 'max');
		var newDate = (minDate && date < minDate ? minDate : date);
		newDate = (maxDate && newDate > maxDate ? maxDate : newDate);
		return newDate;
	},

	/* Notify change of month/year. */
	_notifyChange: function(inst) {
		var onChange = this._get(inst, 'onChangeMonthYear');
		if (onChange)
			onChange.apply((inst.input ? inst.input[0] : null),
				[inst.selectedYear, inst.selectedMonth + 1, inst]);
	},

	/* Determine the number of months to show. */
	_getNumberOfMonths: function(inst) {
		var numMonths = this._get(inst, 'numberOfMonths');
		return (numMonths == null ? [1, 1] : (typeof numMonths == 'number' ? [1, numMonths] : numMonths));
	},

	/* Determine the current maximum date - ensure no time components are set. */
	_getMinMaxDate: function(inst, minMax) {
		return this._determineDate(inst, this._get(inst, minMax + 'Date'), null);
	},

	/* Find the number of days in a given month. */
	_getDaysInMonth: function(year, month) {
		return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
	},

	/* Find the day of the week of the first of a month. */
	_getFirstDayOfMonth: function(year, month) {
		return new Date(year, month, 1).getDay();
	},

	/* Determines if we should allow a "next/prev" month display change. */
	_canAdjustMonth: function(inst, offset, curYear, curMonth) {
		var numMonths = this._getNumberOfMonths(inst);
		var date = this._daylightSavingAdjust(new Date(curYear,
			curMonth + (offset < 0 ? offset : numMonths[0] * numMonths[1]), 1));
		if (offset < 0)
			date.setDate(this._getDaysInMonth(date.getFullYear(), date.getMonth()));
		return this._isInRange(inst, date);
	},

	/* Is the given date in the accepted range? */
	_isInRange: function(inst, date) {
		var minDate = this._getMinMaxDate(inst, 'min');
		var maxDate = this._getMinMaxDate(inst, 'max');
		return ((!minDate || date.getTime() >= minDate.getTime()) &&
			(!maxDate || date.getTime() <= maxDate.getTime()));
	},

	/* Provide the configuration settings for formatting/parsing. */
	_getFormatConfig: function(inst) {
		var shortYearCutoff = this._get(inst, 'shortYearCutoff');
		shortYearCutoff = (typeof shortYearCutoff != 'string' ? shortYearCutoff :
			new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
		return {shortYearCutoff: shortYearCutoff,
			dayNamesShort: this._get(inst, 'dayNamesShort'), dayNames: this._get(inst, 'dayNames'),
			monthNamesShort: this._get(inst, 'monthNamesShort'), monthNames: this._get(inst, 'monthNames')};
	},

	/* Format the given date for display. */
	_formatDate: function(inst, day, month, year) {
		if (!day) {
			inst.currentDay = inst.selectedDay;
			inst.currentMonth = inst.selectedMonth;
			inst.currentYear = inst.selectedYear;
		}
		var date = (day ? (typeof day == 'object' ? day :
			this._daylightSavingAdjust(new Date(year, month, day))) :
			this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay)));
		return this.formatDate(this._get(inst, 'dateFormat'), date, this._getFormatConfig(inst));
	}
});

/*
 * Bind hover events for datepicker elements.
 * Done via delegate so the binding only occurs once in the lifetime of the parent div.
 * Global instActive, set by _updateDatepicker allows the handlers to find their way back to the active picker.
 */ 
function bindHover(dpDiv) {
	var selector = 'button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a';
	return dpDiv.bind('mouseout', function(event) {
			var elem = $( event.target ).closest( selector );
			if ( !elem.length ) {
				return;
			}
			elem.removeClass( "ui-state-hover ui-datepicker-prev-hover ui-datepicker-next-hover" );
		})
		.bind('mouseover', function(event) {
			var elem = $( event.target ).closest( selector );
			if ($.datepicker._isDisabledDatepicker( instActive.inline ? dpDiv.parent()[0] : instActive.input[0]) ||
					!elem.length ) {
				return;
			}
			elem.parents('.ui-datepicker-calendar').find('a').removeClass('ui-state-hover');
			elem.addClass('ui-state-hover');
			if (elem.hasClass('ui-datepicker-prev')) elem.addClass('ui-datepicker-prev-hover');
			if (elem.hasClass('ui-datepicker-next')) elem.addClass('ui-datepicker-next-hover');
		});
}

/* jQuery extend now ignores nulls! */
function extendRemove(target, props) {
	$.extend(target, props);
	for (var name in props)
		if (props[name] == null || props[name] == undefined)
			target[name] = props[name];
	return target;
};

/* Determine whether an object is an array. */
function isArray(a) {
	return (a && (($.browser.safari && typeof a == 'object' && a.length) ||
		(a.constructor && a.constructor.toString().match(/\Array\(\)/))));
};

/* Invoke the datepicker functionality.
   @param  options  string - a command, optionally followed by additional parameters or
                    Object - settings for attaching new datepicker functionality
   @return  jQuery object */
$.fn.datepicker = function(options){
	
	/* Verify an empty collection wasn't passed - Fixes #6976 */
	if ( !this.length ) {
		return this;
	}
	
	/* Initialise the date picker. */
	if (!$.datepicker.initialized) {
		$(document).mousedown($.datepicker._checkExternalClick).
			find('body').append($.datepicker.dpDiv);
		$.datepicker.initialized = true;
	}

	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options == 'string' && (options == 'isDisabled' || options == 'getDate' || options == 'widget'))
		return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
	if (options == 'option' && arguments.length == 2 && typeof arguments[1] == 'string')
		return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
	return this.each(function() {
		typeof options == 'string' ?
			$.datepicker['_' + options + 'Datepicker'].
				apply($.datepicker, [this].concat(otherArgs)) :
			$.datepicker._attachDatepicker(this, options);
	});
};

$.datepicker = new Datepicker(); // singleton instance
$.datepicker.initialized = false;
$.datepicker.uuid = new Date().getTime();
$.datepicker.version = "1.8.22";

// Workaround for #4055
// Add another global to avoid noConflict issues with inline event handlers
window['DP_jQuery_' + dpuuid] = $;

})(jQuery);


/*********************************************** 
     Begin jquery.ui.datepicker-es.js 
***********************************************/ 

/* Inicialización en español para la extensión 'UI date picker' para jQuery. */
/* Traducido por Vester (xvester@gmail.com). */
/* Modificado por eturino (eturino@gmail.com). */
jQuery(function($){
	$.datepicker.regional['es'] = {
		closeText: 'Cerrar',
		prevText: '&#x3c;',
		nextText: '&#x3e;',
		clearText: 'Limpiar',
		currentText: 'Hoy',
		monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
		'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
		monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
		'Jul','Ago','Sep','Oct','Nov','Dic'],
		dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
		dayNamesShort: ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'],
		dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sa'],
		weekHeader: 'Sm',
		dateFormat: 'dd/mm/yy',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ''};
	$.datepicker.setDefaults($.datepicker.regional['es']);
});

/*********************************************** 
     Begin jquery.ui.autocomplete.js 
***********************************************/ 

/*!
 * jQuery UI Autocomplete 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Autocomplete
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 */
(function( $, undefined ) {

// used to prevent race conditions with remote data sources
var requestIndex = 0;

$.widget( "ui.autocomplete", {
	options: {
		appendTo: "body",
		autoFocus: false,
		delay: 300,
		minLength: 1,
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		source: null
	},

	pending: 0,

	_create: function() {
		var self = this,
			doc = this.element[ 0 ].ownerDocument,
			suppressKeyPress;
		this.isMultiLine = this.element.is( "textarea" );

		this.element
			.addClass( "ui-autocomplete-input" )
			.attr( "autocomplete", "off" )
			// TODO verify these actually work as intended
			.attr({
				role: "textbox",
				"aria-autocomplete": "list",
				"aria-haspopup": "true"
			})
			.bind( "keydown.autocomplete", function( event ) {
				if ( self.options.disabled || self.element.propAttr( "readOnly" ) ) {
					return;
				}

				suppressKeyPress = false;
				var keyCode = $.ui.keyCode;
				switch( event.keyCode ) {
				case keyCode.PAGE_UP:
					self._move( "previousPage", event );
					break;
				case keyCode.PAGE_DOWN:
					self._move( "nextPage", event );
					break;
				case keyCode.UP:
					self._keyEvent( "previous", event );
					break;
				case keyCode.DOWN:
					self._keyEvent( "next", event );
					break;
				case keyCode.ENTER:
				case keyCode.NUMPAD_ENTER:
					// when menu is open and has focus
					if ( self.menu.active ) {
						// #6055 - Opera still allows the keypress to occur
						// which causes forms to submit
						suppressKeyPress = true;
						event.preventDefault();
					}
					//passthrough - ENTER and TAB both select the current element
				case keyCode.TAB:
					if ( !self.menu.active ) {
						return;
					}
					self.menu.select( event );
					break;
				case keyCode.ESCAPE:
					self.element.val( self.term );
					self.close( event );
					break;
				default:
					// keypress is triggered before the input value is changed
					clearTimeout( self.searching );
					self.searching = setTimeout(function() {
						// only search if the value has changed
						if ( self.term != self.element.val() ) {
							self.selectedItem = null;
							self.search( null, event );
						}
					}, self.options.delay );
					break;
				}
			})
			.bind( "keypress.autocomplete", function( event ) {
				if ( suppressKeyPress ) {
					suppressKeyPress = false;
					event.preventDefault();
				}
			})
			.bind( "focus.autocomplete", function() {
				if ( self.options.disabled ) {
					return;
				}

				self.selectedItem = null;
				self.previous = self.element.val();
			})
			.bind( "blur.autocomplete", function( event ) {
				if ( self.options.disabled ) {
					return;
				}

				clearTimeout( self.searching );
				// clicks on the menu (or a button to trigger a search) will cause a blur event
				self.closing = setTimeout(function() {
					self.close( event );
					self._change( event );
				}, 150 );
			});
		this._initSource();
		this.menu = $( "<ul></ul>" )
			.addClass( "ui-autocomplete" )
			.appendTo( $( this.options.appendTo || "body", doc )[0] )
			// prevent the close-on-blur in case of a "slow" click on the menu (long mousedown)
			.mousedown(function( event ) {
				// clicking on the scrollbar causes focus to shift to the body
				// but we can't detect a mouseup or a click immediately afterward
				// so we have to track the next mousedown and close the menu if
				// the user clicks somewhere outside of the autocomplete
				var menuElement = self.menu.element[ 0 ];
				if ( !$( event.target ).closest( ".ui-menu-item" ).length ) {
					setTimeout(function() {
						$( document ).one( 'mousedown', function( event ) {
							if ( event.target !== self.element[ 0 ] &&
								event.target !== menuElement &&
								!$.ui.contains( menuElement, event.target ) ) {
								self.close();
							}
						});
					}, 1 );
				}

				// use another timeout to make sure the blur-event-handler on the input was already triggered
				setTimeout(function() {
					clearTimeout( self.closing );
				}, 13);
			})
			.menu({
				focus: function( event, ui ) {
					var item = ui.item.data( "item.autocomplete" );
					if ( false !== self._trigger( "focus", event, { item: item } ) ) {
						// use value to match what will end up in the input, if it was a key event
						if ( /^key/.test(event.originalEvent.type) ) {
							self.element.val( item.value );
						}
					}
				},
				selected: function( event, ui ) {
					var item = ui.item.data( "item.autocomplete" ),
						previous = self.previous;

					// only trigger when focus was lost (click on menu)
					if ( self.element[0] !== doc.activeElement ) {
						self.element.focus();
						self.previous = previous;
						// #6109 - IE triggers two focus events and the second
						// is asynchronous, so we need to reset the previous
						// term synchronously and asynchronously :-(
						setTimeout(function() {
							self.previous = previous;
							self.selectedItem = item;
						}, 1);
					}

					if ( false !== self._trigger( "select", event, { item: item } ) ) {
						self.element.val( item.value );
					}
					// reset the term after the select event
					// this allows custom select handling to work properly
					self.term = self.element.val();

					self.close( event );
					self.selectedItem = item;
				},
				blur: function( event, ui ) {
					// don't set the value of the text field if it's already correct
					// this prevents moving the cursor unnecessarily
					if ( self.menu.element.is(":visible") &&
						( self.element.val() !== self.term ) ) {
						self.element.val( self.term );
					}
				}
			})
			.zIndex( this.element.zIndex() + 1 )
			// workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
			.css({ top: 0, left: 0 })
			.hide()
			.data( "menu" );
		if ( $.fn.bgiframe ) {
			 this.menu.element.bgiframe();
		}
		// turning off autocomplete prevents the browser from remembering the
		// value when navigating through history, so we re-enable autocomplete
		// if the page is unloaded before the widget is destroyed. #7790
		self.beforeunloadHandler = function() {
			self.element.removeAttr( "autocomplete" );
		};
		$( window ).bind( "beforeunload", self.beforeunloadHandler );
	},

	destroy: function() {
		this.element
			.removeClass( "ui-autocomplete-input" )
			.removeAttr( "autocomplete" )
			.removeAttr( "role" )
			.removeAttr( "aria-autocomplete" )
			.removeAttr( "aria-haspopup" );
		this.menu.element.remove();
		$( window ).unbind( "beforeunload", this.beforeunloadHandler );
		$.Widget.prototype.destroy.call( this );
	},

	_setOption: function( key, value ) {
		$.Widget.prototype._setOption.apply( this, arguments );
		if ( key === "source" ) {
			this._initSource();
		}
		if ( key === "appendTo" ) {
			this.menu.element.appendTo( $( value || "body", this.element[0].ownerDocument )[0] )
		}
		if ( key === "disabled" && value && this.xhr ) {
			this.xhr.abort();
		}
	},

	_initSource: function() {
		var self = this,
			array,
			url;
		if ( $.isArray(this.options.source) ) {
			array = this.options.source;
			this.source = function( request, response ) {
				response( $.ui.autocomplete.filter(array, request.term) );
			};
		} else if ( typeof this.options.source === "string" ) {
			url = this.options.source;
			this.source = function( request, response ) {
				if ( self.xhr ) {
					self.xhr.abort();
				}
				self.xhr = $.ajax({
					url: url,
					data: request,
					dataType: "json",
					success: function( data, status ) {
						response( data );
					},
					error: function() {
						response( [] );
					}
				});
			};
		} else {
			this.source = this.options.source;
		}
	},

	search: function( value, event ) {
		value = value != null ? value : this.element.val();

		// always save the actual value, not the one passed as an argument
		this.term = this.element.val();

		if ( value.length < this.options.minLength ) {
			return this.close( event );
		}

		clearTimeout( this.closing );
		if ( this._trigger( "search", event ) === false ) {
			return;
		}

		return this._search( value );
	},

	_search: function( value ) {
		this.pending++;
		this.element.addClass( "ui-autocomplete-loading" );

		this.source( { term: value }, this._response() );
	},

	_response: function() {
		var that = this,
			index = ++requestIndex;

		return function( content ) {
			if ( index === requestIndex ) {
				that.__response( content );
			}

			that.pending--;
			if ( !that.pending ) {
				that.element.removeClass( "ui-autocomplete-loading" );
			}
		};
	},

	__response: function( content ) {
		if ( !this.options.disabled && content && content.length ) {
			content = this._normalize( content );
			this._suggest( content );
			this._trigger( "open" );
		} else {
			this.close();
		}
	},

	close: function( event ) {
		clearTimeout( this.closing );
		if ( this.menu.element.is(":visible") ) {
			this.menu.element.hide();
			this.menu.deactivate();
			this._trigger( "close", event );
		}
	},
	
	_change: function( event ) {
		if ( this.previous !== this.element.val() ) {
			this._trigger( "change", event, { item: this.selectedItem } );
		}
	},

	_normalize: function( items ) {
		// assume all items have the right format when the first item is complete
		if ( items.length && items[0].label && items[0].value ) {
			return items;
		}
		return $.map( items, function(item) {
			if ( typeof item === "string" ) {
				return {
					label: item,
					value: item
				};
			}
			return $.extend({
				label: item.label || item.value,
				value: item.value || item.label
			}, item );
		});
	},

	_suggest: function( items ) {
		var ul = this.menu.element
			.empty()
			.zIndex( this.element.zIndex() + 1 );
		this._renderMenu( ul, items );
		// TODO refresh should check if the active item is still in the dom, removing the need for a manual deactivate
		this.menu.deactivate();
		this.menu.refresh();

		// size and position menu
		ul.show();
		this._resizeMenu();
		ul.position( $.extend({
			of: this.element
		}, this.options.position ));

		if ( this.options.autoFocus ) {
			this.menu.next( new $.Event("mouseover") );
		}
	},

	_resizeMenu: function() {
		var ul = this.menu.element;
		ul.outerWidth( Math.max(
			// Firefox wraps long text (possibly a rounding bug)
			// so we add 1px to avoid the wrapping (#7513)
			ul.width( "" ).outerWidth() + 1,
			this.element.outerWidth()
		) );
	},

	_renderMenu: function( ul, items ) {
		var self = this;
		$.each( items, function( index, item ) {
			self._renderItem( ul, item );
		});
	},

	_renderItem: function( ul, item) {
		return $( "<li></li>" )
			.data( "item.autocomplete", item )
			.append( $( "<a></a>" ).text( item.label ) )
			.appendTo( ul );
	},

	_move: function( direction, event ) {
		if ( !this.menu.element.is(":visible") ) {
			this.search( null, event );
			return;
		}
		if ( this.menu.first() && /^previous/.test(direction) ||
				this.menu.last() && /^next/.test(direction) ) {
			this.element.val( this.term );
			this.menu.deactivate();
			return;
		}
		this.menu[ direction ]( event );
	},

	widget: function() {
		return this.menu.element;
	},
	_keyEvent: function( keyEvent, event ) {
		if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
			this._move( keyEvent, event );

			// prevents moving cursor to beginning/end of the text field in some browsers
			event.preventDefault();
		}
	}
});

$.extend( $.ui.autocomplete, {
	escapeRegex: function( value ) {
		return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},
	filter: function(array, term) {
		var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
		return $.grep( array, function(value) {
			return matcher.test( value.label || value.value || value );
		});
	}
});

}( jQuery ));

/*
 * jQuery UI Menu (not officially released)
 * 
 * This widget isn't yet finished and the API is subject to change. We plan to finish
 * it for the next release. You're welcome to give it a try anyway and give us feedback,
 * as long as you're okay with migrating your code later on. We can help with that, too.
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Menu
 *
 * Depends:
 *	jquery.ui.core.js
 *  jquery.ui.widget.js
 */
(function($) {

$.widget("ui.menu", {
	_create: function() {
		var self = this;
		this.element
			.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
			.attr({
				role: "listbox",
				"aria-activedescendant": "ui-active-menuitem"
			})
			.click(function( event ) {
				if ( !$( event.target ).closest( ".ui-menu-item a" ).length ) {
					return;
				}
				// temporary
				event.preventDefault();
				self.select( event );
			});
		this.refresh();
	},
	
	refresh: function() {
		var self = this;

		// don't refresh list items that are already adapted
		var items = this.element.children("li:not(.ui-menu-item):has(a)")
			.addClass("ui-menu-item")
			.attr("role", "menuitem");
		
		items.children("a")
			.addClass("ui-corner-all")
			.attr("tabindex", -1)
			// mouseenter doesn't work with event delegation
			.mouseenter(function( event ) {
				self.activate( event, $(this).parent() );
			})
			.mouseleave(function() {
				self.deactivate();
			});
	},

	activate: function( event, item ) {
		this.deactivate();
		if (this.hasScroll()) {
			var offset = item.offset().top - this.element.offset().top,
				scroll = this.element.scrollTop(),
				elementHeight = this.element.height();
			if (offset < 0) {
				this.element.scrollTop( scroll + offset);
			} else if (offset >= elementHeight) {
				this.element.scrollTop( scroll + offset - elementHeight + item.height());
			}
		}
		this.active = item.eq(0)
			.children("a")
				.addClass("ui-state-hover")
				.attr("id", "ui-active-menuitem")
			.end();
		this._trigger("focus", event, { item: item });
	},

	deactivate: function() {
		if (!this.active) { return; }

		this.active.children("a")
			.removeClass("ui-state-hover")
			.removeAttr("id");
		this._trigger("blur");
		this.active = null;
	},

	next: function(event) {
		this.move("next", ".ui-menu-item:first", event);
	},

	previous: function(event) {
		this.move("prev", ".ui-menu-item:last", event);
	},

	first: function() {
		return this.active && !this.active.prevAll(".ui-menu-item").length;
	},

	last: function() {
		return this.active && !this.active.nextAll(".ui-menu-item").length;
	},

	move: function(direction, edge, event) {
		if (!this.active) {
			this.activate(event, this.element.children(edge));
			return;
		}
		var next = this.active[direction + "All"](".ui-menu-item").eq(0);
		if (next.length) {
			this.activate(event, next);
		} else {
			this.activate(event, this.element.children(edge));
		}
	},

	// TODO merge with previousPage
	nextPage: function(event) {
		if (this.hasScroll()) {
			// TODO merge with no-scroll-else
			if (!this.active || this.last()) {
				this.activate(event, this.element.children(".ui-menu-item:first"));
				return;
			}
			var base = this.active.offset().top,
				height = this.element.height(),
				result = this.element.children(".ui-menu-item").filter(function() {
					var close = $(this).offset().top - base - height + $(this).height();
					// TODO improve approximation
					return close < 10 && close > -10;
				});

			// TODO try to catch this earlier when scrollTop indicates the last page anyway
			if (!result.length) {
				result = this.element.children(".ui-menu-item:last");
			}
			this.activate(event, result);
		} else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.last() ? ":first" : ":last"));
		}
	},

	// TODO merge with nextPage
	previousPage: function(event) {
		if (this.hasScroll()) {
			// TODO merge with no-scroll-else
			if (!this.active || this.first()) {
				this.activate(event, this.element.children(".ui-menu-item:last"));
				return;
			}

			var base = this.active.offset().top,
				height = this.element.height(),
				result = this.element.children(".ui-menu-item").filter(function() {
					var close = $(this).offset().top - base + height - $(this).height();
					// TODO improve approximation
					return close < 10 && close > -10;
				});

			// TODO try to catch this earlier when scrollTop indicates the last page anyway
			if (!result.length) {
				result = this.element.children(".ui-menu-item:first");
			}
			this.activate(event, result);
		} else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.first() ? ":last" : ":first"));
		}
	},

	hasScroll: function() {
		return this.element.height() < this.element[ $.fn.prop ? "prop" : "attr" ]("scrollHeight");
	},

	select: function( event ) {
		this._trigger("selected", event, { item: this.active });
	}
});

}(jQuery));


/*********************************************** 
     Begin ui.multiselect.js 
***********************************************/ 

/*
 * jQuery UI Multiselect
 *
 * Authors:
 *  Michael Aufreiter (quasipartikel.at)
 *  Yanick Rochon (yanick.rochon[at]gmail[dot]com)
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * http://www.quasipartikel.at/multiselect/
 *
 * 
 * Depends:
 *	ui.core.js
 *	ui.sortable.js
 *
 * Optional:
 * localization (http://plugins.jquery.com/project/localisation)
 * scrollTo (http://plugins.jquery.com/project/ScrollTo)
 * 
 * Todo:
 *  Make batch actions faster
 *  Implement dynamic insertion through remote calls
 */


(function($) {

$.widget("ui.multiselect", {
  options: {
		sortable: true,
		searchable: true,
		doubleClickable: true,
		animated: 'fast',
		show: 'slideDown',
		hide: 'slideUp',
		dividerLocation: 0.6,
		nodeComparator: function(node1,node2) {
			var text1 = node1.text(),
			    text2 = node2.text();
			return text1 == text2 ? 0 : (text1 < text2 ? -1 : 1);
		}
	},
	_create: function() {
		this.element.hide();
		this.id = this.element.attr("id");
		this.container = $('<div class="ui-multiselect ui-helper-clearfix ui-widget"></div>').insertAfter(this.element);
		this.count = 0; // number of currently selected options
		this.selectedContainer = $('<div class="selected"></div>').appendTo(this.container);
		this.availableContainer = $('<div class="available"></div>').appendTo(this.container);
		this.selectedActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><span class="count">0 '+$.ui.multiselect.locale.itemsCount+'</span><a href="#" class="remove-all">'+$.ui.multiselect.locale.removeAll+'</a></div>').appendTo(this.selectedContainer);
		this.availableActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><input type="text" class="search empty ui-widget-content ui-corner-all"/><a href="#" class="add-all">'+$.ui.multiselect.locale.addAll+'</a></div>').appendTo(this.availableContainer);
		this.selectedList = $('<ul class="selected connected-list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.selectedContainer);
		this.availableList = $('<ul class="available connected-list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.availableContainer);
		
		var that = this;

		// set dimensions
		this.container.width(this.element.width()+1);
		this.selectedContainer.width(Math.floor(this.element.width()*this.options.dividerLocation));
		this.availableContainer.width(Math.floor(this.element.width()*(1-this.options.dividerLocation)));

		// fix list height to match <option> depending on their individual header's heights
		this.selectedList.height(Math.max(this.element.height()-this.selectedActions.height(),1));
		this.availableList.height(Math.max(this.element.height()-this.availableActions.height(),1));
		
		if ( !this.options.animated ) {
			this.options.show = 'show';
			this.options.hide = 'hide';
		}
		
		// init lists
		this._populateLists(this.element.find('option'));
		
		// make selection sortable
		if (this.options.sortable) {
			this.selectedList.sortable({
				placeholder: 'ui-state-highlight',
				axis: 'y',
				update: function(event, ui) {
					// apply the new sort order to the original selectbox
					that.selectedList.find('li').each(function() {
						if ($(this).data('optionLink'))
							$(this).data('optionLink').remove().appendTo(that.element);
					});
				},
				receive: function(event, ui) {
					ui.item.data('optionLink').attr('selected', true);
					// increment count
					that.count += 1;
					that._updateCount();
					// workaround, because there's no way to reference 
					// the new element, see http://dev.jqueryui.com/ticket/4303
					that.selectedList.children('.ui-draggable').each(function() {
						$(this).removeClass('ui-draggable');
						$(this).data('optionLink', ui.item.data('optionLink'));
						$(this).data('idx', ui.item.data('idx'));
						that._applyItemState($(this), true);
					});
			
					// workaround according to http://dev.jqueryui.com/ticket/4088
					setTimeout(function() { ui.item.remove(); }, 1);
				}
			});
		}
		
		// set up livesearch
		if (this.options.searchable) {
			this._registerSearchEvents(this.availableContainer.find('input.search'));
		} else {
			$('.search').hide();
		}
		
		// batch actions
		this.container.find(".remove-all").click(function() {
			that._populateLists(that.element.find('option').removeAttr('selected'));
			return false;
		});
		
		this.container.find(".add-all").click(function() {
			var options = that.element.find('option').not(":selected");
			if (that.availableList.children('li:hidden').length > 1) {
				that.availableList.children('li').each(function(i) {
					if ($(this).is(":visible")) $(options[i-1]).attr('selected', 'selected'); 
				});
			} else {
				options.attr('selected', 'selected');
			}
			that._populateLists(that.element.find('option'));
			return false;
		});
	},
	destroy: function() {
		this.element.show();
		this.container.remove();

		$.Widget.prototype.destroy.apply(this, arguments);
	},
	_populateLists: function(options) {
		this.selectedList.children('.ui-element').remove();
		this.availableList.children('.ui-element').remove();
		this.count = 0;

		var that = this;
		var items = $(options.map(function(i) {
	      var item = that._getOptionNode(this).appendTo(this.selected ? that.selectedList : that.availableList).show();

			if (this.selected) that.count += 1;
			that._applyItemState(item, this.selected);
			item.data('idx', i);
			return item[0];
    }));
		
		// update count
		this._updateCount();
		that._filter.apply(this.availableContainer.find('input.search'), [that.availableList]);
  },
	_updateCount: function() {
		this.selectedContainer.find('span.count').text(this.count+" "+$.ui.multiselect.locale.itemsCount);
	},
	_getOptionNode: function(option) {
		option = $(option);
		var node = $('<li class="ui-state-default ui-element" title="'+option.text()+'"><span class="ui-icon"/>'+option.text()+'<a href="#" class="action"><span class="ui-corner-all ui-icon"/></a></li>').hide();
		node.data('optionLink', option);
		return node;
	},
	// clones an item with associated data
	// didn't find a smarter away around this
	_cloneWithData: function(clonee) {
		var clone = clonee.clone(false,false);
		clone.data('optionLink', clonee.data('optionLink'));
		clone.data('idx', clonee.data('idx'));
		return clone;
	},
	_setSelected: function(item, selected) {
		item.data('optionLink').attr('selected', selected);

		if (selected) {
			var selectedItem = this._cloneWithData(item);
			item[this.options.hide](this.options.animated, function() { $(this).remove(); });
			selectedItem.appendTo(this.selectedList).hide()[this.options.show](this.options.animated);
			
			this._applyItemState(selectedItem, true);
			return selectedItem;
		} else {
			
			// look for successor based on initial option index
			var items = this.availableList.find('li'), comparator = this.options.nodeComparator;
			var succ = null, i = item.data('idx'), direction = comparator(item, $(items[i]));

			// TODO: test needed for dynamic list populating
			if ( direction ) {
				while (i>=0 && i<items.length) {
					direction > 0 ? i++ : i--;
					if ( direction != comparator(item, $(items[i])) ) {
						// going up, go back one item down, otherwise leave as is
						succ = items[direction > 0 ? i : i+1];
						break;
					}
				}
			} else {
				succ = items[i];
			}
			
			var availableItem = this._cloneWithData(item);
			succ ? availableItem.insertBefore($(succ)) : availableItem.appendTo(this.availableList);
			item[this.options.hide](this.options.animated, function() { $(this).remove(); });
			availableItem.hide()[this.options.show](this.options.animated);
			
			this._applyItemState(availableItem, false);
			return availableItem;
		}
	},
	_applyItemState: function(item, selected) {
		if (selected) {
			if (this.options.sortable)
				item.children('span').addClass('ui-icon-arrowthick-2-n-s').removeClass('ui-helper-hidden').addClass('ui-icon');
			else
				item.children('span').removeClass('ui-icon-arrowthick-2-n-s').addClass('ui-helper-hidden').removeClass('ui-icon');
			item.find('a.action span').addClass('ui-icon-minus').removeClass('ui-icon-plus');
			this._registerRemoveEvents(item.find('a.action'));
			
		} else {
			item.children('span').removeClass('ui-icon-arrowthick-2-n-s').addClass('ui-helper-hidden').removeClass('ui-icon');
			item.find('a.action span').addClass('ui-icon-plus').removeClass('ui-icon-minus');
			this._registerAddEvents(item.find('a.action'));
		}
		
		this._registerDoubleClickEvents(item);
		this._registerHoverEvents(item);
	},
	// taken from John Resig's liveUpdate script
	_filter: function(list) {
		var input = $(this);
		var rows = list.children('li'),
			cache = rows.map(function(){
				
				return $(this).text().toLowerCase();
			});
		
		var term = $.trim(input.val().toLowerCase()), scores = [];
		
		if (!term) {
			rows.show();
		} else {
			rows.hide();

			cache.each(function(i) {
				if (this.indexOf(term)>-1) { scores.push(i); }
			});

			$.each(scores, function() {
				$(rows[this]).show();
			});
		}
	},
	_registerDoubleClickEvents: function(elements) {
		if (!this.options.doubleClickable) return;
		elements.dblclick(function() {
			elements.find('a.action').click();
		});
	},
	_registerHoverEvents: function(elements) {
		elements.removeClass('ui-state-hover');
		elements.mouseover(function() {
			$(this).addClass('ui-state-hover');
		});
		elements.mouseout(function() {
			$(this).removeClass('ui-state-hover');
		});
	},
	_registerAddEvents: function(elements) {
		var that = this;
		elements.click(function() {
			var item = that._setSelected($(this).parent(), true);
			that.count += 1;
			that._updateCount();
			return false;
		});
		
		// make draggable
		if (this.options.sortable) {
  		elements.each(function() {
  			$(this).parent().draggable({
  	      connectToSortable: that.selectedList,
  				helper: function() {
  					var selectedItem = that._cloneWithData($(this)).width($(this).width() - 50);
  					selectedItem.width($(this).width());
  					return selectedItem;
  				},
  				appendTo: that.container,
  				containment: that.container,
  				revert: 'invalid'
  	    });
  		});		  
		}
	},
	_registerRemoveEvents: function(elements) {
		var that = this;
		elements.click(function() {
			that._setSelected($(this).parent(), false);
			that.count -= 1;
			that._updateCount();
			return false;
		});
 	},
	_registerSearchEvents: function(input) {
		var that = this;

		input.focus(function() {
			$(this).addClass('ui-state-active');
		})
		.blur(function() {
			$(this).removeClass('ui-state-active');
		})
		.keypress(function(e) {
			if (e.keyCode == 13)
				return false;
		})
		.keyup(function() {
			that._filter.apply(this, [that.availableList]);
		});
	}
});
		
$.extend($.ui.multiselect, {
	locale: {
		addAll:'Add all',
		removeAll:'Remove all',
		itemsCount:'items selected'
	}
});


})(jQuery);


/*********************************************** 
     Begin ui-multiselect-es.js 
***********************************************/ 

/**
 * Localization strings for the UI Multiselect widget
 *
 * @locale es, es-ES
 */

$.extend($.ui.multiselect.locale, {
	addAll:'',
	removeAll:'',
	itemsCount:'seleccionados'
});

/*********************************************** 
     Begin libs.js 
***********************************************/ 

//@codekit-prepend "../underscore/underscore.js";
//@codekit-prepend "../toolbox/toolbox.js";
//@codekit-prepend "../jquery/jquery.js";
//@codekit-prepend "../jquery/jquery.json.js";
//@codekit-prepend "../jquery/jquery.ba-bbq.js";
//@codekit-prepend "../jquery/jquery.base64.js";
//@codekit-prepend "../jquery/jquery.cookie.js";
//@codekit-prepend "../jquery/jquery.selectboxes.js";
//@codekit-prepend "../js/md5.js";

//jquery UI

//@codekit-prepend "../jquery/ui/jquery.ui.core.js";
//@codekit-prepend "../jquery/ui/jquery.ui.widget.js";
//@codekit-prepend "../jquery/ui/jquery.ui.position.js";
//@codekit-prepend "../jquery/ui/jquery.ui.datepicker.js";
//@codekit-prepend "../jquery/ui/jquery.ui.datepicker-es.js";
//@codekit-prepend "../jquery/ui/jquery.ui.autocomplete.js";

//@codekit-prepend "../jquery/ui_multiselect/ui.multiselect.js";
//@codekit-prepend "../jquery/ui_multiselect/ui-multiselect-es.js";


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

