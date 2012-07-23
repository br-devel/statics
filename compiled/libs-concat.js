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

/*!
 * jQuery Cookie Plugin
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function($) {
	$.cookie = function(key, value, options) {

		// key and at least value given, set cookie...
		if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null || value === undefined)) {
			options = $.extend({}, options);

			if (value === null || value === undefined) {
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
		options = value || {};
		var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

		var pairs = document.cookie.split('; ');
		for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
			if (decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
		}
		return null;
	};
})(jQuery);

/*********************************************** 
     Begin libs.js 
***********************************************/ 

//@codekit-prepend "../underscore/underscore.js";
//@codekit-prepend "../toolbox/toolbox.js";
//@codekit-prepend "../jquery/jquery.json.js";
//@codekit-prepend "../jquery/jquery.ba-bbq.js";
//@codekit-prepend "../jquery/jquery.base64.js";
//@codekit-prepend "../jquery/jquery.cookie.js";