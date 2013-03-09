// global define
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
        // jshint eqeqeq: false

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
        // jshint eqeqeq: false
        if (actual === expected) {
            return true;
        }
        if (expected instanceof Date && actual instanceof Date) {
            return actual.getTime() === expected.getTime();
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
        if (Object.prototype.toString.call(expected) === '[object RegExp]') {
            return expected.test(actual);
        }
        if (actual instanceof expected) {
            return true;
        }
        return false;
    }


    // Error handling
    // --------------

    // Assertion error class
    function AssertionError (opts) {
        this.message = opts.message;
        this.actual = opts.actual;
        this.expected = opts.expected;
        this.operator = opts.operator;
    }
    AssertionError.prototype = new Error();
    AssertionError.prototype.constructor = AssertionError;
    AssertionError.prototype.name = 'AssertionError';

    // Assertion error to string
    AssertionError.prototype.toString = function () {
        if (this.message) {
            return this.name + ': ' + this.message;
        } else {
            return this.name + ': ' +
                JSON.stringify(this.actual) + ' ' +
                this.operator + ' ' +
                JSON.stringify(this.expected);
        }
    };

    // Fail a test
    function fail (actual, operator, expected, message) {
        throw new AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: operator
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
            fail(val, '==', true, msg);
        }
    };

    // Assert that two values are equal
    proclaim.equal = function (actual, expected, msg) {
        // jshint eqeqeq: false
        if (actual != expected) {
            fail(actual, '==', expected, msg);
        }
    };

    // Assert that two values are not equal
    proclaim.notEqual = function (actual, expected, msg) {
        // jshint eqeqeq: false
        if (actual == expected) {
            fail(actual, '!=', expected, msg);
        }
    };

    // Assert that two values are equal with strict comparison
    proclaim.strictEqual = function (actual, expected, msg) {
        if (actual !== expected) {
            fail(actual, '===', expected, msg);
        }
    };

    // Assert that two values are not equal with strict comparison
    proclaim.notStrictEqual = function (actual, expected, msg) {
        if (actual === expected) {
            fail(actual, '!==', expected, msg);
        }
    };

    // Assert that two values are deeply equal
    proclaim.deepEqual = function (actual, expected, msg) {
        if (!isDeepEqual(actual, expected)) {
            fail(actual, 'deepEqual', expected, msg);
        }
    };

    // Assert that two values are not deeply equal
    proclaim.notDeepEqual = function (actual, expected, msg) {
        if (isDeepEqual(actual, expected)) {
            fail(actual, '!deepEqual', expected, msg);
        }
    };

    // Assert that a function throws an error
    proclaim.throws = function (fn, expected, msg) {
        if (!functionThrows(fn, expected)) {
            fail(fn, 'throws', expected, msg);
        }
    };


    // Additional assertions
    // ---------------------

    proclaim.doesNotThrow = function (fn, expected, msg) {
        // Todo
    };

    proclaim.isTypeOf = function (val, type, msg) {
        // Todo
    };

    proclaim.isNotTypeOf = function (val, type, msg) {
        // Todo
    };

    proclaim.isInstanceOf = function (val, constructor, msg) {
        // Todo
    };

    proclaim.isNotInstanceOf = function (val, constructor, msg) {
        // Todo
    };

    proclaim.isArray = function (val, msg) {
        // Todo
    };

    proclaim.isNotArray = function (val, msg) {
        // Todo
    };

    proclaim.isBoolean = function (val, msg) {
        // Todo
    };

    proclaim.isNotBoolean = function (val, msg) {
        // Todo
    };

    proclaim.isTrue = function (val, msg) {
        // Todo
    };

    proclaim.isFalse = function (val, msg) {
        // Todo
    };

    proclaim.isFunction = function (val, msg) {
        // Todo
    };

    proclaim.isNotFunction = function (val, msg) {
        // Todo
    };

    proclaim.isNull = function (val, msg) {
        // Todo
    };

    proclaim.isNotNull = function (val, msg) {
        // Todo
    };

    proclaim.isNumber = function (val, msg) {
        // Todo
    };

    proclaim.isNotNumber = function (val, msg) {
        // Todo
    };

    proclaim.isObject = function (val, msg) {
        // Todo
    };

    proclaim.isNonObject = function (val, msg) {
        // Todo
    };

    proclaim.isString = function (val, msg) {
        // Todo
    };

    proclaim.isNonString = function (val, msg) {
        // Todo
    };

    proclaim.isUndefined = function (val, msg) {
        // Todo
    };

    proclaim.isDefined = function (val, msg) {
        // Todo
    };

    proclaim.match = function (val, pattern, msg) {
        // Todo
    };

    proclaim.notMatch = function (val, pattern, msg) {
        // Todo
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