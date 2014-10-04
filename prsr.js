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

var tryMatcherObject = PARSER.tryMatcherObject;
var tryMatchingFunction = PARSER.tryMatchingFunction;

var endMatcher = PARSER.storeNginx.responseCodeMatcher;

var testQuote = PARSER.storeNginx.testQuote;
var testNewline = PARSER.storeMaxcdn.testNewline;
var nextStartNginx = function(buffer, position) {
    while (buffer.length >= position++ && !tryMatchingFunction(buffer, position, testQuote)){
    }
    return position;
};

var nextStartMaxcdn = function(buffer, position) {
    while (buffer.length >= position++ && !tryMatchingFunction(buffer, position, testNewline)){
    }
    return position;
};

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
            next = nextStartNginx(file, prev + 1);

            if (tryMatcherObject(file, next, PARSER.storeNginx.testGetObject)) {
                stats['GETs count']++;
                inside = true;
                // console.log("get at " + next);
            } else if (tryMatcherObject(file, next, PARSER.storeNginx.testHeadObject)) {
                stats['HEADs count']++;
                inside = true;
                // console.log("head at " + next);
            }

            if (inside) {
                var fin = nextStartNginx(file, next + 1);

                if (!tryMatcherObject(file, fin, endMatcher)) {
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
        } while (prev != next && tryMatchingFunction(file, next, testQuote));

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


var parseMaxcdn = function(filename, callback) {

    var bads = [];
    var stats = {
       'Errors count': 0, 'Multiple queries': 0, 'Single queries': 0,
            'By response code': {}, 'By project': {}
    };

    function _check(item, str) {
        if (!item.key || !item.response ) {
            bads.push({ str: str, item: item, meta: 'did not pass _check()'});
        }
    }

    // so we do not need to store 1M records only to use _.countBy on them..
    // TODO: apply same with nginx log [arser
    function _count(item){

        if (item.key) {
            if (!stats['By project'][item.key]) {
                stats['By project'][item.key] = 1;
            } else {
                stats['By project'][item.key]++;
            }
        }

        if (item.response) {
            if (!stats['By response code'][item.response]) {
                stats['By response code'][item.response] = 1;
            } else {
                stats['By response code'][item.response]++;
            }
        }
    }

    fs.readFile(filename, function (err, file) {
        // check if file read successful
        if (err) { callback([err, err]); return;}

        var results = []; //here we store :)
        var inside = false, prev, next = -1, counter=0; //buffer parsing finite-state-automate

        do {
            prev = next;
            next = nextStartMaxcdn(file, prev + 1);
            var str = file.toString  ('ascii', prev+1, next);
            var string = str.split('	');
            counter++;
            if (string.length < 8) {
                console.log(str);
                bads.push(str);
                continue;
            }

            var q = {
              //  querydomain: string[0],
              //  from: string[1],
              //  date: string[2],
                path: string[3],
                response: string[4],
              //  length: string[5],
              //  domain: string[6],
              //  client: string[7]
            };

            string = q.path;
            if (!string ) {
                bads.push(str);
            }
            if (string && string.indexOf('/g/') == 0) {
                stats['Multiple queries']++;
                string = string.split('/g/')[1].split(',');
                r = [];
                _.each(string, function (s) {
                    r.push(_.extend({}, q, {key: s.split('@')[0]}));
                });
                _.each(r, function (item) {

                   // results.push(item);
                    _check(item, q.path, str);
                    _count(item);
                })
            } else {
                stats['Single queries']++;
                string = string.split('/')[1];
                q.key = string;
               // results.push(q);
                _check(q, q.path, str);
                _count(q);
            }

        } while (prev != next && tryMatchingFunction(file, next, testNewline));

        stats['By project'] = JSON.stringify(stats['By project']);
       /*) stats['By response code'] = _.countBy(results, function (item) {
            return item.response;
        });*/
        stats['Bad entries by log string'] = _.countBy(bads, 'str');
        callback([bads, stats]/*[bads, stats]*/); //TODO: define some stable logical interface here
    });

};

module.exports = {
    parseNginx: parseNginx,
    parseMaxcdn: parseMaxcdn
};

/*
 var parseMaxcdn = function(filename, callback) {

 var bads = [];
 var stats = { 'By project': '',
 'GETs count': 0, 'HEADs count': 0, 'Errors count': 0, 'Multiple queries': 0, 'Single queries': 0
 };

 function _check(item, str) {
 if (!item.key || !item.response ) {
 bads.push({ str: str.split('?')[0], item: item});
 }
 }

 function _count(item){

 if (item.key) {
 if (!stats['By project'][item.key]) {
 stats['By project'][item.key] = 1;
 } else {
 stats['By project'][item.key]++;
 }
 }

 if (item.response) {
 if (!stats['By response code'][item.response]) {
 stats['By response code'][item.response] = 1;
 } else {
 stats['By response code'][item.response]++;
 }
 }
 }

 fs.readFile(filename, function (err, file) {
 // check if file read successful
 if (err) { callback([err, err]); return;}

 var results = []; //here we store :)
 var inside = false, prev, next = -1, counter=0; //buffer parsing finite-state-automate

 do {
 prev = next;
 next = nextStartMaxcdn(file, prev + 1);
 var str = file.toString  ('ascii', prev+1, next);
 var string = str.split('	');
 var q = {};

 if (string.length !=8 ) {
 bads.push(str);
 } else {
 q = {
 //  querydomain: string[0],
 //  from: string[1],
 //  date: string[2],
 path: string[3],
 response: string[4],
 //  length: string[5],
 //  domain: string[6],
 //  client: string[7]
 };

 string = q.path;
 if (string && string.indexOf('/g/') == 0) {
 stats['Multiple queries']++;
 string = string.split('/g/')[1].split(',');
 r = [];
 _.each(string, function (s) {
 r.push(_.extend({}, q, {key: s.split('@')[0]}));
 });
 _.each(r, function (item) {
 _count(item);
 //results.push(item);
 _check(item, q.path);
 })
 } else {
 stats['Single queries']++;
 string = string.split('/')[1];
 q.key = string;
 _count(q);
 //results.push(q);
 _check(q, q.path);
 }
 }
 counter++;


 } while (prev != next && tryMatchingFunction(file, next, testNewline));

 stats['By project'] = JSON.stringify(stats['By project']);
 stats['Bad entries by log string'] = _.countBy(bads, 'str');
 callback([bads, stats]); //TODO: define some stable logical interface here
});

};
 */