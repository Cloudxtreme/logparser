#!/bin/node
var fs = require('fs');
var _ = require('underscore');

var utils = require('./utils');

// --- error throw/handle unit. ---
// currently err unit is a single function 'thrrrow'
var thrrrow= utils.ERR.thrrrow;

// # unit test code :)
var testErr = function() {
    console.log();
    console.log("----------------------");
    console.log("error testing function\nwas called.");
    console.log("going to throw a error");

    thrrrow({"where": "в терновый куст"});
    console.log();
    console.log('called utils.ERR.thhhrow');
    console.log("------------------------");
    console.log();
};
// / unit test code ends

// # unit test setup
testThrowError = false;

// # unit test runner
if (testThrowError) {    testErr();     }
// --- unit end. ---


var PARSER = utils.PARSER;

var endMatcher = PARSER.storeNginx.responseCodeMatcher;
var nextStart = PARSER.nextStart;
var tryMatcherFrom = PARSER.tryMatcherFrom;
var tryMatchFrom = PARSER.tryMatchFrom;

var testQuote = PARSER.storeNginx.testQuote;

var parseNginx = function(filename, callback) {
    var bads = [];
    var stats = { 'By project': '',
        'GETs count': 0, 'HEADs count': 0, 'Errors count': 0, 'Multiple queries': 0, 'Single queries': 0
    };

    function _check(item, str) {
        if (!item.key || !item.method || !item.response || !item.protocol) {
            bads.push({ str: str.split('?')[0], item: item});
        }
    }

    fs.readFile(filename, function (err, file) {
        // check if file read successful
        if (err) { callback([err, err]); return;}

        var results = []; //here we store :)
        var inside = false, prev, next = 0; //buffer parsing finite-state-automate

        do {
            prev = next;
            next = nextStart(file, prev + 1);

            if (tryMatcherFrom(file, next, PARSER.storeNginx.testGetObject)) {
                stats['GETs count']++;
                inside = true;
                // console.log("get at " + next);
            } else if (tryMatcherFrom(file, next, PARSER.storeNginx.testHeadObject)) {
                stats['HEADs count']++;
                inside = true;
                // console.log("head at " + next);
            }

            if (inside) {
                var fin = nextStart(file, next + 1);

                if (!tryMatcherFrom(file, fin, endMatcher)) {
                    stats['Errors count']++;
                }
                else {

                    var str = file.toString('ascii', next, fin + 5);
                    var string = str.split(' ');
                    //   console.log(string );//= file.toString('ascii', next, fin+5).split(' ');
                    var q = {
                        method: string[0].replace('"', ''),
                        protocol: string[2].replace('"', ''),
                        response: string[3]
                    };

                    string = string[1].split('?')[0];
                    if (string.indexOf('/g/') == 0) {
                        stats['Multiple queries']++;
                        string = string.split('/g/')[1].split(',');
                        r = [];
                        _.each(string, function (s) {
                            r.push(_.extend({}, q, {key: s.split('@')[0]}));
                        });
                        _.each(r, function (item) {
                            results.push(item);
                            _check(item, str);
                        })
                    } else {
                        stats['Single queries']++;
                        string = string.split('/')[1];
                        q.key = string;
                        results.push(q);
                        _check(q, str);
                    }
                }
                inside = false;
            }
        } while (prev != next && tryMatchFrom(file, next, testQuote));

        stats['By project'] = JSON.stringify(_.countBy(results, function (item) {
            return item.key;
        }));
        stats['By response code'] = _.countBy(results, function (item) {
            return item.response;
        });
        stats['By protocol'] = _.countBy(results, function (item) {
            return item.protocol;
        });
        stats['By method'] = _.countBy(results, function (item) {
            return item.method;
        });
        stats['Bad entries by log string'] = _.countBy(bads, 'str');
        callback([bads, stats]); //TODO: define some stable logical interface here
    });

};

module.exports = {
    parseNginx: parseNginx
};