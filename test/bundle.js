;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function(){/* global define */
(function (root, proclaim) {
    'use strict';


    // Utilities
    // ---------

    // Utility for checking whether a value is undefined or null
    function isUndefinedOrNull (val) {
        return (val === null || typeof val === 'undefined');
    }

    // Utility for checking whether a value is an arguments object
    function isArgumentsObject (val) {
        return (Object.prototype.toString.call(val) === '[object Arguments]');
    }

    // Utility for checking whether a value is plain object
    function isPlainObject (val) {
        return Object.prototype.toString.call(val) === '[object Object]';
    }

    // Utility for checking whether an object contains another object
    function includes (haystack, needle) {
        /* jshint maxdepth: 3*/
        var i;

        // Array#indexOf, but ie...
        if (isArray(haystack)) {
            for (i = haystack.length - 1; i >= 0; i = i - 1) {
                if (haystack[i] === needle) {
                    return true;
                }
            }
        }

        // String#indexOf
        if (typeof haystack === 'string') {
            if (haystack.indexOf(needle) !== -1) {
                return true;
            }
        }

        // Object#hasOwnProperty
        if (isPlainObject(haystack)) {
            if (haystack.hasOwnProperty(needle)) {
                return true;
            }
        }

        return false;
    }

    // Utility for checking whether a value is an array
    var isArray = Array.isArray || function (val) {
        return (Object.prototype.toString.call(val) === '[object Array]');
    };

    // Utility for getting object keys
    function getObjectKeys (obj) {
        var key, keys = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    // Utility for deep equality testing of objects
    // Note: this function does an awful lot, look into sorting this
    function objectsEqual (obj1, obj2) {
        /* jshint eqeqeq: false */

        // Check for undefined or null
        if (isUndefinedOrNull(obj1) || isUndefinedOrNull(obj2)) {
            return false;
        }

        // Object prototypes must be the same
        if (obj1.prototype !== obj2.prototype) {
            return false;
        }

        // Handle argument objects
        if (isArgumentsObject(obj1)) {
            if (!isArgumentsObject(obj2)) {
                return false;
            }
            obj1 = Array.prototype.slice.call(obj1);
            obj2 = Array.prototype.slice.call(obj2);
        }

        // Check number of own properties
        var obj1Keys = getObjectKeys(obj1);
        var obj2Keys = getObjectKeys(obj2);
        if (obj1Keys.length !== obj2Keys.length) {
            return false;
        }

        obj1Keys.sort();
        obj2Keys.sort();

        // Cheap initial key test (see https://github.com/joyent/node/blob/master/lib/assert.js)
        var key, i, len = obj1Keys.length;
        for (i = 0; i < len; i += 1) {
            if (obj1Keys[i] != obj2Keys[i]) {
                return false;
            }
        }

        // Expensive deep test
        for (i = 0; i < len; i += 1) {
            key = obj1Keys[i];
            if (!isDeepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        // If it got this far...
        return true;
    }

    // Utility for deep equality testing
    function isDeepEqual (actual, expected) {
        /* jshint eqeqeq: false */
        if (actual === expected) {
            return true;
        }
        if (expected instanceof Date && actual instanceof Date) {
            return actual.getTime() === expected.getTime();
        }
        if (actual instanceof RegExp && expected instanceof RegExp) {
            return (
                actual.source === expected.source &&
                actual.global === expected.global &&
                actual.multiline === expected.multiline &&
                actual.lastIndex === expected.lastIndex &&
                actual.ignoreCase === expected.ignoreCase
            );
        }
        if (typeof actual !== 'object' && typeof expected !== 'object') {
            return actual == expected;
        }
        return objectsEqual(actual, expected);
    }

    // Utility for testing whether a function throws an error
    function functionThrows (fn, expected) {

        // Try/catch
        var thrown = false;
        var thrownError;
        try {
            fn();
        } catch (err) {
            thrown = true;
            thrownError = err;
        }

        // Check error
        if (thrown && expected) {
            thrown = errorMatches(thrownError, expected);
        }

        return thrown;
    }

    // Utility for checking whether an error matches a given constructor, regexp or string
    function errorMatches (actual, expected) {
        if (typeof expected === 'string') {
            return actual.message === expected;
        }
        if (expected instanceof RegExp) {
            return expected.test(actual.message);
        }
        if (actual instanceof expected) {
            return true;
        }
        return false;
    }

    // Utility for checking whether two values can be diffed
    function diffableTypes (actual, expected) {
        var typeA = typeof actual;
        var typeE = typeof expected;
        /*if (actual instanceof RegExp && expected instanceof RegExp) {
            return true;
        }
        if (actual instanceof Date && expected instanceof Date) {
            return true;
        }*/
        if (typeA === 'string' && typeE === 'string') {
            return true;
        }
        if (typeA === 'object' && typeE === 'object') {
            return isArray(actual) === isArray(expected);
        }
        return false;
    }

    function toDebug (value, cutoff) {
        cutoff = arguments.length < 2 ? 20 : cutoff;

        var t = typeof value;
        if (t === 'function') {
            t = '' + t;
        }
        if (t === 'object') {
            var str = '';
            var match = Object.prototype.toString.call(value).match(/^\[object ([\S]*)]$/);
            if (match && match.length > 1 && match[1] !== 'Object') {
                str = match[1];
            }
            value = str + JSON.stringify(value);
            if (value.length > cutoff) {
                value = value.substr(0, cutoff) + '...';
            }
            return value;
        }
        if (t === 'string') {
            if (value.length > cutoff) {
                return JSON.stringify(value.substr(0, cutoff)) + '...';
            }
            return JSON.stringify(value);
        }
        return '' + value;
    }

    // Error handling
    // --------------

    // Assertion error class
    function AssertionError (opts) {
        opts = opts || {};
        this.name = 'AssertionError';
        this.actual = opts.actual;
        this.expected = opts.expected;
        this.operator = opts.operator || '';
        this.message = this.getString(opts.message || '');
        this.showDiff = diffableTypes(this.actual, this.expected);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, opts.stackStartFunction || fail);
        }
    }
    AssertionError.prototype = (Object.create ? Object.create(Error.prototype) : new Error());
    AssertionError.prototype.name = 'AssertionError';
    AssertionError.prototype.constructor = AssertionError;

    // Assertion error to string
    AssertionError.prototype.getString = function (message) {
        var operation = 'expected ' + toDebug(this.actual) + ' ' +
            (this.operator ? this.operator + ' ' : '') +
            toDebug(this.expected);
        if (message) {
            return message + ': ' +operation;
        } else {
            return operation;
        }
    };
    AssertionError.prototype.toString = function () {
        return this.name + ': ' +this.message;
    };

    // Fail a test
    function fail (actual, expected, message, operator, stackStartFunction) {
        throw new AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: operator,
            stackStartFunction: stackStartFunction
        });
    }

    // Expose error handling tools
    proclaim.AssertionError = AssertionError;
    proclaim.fail = fail;


    // Assertions as outlined in
    // http://wiki.commonjs.org/wiki/Unit_Testing/1.0#Assert
    // -----------------------------------------------------

    // Assert that a value is truthy
    proclaim.ok = function (val, msg) {
        if (!!!val) {
            fail(val, true, msg, '==');
        }
    };

    // Assert that a value is falsy
    proclaim.notOk = function (val, msg) {
        if (!!val) {
            fail(val, true, msg, '!=');
        }
    };

    // Assert that two values are equal
    proclaim.equal = function (actual, expected, msg) {
        /* jshint eqeqeq: false */
        if (actual != expected) {
            fail(actual, expected, msg, '==');
        }
    };

    // Assert that two values are not equal
    proclaim.notEqual = function (actual, expected, msg) {
        /* jshint eqeqeq: false */
        if (actual == expected) {
            fail(actual, expected, msg, '!=');
        }
    };

    // Assert that two values are equal with strict comparison
    proclaim.strictEqual = function (actual, expected, msg) {
        if (actual !== expected) {
            fail(actual, expected, msg, '===');
        }
    };

    // Assert that two values are not equal with strict comparison
    proclaim.notStrictEqual = function (actual, expected, msg) {
        if (actual === expected) {
            fail(actual, expected, msg, '!==');
        }
    };

    // Assert that two values are deeply equal
    proclaim.deepEqual = function (actual, expected, msg) {
        if (!isDeepEqual(actual, expected)) {
            fail(actual, expected, msg, 'deepEqual');
        }
    };

    // Assert that two values are not deeply equal
    proclaim.notDeepEqual = function (actual, expected, msg) {
        if (isDeepEqual(actual, expected)) {
            fail(actual, expected, msg, '!deepEqual');
        }
    };

    // Assert that a function throws an error
    proclaim.throws = function (fn, expected, msg) {
        if (!functionThrows(fn, expected)) {
            fail(fn, expected, msg, 'throws');
        }
    };


    // Additional assertions
    // ---------------------

    // Assert that a function does not throw an error
    proclaim.doesNotThrow = function (fn, expected, msg) {
        if (functionThrows(fn, expected)) {
            fail(fn, expected, msg, '!throws');
        }
    };

    // Assert that a value is a specific type
    proclaim.isTypeOf = function (val, type, msg) {
        proclaim.strictEqual(typeof val, type, msg);
    };

    // Assert that a value is not a specific type
    proclaim.isNotTypeOf = function (val, type, msg) {
        proclaim.notStrictEqual(typeof val, type, msg);
    };

    // Assert that a value is an instance of a constructor
    proclaim.isInstanceOf = function (val, constructor, msg) {
        if (!(val instanceof constructor)) {
            fail(val, constructor, msg, 'instanceof');
        }
    };

    // Assert that a value not an instance of a constructor
    proclaim.isNotInstanceOf = function (val, constructor, msg) {
        if (val instanceof constructor) {
            fail(val, constructor, msg, '!instanceof');
        }
    };

    // Assert that a value is an array
    proclaim.isArray = function (val, msg) {
        if (!isArray(val)) {
            fail(typeof val, 'array', msg, '===');
        }
    };

    // Assert that a value is not an array
    proclaim.isNotArray = function (val, msg) {
        if (isArray(val)) {
            fail(typeof val, 'array', msg, '!==');
        }
    };

    // Assert that a value is a boolean
    proclaim.isBoolean = function (val, msg) {
        proclaim.isTypeOf(val, 'boolean', msg);
    };

    // Assert that a value is not a boolean
    proclaim.isNotBoolean = function (val, msg) {
        proclaim.isNotTypeOf(val, 'boolean', msg);
    };

    // Assert that a value is true
    proclaim.isTrue = function (val, msg) {
        proclaim.strictEqual(val, true, msg);
    };

    // Assert that a value is false
    proclaim.isFalse = function (val, msg) {
        proclaim.strictEqual(val, false, msg);
    };

    // Assert that a value is a function
    proclaim.isFunction = function (val, msg) {
        proclaim.isTypeOf(val, 'function', msg);
    };

    // Assert that a value is not a function
    proclaim.isNotFunction = function (val, msg) {
        proclaim.isNotTypeOf(val, 'function', msg);
    };

    // Assert that a value is null
    proclaim.isNull = function (val, msg) {
        proclaim.strictEqual(val, null, msg);
    };

    // Assert that a value is not null
    proclaim.isNotNull = function (val, msg) {
        proclaim.notStrictEqual(val, null, msg);
    };

    // Assert that a value is a number
    proclaim.isNumber = function (val, msg) {
        proclaim.isTypeOf(val, 'number', msg);
    };

    // Assert that a value is not a number
    proclaim.isNotNumber = function (val, msg) {
        proclaim.isNotTypeOf(val, 'number', msg);
    };

    // Assert that a value is an object
    proclaim.isObject = function (val, msg) {
        proclaim.isTypeOf(val, 'object', msg);
    };

    // Assert that a value is not an object
    proclaim.isNotObject = function (val, msg) {
        proclaim.isNotTypeOf(val, 'object', msg);
    };

    // Assert that a value is a string
    proclaim.isString = function (val, msg) {
        proclaim.isTypeOf(val, 'string', msg);
    };

    // Assert that a value is not a string
    proclaim.isNotString = function (val, msg) {
        proclaim.isNotTypeOf(val, 'string', msg);
    };

    // Assert that a value is undefined
    proclaim.isUndefined = function (val, msg) {
        proclaim.isTypeOf(val, 'undefined', msg);
    };

    // Assert that a value is defined
    proclaim.isDefined = function (val, msg) {
        proclaim.isNotTypeOf(val, 'undefined', msg);
    };

    // Assert that a value matches a regular expression
    proclaim.match = function (actual, expected, msg) {
        if (!expected.test(actual)) {
            fail(actual, expected, msg, 'match');
        }
    };

    // Assert that a value does not match a regular expression
    proclaim.notMatch = function (actual, expected, msg) {
        if (expected.test(actual)) {
            fail(actual, expected, msg, '!match');
        }
    };

    // Assert that an object includes something
    proclaim.includes = function (haystack, needle, msg) {
        if (!includes(haystack, needle)) {
            fail(haystack, needle, msg, 'include');
        }
    };

    // Assert that an object does not include something
    proclaim.doesNotInclude = function (haystack, needle, msg) {
        if (includes(haystack, needle)) {
            fail(haystack, needle, msg, '!include');
        }
    };

    // Assert that an object (Array, String, etc.) has an expected length
    proclaim.length = function (obj, expected, msg) {
        if (isUndefinedOrNull(obj)) {
            return fail(void 0, expected, msg, 'length');
        }
        if (obj.length !== expected) {
            fail(obj.length, expected, msg, 'length');
        }
    };


    // Exports
    // -------

    // AMD
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return proclaim;
        });
    }
    // CommonJS
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = proclaim;
    }
    // Script tag
    else {
        root.proclaim = proclaim;
    }


} (this, {}));

})()
},{}],2:[function(require,module,exports){
(function(){/* jshint maxlen: 200 */
/* global describe, it */
(function () {
    'use strict';

    // Dependencies
    //var assert = require('assert');

    // Test subject
    var proclaim = require('../../lib/proclaim');

    describe.skip('fail demo (toggle)', function () {

        describe('strictEqual boolean', function () {
            it('basic', function () {
                proclaim.strictEqual(true, false);
            });
            it('with message', function () {
                proclaim.strictEqual(true, false, 'failure message');
            });
        });
        describe('strictEqual string', function () {
            it('basic', function () {
                proclaim.strictEqual('Alpha Beta', 'Beta Gamma');
            });
            it('with message', function () {
                proclaim.strictEqual('Alpha Beta', 'Beta Gamma',  'failure message');
            });
        });
        describe('deepEqual object', function () {
            it('basic', function () {
                proclaim.deepEqual({a:1, b:2}, {a:1, b:4});
            });
            it('with message', function () {
                proclaim.deepEqual({a:1, b:2}, {a:1, b:4},  'failure message');
            });
        });
    });
} ());

})()
},{"../../lib/proclaim":1}],3:[function(require,module,exports){
(function(){// UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

function objectKeys(object) {
  if (Object.keys) return Object.keys(object);
  var result = [];
  for (var name in object) {
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// assert.AssertionError instanceof Error

assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

})()
},{"util":4,"buffer":5}],6:[function(require,module,exports){
(function(){/* jshint maxlen: 200 */
/* global beforeEach, describe, it */
(function () {
    'use strict';

    // Dependencies
    var assert = require('assert');

    // Test subject
    var proclaim = require('../../lib/proclaim');

    // Test suite
    describe('proclaim', function () {

        beforeEach(function (done) {
            // Nasty hack to prevent stack space errors in IE
            // https://github.com/visionmedia/mocha/issues/502
            // (also function wrapper fixes error in Firefox 3.6)
            setTimeout(function () {
                done();
            }, 0);
        });

        it('should be an object', function () {
            assert.strictEqual(typeof proclaim, 'object');
        });

        describe('.AssertionError()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.AssertionError, 'function');
            });

            describe('instance', function () {
                var optsWithMessage, errWithMessage, optsWithNoMessage, errWithNoMessage;
                var expectedWithMessage, expectedWithNoMessage;

                beforeEach(function () {
                    optsWithMessage = {
                        message: 'foo',
                        actual: 'bar',
                        expected: 'baz',
                        operator: '==='
                    };
                    expectedWithMessage = {
                        message: 'foo: expected "bar" === "baz"',
                        actual: 'bar',
                        expected: 'baz',
                        operator: '==='
                    };
                    errWithMessage = new proclaim.AssertionError(optsWithMessage);

                    optsWithNoMessage = {
                        message: '',
                        actual: 'bar',
                        expected: 'baz',
                        operator: '==='
                    };
                    expectedWithNoMessage = {
                        message: 'expected "bar" === "baz"',
                        actual: 'bar',
                        expected: 'baz',
                        operator: '==='
                    };
                    errWithNoMessage = new proclaim.AssertionError(optsWithNoMessage);
                });

                it('should extend the Error object', function () {
                    assert.strictEqual(errWithMessage instanceof Error, true);
                });

                it('should save the expected options as instance properties', function () {
                    assert.strictEqual(errWithMessage.message, expectedWithMessage.message);
                    assert.strictEqual(errWithMessage.actual, expectedWithMessage.actual);
                    assert.strictEqual(errWithMessage.expected, expectedWithMessage.expected);
                    assert.strictEqual(errWithMessage.operator, expectedWithMessage.operator);
                });

                it('should save the expected options as instance properties when no message is set', function () {
                    assert.strictEqual(errWithNoMessage.message, expectedWithNoMessage.message);
                    assert.strictEqual(errWithNoMessage.actual, expectedWithNoMessage.actual);
                    assert.strictEqual(errWithNoMessage.expected, expectedWithNoMessage.expected);
                    assert.strictEqual(errWithNoMessage.operator, expectedWithNoMessage.operator);
                });

                describe('#toString()', function () {

                    it('should return a string representation of the message', function () {
                        assert.strictEqual('' + errWithMessage, 'AssertionError: foo: expected "bar" === "baz"');
                    });

                    it('should return a string representation of the error when no message is set', function () {
                        assert.strictEqual('' + errWithNoMessage, 'AssertionError: expected "bar" === "baz"');

                        var complexOptsWithNoMessage = {
                            message: null,
                            actual: {a:1, b:2},
                            expected: {a:1, b:2},
                            operator: '==='
                        };
                        errWithNoMessage = new proclaim.AssertionError(complexOptsWithNoMessage);
                        assert.strictEqual('' + errWithNoMessage, 'AssertionError: expected {"a":1,"b":2} === {"a":1,"b":2}');
                    });

                });

            });

            describe('showDiff', function() {

                it('should have correct value on new AssertionError instance', function () {
                    assert.equal(new proclaim.AssertionError().showDiff, false, 'default');

                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:undefined}).showDiff, true, 'undefined v undefined');
                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:false}).showDiff, true, 'undefined v boolean');
                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:1}).showDiff, true, 'undefined v number');
                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:'world'}).showDiff, true, 'undefined v string');
                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:{a:1,b:2}}).showDiff, true, 'undefined v object');
                    assert.notEqual(new proclaim.AssertionError({actual:undefined, expected:[1,2,3]}).showDiff, true, 'undefined v array');

                    assert.notEqual(new proclaim.AssertionError({actual:true, expected:false}).showDiff, true, 'boolean v boolean');
                    assert.notEqual(new proclaim.AssertionError({actual:true, expected:1}).showDiff, true, 'boolean v number');
                    assert.notEqual(new proclaim.AssertionError({actual:true, expected:'world'}).showDiff, true, 'boolean v string');
                    assert.notEqual(new proclaim.AssertionError({actual:true, expected:{a:1,b:2}}).showDiff, true, 'boolean v object');
                    assert.notEqual(new proclaim.AssertionError({actual:true, expected:[1,2,3]}).showDiff, true, 'boolean v array');

                    assert.notEqual(new proclaim.AssertionError({actual:1, expected:1}).showDiff, true, 'number v number');
                    assert.notEqual(new proclaim.AssertionError({actual:1, expected:'world'}).showDiff, true, 'number v string');
                    assert.notEqual(new proclaim.AssertionError({actual:1, expected:{a:1,b:2}}).showDiff, true, 'number v object');
                    assert.notEqual(new proclaim.AssertionError({actual:1, expected:[1,2,3]}).showDiff, true, 'number v array');

                    assert.equal(new proclaim.AssertionError({actual:'hello', expected:'world'}).showDiff, true, 'string v string');
                    assert.equal(!new proclaim.AssertionError({actual:'hello', expected:{a:1,b:2}}).showDiff, true, 'string v object');
                    assert.notEqual(new proclaim.AssertionError({actual:'hello', expected:[1,2,3]}).showDiff, true, 'string v array');

                    assert.equal(new proclaim.AssertionError({actual:{a:2,b:4}, expected:{a:1,b:2}}).showDiff, true, 'object v object');
                    assert.notEqual(new proclaim.AssertionError({actual:{a:2,b:4}, expected:[1,2,3]}).showDiff, true, 'object v array');

                    assert.equal(new proclaim.AssertionError({actual:[3,2,1], expected:[1,2,3]}).showDiff, true, 'array v array');
                });
            });

        });

        describe('.fail()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.fail, 'function');
            });

            it('should throw an AssertionError', function () {
                assert.throws(function () { proclaim.fail('foo', 'bar'); }, proclaim.AssertionError);
            });

            describe('error', function () {

                it('should have the expected properties', function () {
                    var error;
                    try { proclaim.fail('foo', 'bar', 'baz', 'qux'); }
                    catch (err) { error = err; }
                    assert.strictEqual(error.actual, 'foo');
                    assert.strictEqual(error.expected, 'bar');
                    assert.strictEqual(error.message, 'baz: expected "foo" qux "bar"');
                    assert.strictEqual(error.operator, 'qux');
                });

            });

        });

        describe('.ok()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.ok, 'function');
            });

            it('should not throw when called with truthy values', function () {
                assert.doesNotThrow(function () { proclaim.ok(true); });
                assert.doesNotThrow(function () { proclaim.ok(1); });
                assert.doesNotThrow(function () { proclaim.ok('foo'); });
            });

            it('should throw when called with falsy values', function () {
                assert.throws(function () { proclaim.ok(false); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.ok(0); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.ok(''); }, proclaim.AssertionError);
            });

        });

        describe('.notOk()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.notOk, 'function');
            });

            it('should not throw when called with falsy values', function () {
                assert.doesNotThrow(function () { proclaim.notOk(false); });
                assert.doesNotThrow(function () { proclaim.notOk(0); });
                assert.doesNotThrow(function () { proclaim.notOk(''); });
            });

            it('should throw when called with truthy values', function () {
                assert.throws(function () { proclaim.notOk(true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notOk(1); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notOk('foo'); }, proclaim.AssertionError);
            });

        });

        describe('.equal()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.equal, 'function');
            });

            it('should not throw when called with equal values', function () {
                assert.doesNotThrow(function () { proclaim.equal(true, true); });
                assert.doesNotThrow(function () { proclaim.equal(true, 1); });
                assert.doesNotThrow(function () { proclaim.equal('123', 123); });
            });

            it('should throw when called with inequal values', function () {
                assert.throws(function () { proclaim.equal(true, false); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.equal(true, 0); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.equal('foo', 123); }, proclaim.AssertionError);
            });

        });

        describe('.notEqual()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.notEqual, 'function');
            });

            it('should not throw when called with inequal values', function () {
                assert.doesNotThrow(function () { proclaim.notEqual(true, false); });
                assert.doesNotThrow(function () { proclaim.notEqual(true, 0); });
                assert.doesNotThrow(function () { proclaim.notEqual('foo', 123); });
            });

            it('should throw when called with equal values', function () {
                assert.throws(function () { proclaim.notEqual(true, true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notEqual(true, 1); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notEqual('123', 123); }, proclaim.AssertionError);
            });

        });

        describe('.deepEqual()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.deepEqual, 'function');
            });

            it('should not throw when called with deeply equal values', function () {
                var date = new Date();
                assert.doesNotThrow(function () { proclaim.deepEqual(true, true); });
                assert.doesNotThrow(function () { proclaim.deepEqual(date, date); });
                assert.doesNotThrow(function () {
                    proclaim.deepEqual({foo: 'bar', bar: ['baz']}, {foo: 'bar', bar: ['baz']});
                });
                assert.doesNotThrow(function () { proclaim.deepEqual(arguments, arguments); });
                // Todo: write some more thorough tests for this
            });

            it('should throw when called with deeply inequal values', function () {
                assert.throws(function () { proclaim.deepEqual(true, false); }, proclaim.AssertionError, 'test1');
                assert.throws(function () { proclaim.deepEqual(new Date(), new Date(1000)); }, proclaim.AssertionError, 'test2');
                assert.throws(function () {
                    proclaim.deepEqual({foo: 'bar', bar: ['baz']}, {bar: 'baz', baz: ['qux']});
                }, proclaim.AssertionError, 'test3');
            });

            it('should not throw when keys are in a different order', function () {
                assert.doesNotThrow(function () {
                    proclaim.deepEqual({ hello: 1, goodbye: 1 }, { goodbye: 1, hello: 1 });
                });
            });

            it('should handle RegExps', function () {
                var a = new RegExp('goodbye', 'g'),
                    b = /goodbye/gi,
                    c = new RegExp('hello', 'g'),
                    d = /hello/i,
                    e = new RegExp('hello', 'i');

                assert.doesNotThrow(function () { proclaim.deepEqual(a, a); });
                assert.doesNotThrow(function () { proclaim.deepEqual(d, e); });
                assert.throws(function () { proclaim.deepEqual(a, b); });
                assert.throws(function () { proclaim.deepEqual(a, c); });
                assert.throws(function () { proclaim.deepEqual(a, d); });
                assert.throws(function () { proclaim.deepEqual(a, e); });
            });
        });

        describe('.notDeepEqual()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.notDeepEqual, 'function');
            });

            it('should not throw when called with deeply inequal values', function () {
                assert.doesNotThrow(function () { proclaim.notDeepEqual(true, false); });
                assert.doesNotThrow(function () { proclaim.notDeepEqual(new Date(), new Date(1000)); });
                assert.doesNotThrow(function () {
                    proclaim.notDeepEqual({foo: 'bar', bar: ['baz']}, {bar: 'baz', baz: ['qux']});
                });
            });

            it('should throw when called with deeply equal values', function () {
                var date = new Date();
                assert.throws(function () { proclaim.notDeepEqual(true, true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notDeepEqual(date, date); }, proclaim.AssertionError);
                assert.throws(function () {
                    proclaim.notDeepEqual({foo: 'bar', bar: ['baz']}, {foo: 'bar', bar: ['baz']});
                }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notDeepEqual(arguments, arguments); }, proclaim.AssertionError);
            });

        });

        describe('.strictEqual()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.strictEqual, 'function');
            });

            it('should not throw when called with strictly equal values', function () {
                assert.doesNotThrow(function () { proclaim.strictEqual(true, true); });
                assert.doesNotThrow(function () { proclaim.strictEqual(1, 1); });
                assert.doesNotThrow(function () { proclaim.strictEqual('foo', 'foo'); });
            });

            it('should throw when called with strictly inequal values', function () {
                assert.throws(function () { proclaim.strictEqual(true, false); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.strictEqual(true, 1); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.strictEqual('123', 123); }, proclaim.AssertionError);
            });

        });

        describe('.notStrictEqual()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.notStrictEqual, 'function');
            });

            it('should not throw when called with strictly inequal values', function () {
                assert.doesNotThrow(function () { proclaim.notStrictEqual(true, false); });
                assert.doesNotThrow(function () { proclaim.notStrictEqual(true, 1); });
                assert.doesNotThrow(function () { proclaim.notStrictEqual('123', 123); });
            });

            it('should throw when called with strictly equal values', function () {
                assert.throws(function () { proclaim.notStrictEqual(true, true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notStrictEqual(1, 1); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.notStrictEqual('foo', 'foo'); }, proclaim.AssertionError);
            });

        });

        // This is about to get more confusing than I though possible...
        describe('.throws()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.throws, 'function');
            });

            it('should not throw when called with a function which does throw', function () {
                assert.doesNotThrow(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    });
                });
            });

            it('should throw when called with a function which does not throw', function () {
                assert.throws(function () {
                    proclaim.throws(function () {});
                }, proclaim.AssertionError);
            });

            it('should not throw when thrown error matches the expected error', function () {
                assert.doesNotThrow(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, Error);
                });
                assert.doesNotThrow(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, /foo/);
                });
                assert.doesNotThrow(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, 'foo');
                });
            });

            it('should throw when thrown error does not match the expected error', function () {
                assert.throws(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, proclaim.AssertionError);
                }, proclaim.AssertionError);
                assert.throws(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, /bar/);
                }, proclaim.AssertionError);
                assert.throws(function () {
                    proclaim.throws(function () {
                        throw new Error('foo');
                    }, 'bar');
                }, proclaim.AssertionError);
            });

        });

        describe('.doesNotThrow()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.doesNotThrow, 'function');
            });

            it('should not throw when called with a function which does not throw', function () {
                assert.doesNotThrow(function () {
                    proclaim.doesNotThrow(function () {});
                });
            });

            it('should throw when called with a function which does throw', function () {
                assert.throws(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    });
                }, proclaim.AssertionError);
            });

            it('should not throw when thrown error does not match the expected error', function () {
                assert.doesNotThrow(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, proclaim.AssertionError);
                });
                assert.doesNotThrow(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, /bar/);
                });
                assert.doesNotThrow(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, 'bar');
                });
            });

            it('should throw when thrown error matches the expected error', function () {
                assert.throws(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, Error);
                }, proclaim.AssertionError);
                assert.throws(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, /foo/);
                }, proclaim.AssertionError);
                assert.throws(function () {
                    proclaim.doesNotThrow(function () {
                        throw new Error('foo');
                    }, 'foo');
                }, proclaim.AssertionError);
            });

        });

        describe('isTypeOf()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isTypeOf, 'function');
            });

            it('should not throw when called with a matching value and type', function () {
                assert.doesNotThrow(function () { proclaim.isTypeOf(true, 'boolean'); });
                assert.doesNotThrow(function () { proclaim.isTypeOf('foo', 'string'); });
                assert.doesNotThrow(function () { proclaim.isTypeOf([], 'object'); });
            });

            it('should throw when called with an unmatching value and type', function () {
                assert.throws(function () { proclaim.isTypeOf(true, 'undefined'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isTypeOf('foo', 'number'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isTypeOf([], 'function'); }, proclaim.AssertionError);
            });

        });

        describe('isNotTypeOf()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotTypeOf, 'function');
            });

            it('should not throw when called with an umatching value and type', function () {
                assert.doesNotThrow(function () { proclaim.isNotTypeOf(true, 'undefined'); });
                assert.doesNotThrow(function () { proclaim.isNotTypeOf('foo', 'number'); });
                assert.doesNotThrow(function () { proclaim.isNotTypeOf([], 'function'); });
            });

            it('should throw when called with a matching value and type', function () {
                assert.throws(function () { proclaim.isNotTypeOf(true, 'boolean'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNotTypeOf('foo', 'string'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNotTypeOf([], 'object'); }, proclaim.AssertionError);
            });

        });

        describe('isInstanceOf()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isInstanceOf, 'function');
            });

            it('should not throw when called with a matching value and constructor', function () {
                assert.doesNotThrow(function () { proclaim.isInstanceOf(new Date(), Date); });
            });

            it('should throw when called with an unmatching value and constructor', function () {
                assert.throws(function () { proclaim.isInstanceOf({}, Date); }, proclaim.AssertionError);
            });

        });

        describe('isNotInstanceOf()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotInstanceOf, 'function');
            });

            it('should not throw when called with an umatching value and constructor', function () {
                assert.doesNotThrow(function () { proclaim.isNotInstanceOf({}, Date); });
            });

            it('should throw when called with a matching value and constructor', function () {
                assert.throws(function () { proclaim.isNotInstanceOf(new Date(), Date); }, proclaim.AssertionError);
            });

        });

        describe('isArray()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isArray, 'function');
            });

            it('should not throw when called with an array', function () {
                assert.doesNotThrow(function () { proclaim.isArray([]); });
            });

            it('should throw when called with a non-array', function () {
                assert.throws(function () { proclaim.isArray(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isArray('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isArray({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotArray()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotArray, 'function');
            });

            it('should not throw when called with a non-array', function () {
                assert.doesNotThrow(function () { proclaim.isNotArray(null); });
                assert.doesNotThrow(function () { proclaim.isNotArray('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotArray({}); });
            });

            it('should throw when called with an array', function () {
                assert.throws(function () { proclaim.isNotArray([]); }, proclaim.AssertionError);
            });

        });

        describe('isBoolean()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isBoolean, 'function');
            });

            it('should not throw when called with a boolean', function () {
                assert.doesNotThrow(function () { proclaim.isBoolean(true); });
                assert.doesNotThrow(function () { proclaim.isBoolean(false); });
            });

            it('should throw when called with a non-boolean', function () {
                assert.throws(function () { proclaim.isBoolean(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isBoolean('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isBoolean({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotBoolean()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotBoolean, 'function');
            });

            it('should not throw when called with a non-boolean', function () {
                assert.doesNotThrow(function () { proclaim.isNotBoolean(null); });
                assert.doesNotThrow(function () { proclaim.isNotBoolean('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotBoolean({}); });
            });

            it('should throw when called with a boolean', function () {
                assert.throws(function () { proclaim.isNotBoolean(true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNotBoolean(false); }, proclaim.AssertionError);
            });

        });

        describe('isTrue()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isTrue, 'function');
            });

            it('should not throw when called with true', function () {
                assert.doesNotThrow(function () { proclaim.isTrue(true); });
            });

            it('should throw when called with a non-true value', function () {
                assert.throws(function () { proclaim.isTrue(false); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isTrue(1); }, proclaim.AssertionError);
            });

        });

        describe('isFalse()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isFalse, 'function');
            });

            it('should not throw when called with false', function () {
                assert.doesNotThrow(function () { proclaim.isFalse(false); });
            });

            it('should throw when called with a non-false value', function () {
                assert.throws(function () { proclaim.isFalse(true); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isFalse(0); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isFalse(null); }, proclaim.AssertionError);
            });

        });

        describe('isFunction()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isFunction, 'function');
            });

            it('should not throw when called with a function', function () {
                assert.doesNotThrow(function () { proclaim.isFunction(function () {}); });
            });

            it('should throw when called with a non-function', function () {
                assert.throws(function () { proclaim.isFunction(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isFunction('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isFunction({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotFunction()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotFunction, 'function');
            });

            it('should not throw when called with a non-function', function () {
                assert.doesNotThrow(function () { proclaim.isNotFunction(null); });
                assert.doesNotThrow(function () { proclaim.isNotFunction('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotFunction({}); });
            });

            it('should throw when called with a function', function () {
                assert.throws(function () { proclaim.isNotFunction(function () {}); }, proclaim.AssertionError);
            });

        });

        describe('isNull()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNull, 'function');
            });

            it('should not throw when called with a null value', function () {
                assert.doesNotThrow(function () { proclaim.isNull(null); });
            });

            it('should throw when called with a non-null value', function () {
                assert.throws(function () { proclaim.isNull(undefined); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNull('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNull({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotNull()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotNull, 'function');
            });

            it('should not throw when called with a non-null value', function () {
                assert.doesNotThrow(function () { proclaim.isNotNull(undefined); });
                assert.doesNotThrow(function () { proclaim.isNotNull('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotNull({}); });
            });

            it('should throw when called with a null value', function () {
                assert.throws(function () { proclaim.isNotNull(null); }, proclaim.AssertionError);
            });

        });

        describe('isNumber()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNumber, 'function');
            });

            it('should not throw when called with a number', function () {
                assert.doesNotThrow(function () { proclaim.isNumber(123); });
            });

            it('should throw when called with a non-number', function () {
                assert.throws(function () { proclaim.isNumber(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNumber('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isNumber({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotNumber()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotNumber, 'function');
            });

            it('should not throw when called with a non-number', function () {
                assert.doesNotThrow(function () { proclaim.isNotNumber(null); });
                assert.doesNotThrow(function () { proclaim.isNotNumber('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotNumber({}); });
            });

            it('should throw when called with a number', function () {
                assert.throws(function () { proclaim.isNotNumber(123); }, proclaim.AssertionError);
            });

        });

        describe('isObject()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isObject, 'function');
            });

            it('should not throw when called with an object', function () {
                assert.doesNotThrow(function () { proclaim.isObject({}); });
            });

            it('should throw when called with a non-object', function () {
                assert.throws(function () { proclaim.isObject(undefined); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isObject('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isObject(123); }, proclaim.AssertionError);
            });

        });

        describe('isNotObject()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotObject, 'function');
            });

            it('should not throw when called with a non-object', function () {
                assert.doesNotThrow(function () { proclaim.isNotObject(undefined); });
                assert.doesNotThrow(function () { proclaim.isNotObject('foo'); });
                assert.doesNotThrow(function () { proclaim.isNotObject(123); });
            });

            it('should throw when called with an object', function () {
                assert.throws(function () { proclaim.isNotObject({}); }, proclaim.AssertionError);
            });

        });

        describe('isString()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isString, 'function');
            });

            it('should not throw when called with a string', function () {
                assert.doesNotThrow(function () { proclaim.isString('foo'); });
            });

            it('should throw when called with a non-string', function () {
                assert.throws(function () { proclaim.isString(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isString(123); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isString({}); }, proclaim.AssertionError);
            });

        });

        describe('isNotString()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isNotString, 'function');
            });

            it('should not throw when called with a non-string', function () {
                assert.doesNotThrow(function () { proclaim.isNotString(null); });
                assert.doesNotThrow(function () { proclaim.isNotString(123); });
                assert.doesNotThrow(function () { proclaim.isNotString({}); });
            });

            it('should throw when called with a string', function () {
                assert.throws(function () { proclaim.isNotString('foo'); }, proclaim.AssertionError);
            });

        });

        describe('isUndefined()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isUndefined, 'function');
            });

            it('should not throw when called with an undefined value', function () {
                assert.doesNotThrow(function () { proclaim.isUndefined(undefined); });
            });

            it('should throw when called with a defined value', function () {
                assert.throws(function () { proclaim.isUndefined(null); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isUndefined('foo'); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.isUndefined({}); }, proclaim.AssertionError);
            });

        });

        describe('isDefined()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.isDefined, 'function');
            });

            it('should not throw when called with a defined value', function () {
                assert.doesNotThrow(function () { proclaim.isDefined(null); });
            });

            it('should throw when called with an undefined value', function () {
                assert.throws(function () { proclaim.isDefined(undefined); }, proclaim.AssertionError);
            });

        });

        describe('match()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.match, 'function');
            });

            it('should not throw when called with a matching value and regexp', function () {
                assert.doesNotThrow(function () { proclaim.match('foo', /f[a-z]o/); });
            });

            it('should throw when called with a non-matching value and regexp', function () {
                assert.throws(function () { proclaim.match('bar', /f[a-z]o/); }, proclaim.AssertionError);
            });

        });

        describe('notMatch()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.notMatch, 'function');
            });

            it('should not throw when called with a non-matching value and regexp', function () {
                assert.doesNotThrow(function () { proclaim.notMatch('bar', /f[a-z]o/); });
            });

            it('should throw when called with a matching value and regexp', function () {
                assert.throws(function () { proclaim.notMatch('foo', /f[a-z]o/); }, proclaim.AssertionError);
            });

        });

        describe('includes()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.includes, 'function');
            });

            describe('given an array', function () {

                it('should throw if "needle" is not found', function () {
                    assert.throws(function () {
                        proclaim.includes([ 1, 2, 3 ], 4);
                    }, proclaim.AssertionError);
                });

                it('should not throw if "needle" is found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.includes([ 1, 2, 3, 4 ], 4);
                    });
                });

            });

            describe('given a string', function () {

                it('should throw if "needle" is not found', function () {
                    assert.throws(function () {
                        proclaim.includes('hello', 'world');
                    }, proclaim.AssertionError);
                });

                it('should not throw if "needle" is found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.includes('hello world', 'world');
                    });
                });

            });

            describe('given an object', function () {

                it('should throw if the "needle" property is not found', function () {
                    assert.throws(function () {
                        proclaim.includes({ hello: true }, 'world');
                    }, proclaim.AssertionError);
                });

                it('should not throw if the "needle" property is found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.includes({ hello: true, world: false }, 'world');
                    });
                });

            });
        });

        describe('doesNotInclude()', function () {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.doesNotInclude, 'function');
            });

            describe('given an array', function () {

                it('should throw if "needle" is not found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.doesNotInclude([ 1, 2, 3 ], 4);
                    });
                });

                it('should not throw if "needle" is found', function () {
                    assert.throws(function () {
                        proclaim.doesNotInclude([ 1, 2, 3, 4 ], 4);
                    }, proclaim.AssertionError);
                });

            });

            describe('given a string', function () {

                it('should throw if "needle" is not found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.doesNotInclude('hello', 'world');
                    });
                });

                it('should not throw if "needle" is found', function () {
                    assert.throws(function () {
                        proclaim.doesNotInclude('hello world', 'world');
                    }, proclaim.AssertionError);
                });

            });

            describe('given an object', function () {

                it('should throw if the "needle" property is not found', function () {
                    assert.doesNotThrow(function () {
                        proclaim.doesNotInclude({ hello: true }, 'world');
                    });
                });

                it('should not throw if the "needle" property is found', function () {
                    assert.throws(function () {
                        proclaim.doesNotInclude({ hello: true, world: false }, 'world');
                    }, proclaim.AssertionError);
                });

            });

        });

        describe('length()', function() {

            it('should be a function', function () {
                assert.strictEqual(typeof proclaim.length, 'function');
            });

            it('should not throw when called with an object which has the expected length property', function () {
                assert.doesNotThrow(function () { proclaim.length({length: 3}, 3); });
            });

            it('should throw when called with an object that has a lower or higher length property value', function () {
                assert.throws(function () { proclaim.length({length: 2}, 3); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.length({length: 4}, 3); }, proclaim.AssertionError);
            });

            it('should throw when called with an object that has no length property', function () {
                assert.throws(function () { proclaim.length({}, 3); }, proclaim.AssertionError);
            });

            it('should throw when called with unexpected types', function () {
                assert.throws(function () { proclaim.length(null, 3); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.length(undefined, 3); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.length(NaN, 3); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.length(true, 3); }, proclaim.AssertionError);
                assert.throws(function () { proclaim.length(2, 3); }, proclaim.AssertionError);
            });

        });

    });

} ());

})()
},{"assert":3,"../../lib/proclaim":1}],4:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":7}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],7:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":8}],9:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],5:[function(require,module,exports){
(function(){var assert = require('assert');
exports.Buffer = Buffer;
exports.SlowBuffer = Buffer;
Buffer.poolSize = 8192;
exports.INSPECT_MAX_BYTES = 50;

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }
  this.parent = this;
  this.offset = 0;

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this[i] = subject.readUInt8(i);
        }
        else {
          this[i] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    } else if (type === 'number') {
      for (var i = 0; i < this.length; i++) {
        this[i] = 0;
      }
    }
  }
}

Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i];
};

Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i] = v;
};

Buffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

Buffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

Buffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.binaryWrite = Buffer.prototype.asciiWrite;

Buffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

Buffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
};

Buffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

Buffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

Buffer.prototype.binarySlice = Buffer.prototype.asciiSlice;

Buffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


Buffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  Buffer._charsWritten = i * 2;
  return i;
};


Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  if (end === undefined || isNaN(end)) {
    end = this.length;
  }
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  var temp = [];
  for (var i=start; i<end; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=target_start; i<target_start+temp.length; i++) {
    target[i] = temp[i-target_start];
  }
};

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof Buffer;
};

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// helpers

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}

function isArray(subject) {
  return (Array.isArray ||
    function(subject){
      return {}.toString.apply(subject) == '[object Array]'
    })
    (subject)
}

function isArrayIsh(subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

// read/write bit-twiddling

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer[offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer[offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1];
    }
  } else {
    val = buffer[offset];
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer[offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer[offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer[offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer[offset + 1] << 8;
    val |= buffer[offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer[offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer[offset] & 0x80;
  if (!neg) {
    return (buffer[offset]);
  }

  return ((0xff - buffer[offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer[offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer[offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer[offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

})()
},{"assert":3,"./buffer_ieee754":9,"base64-js":10}],10:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}]},{},[1,2,6])
;