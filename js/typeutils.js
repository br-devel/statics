/**
 * Created by .
 * User: eturino
 * Date: 2/27/11
 * Time: 14:46
 */
function TypeUtils() {
}

TypeUtils.NULL_TYPE = 'Null';
TypeUtils.UNDEFINED_TYPE = 'Undefined';
TypeUtils.BOOLEAN_TYPE = 'Boolean';
TypeUtils.NUMBER_TYPE = 'Number';
TypeUtils.STRING_TYPE = 'String';
TypeUtils.OBJECT_TYPE = 'Object';
TypeUtils.ARRAY_TYPE = 'Array';
TypeUtils.REGEXP_TYPE = 'RegExp';
TypeUtils.DATE_TYPE = 'Date';
TypeUtils.FUNCTION_TYPE = 'Function';

/**
 + * A more functional typeof, based on the one released with JSUnit
 + * @param something
 + * @return {String}
 + */
TypeUtils.getType = function (something, objectAsClassName) {
	var oacn = objectAsClassName || true;

	switch (something) {
		case null:
			return TypeUtils.NULL_TYPE;
		case (void 0):
			return TypeUtils.UNDEFINED_TYPE;
	}
	var result = typeof something;
	try {
		switch (result) {
			case 'string':
				result = TypeUtils.STRING_TYPE;
				break;
			case 'boolean':
				result = TypeUtils.BOOLEAN_TYPE;
				break;
			case 'number':
				result = TypeUtils.NUMBER_TYPE;
				break;
			case 'object':
			case 'function':
				switch (something.constructor) {
					case new String().constructor:
						result = TypeUtils.STRING_TYPE;
						break;
					case new Boolean().constructor:
						result = TypeUtils.BOOLEAN_TYPE;
						break;
					case new Number().constructor:
						result = TypeUtils.NUMBER_TYPE;
						break;
					case new Array().constructor:
						result = TypeUtils.ARRAY_TYPE;
						break;
					case new RegExp().constructor:
						result = TypeUtils.REGEXP_TYPE;
						break;
					case new Date().constructor:
						result = TypeUtils.DATE_TYPE;
						break;
					case Function:
						result = TypeUtils.FUNCTION_TYPE;
						break;
					default:
						if (oacn) {
							var m = something.constructor.toString().match(/function\s*([^( ]+)\(/);
							if (m)
								result = m[1]; else
								break;
						} else {
							result = TypeUtils.OBJECT_TYPE;
						}
				}
				break;
		}
	} finally {
		result = result.substr(0, 1).toUpperCase() + result.substr(1);
	}
	return result;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isDefined = function (x) {
	return TypeUtils.getType(x) != TypeUtils.UNDEFINED_TYPE;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isNumber = function (x) {
	return TypeUtils.getType(x) == TypeUtils.NUMBER_TYPE;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isString = function (x) {
	return TypeUtils.getType(x) == TypeUtils.STRING_TYPE;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isBoolean = function (x) {
	return TypeUtils.getType(x) == TypeUtils.BOOLEAN_TYPE;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isArray = function (x) {
	var t = TypeUtils.getType(x, false);
	return t == TypeUtils.ARRAY_TYPE || t == TypeUtils.OBJECT_TYPE;
};

/**
 * @returns Boolean
 * @param x
 */
TypeUtils.isObject = function (x) {
	var t = TypeUtils.getType(x, false);
	return t == TypeUtils.ARRAY_TYPE || t == TypeUtils.OBJECT_TYPE;
};

/**
 * @returns Boolean
 * @param x
 * @param {String} myclass
 */
TypeUtils.instanceOf = function (x, myclass) {
	var res = false;
	try {
		res = x instanceof eval(myclass);
	} finally {
		res = false;
	}
	return res;
};
