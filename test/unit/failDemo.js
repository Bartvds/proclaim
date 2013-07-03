/* jshint maxlen: 200 */
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
