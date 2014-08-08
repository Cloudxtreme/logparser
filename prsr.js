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


var getMatcherObject = PARSER.getMatcherObject;
var getMatcherFunction = PARSER.getMatcherFunction;
var endMatcher = getMatcherObject('response_code');
var nextStart = PARSER.nextStart;
var tryMatcherFrom = PARSER.tryMatcherFrom;
var tryMatchFrom = PARSER.tryMatchFrom;

var testQuote = getMatcherFunction ( PARSER.store.testQuoteObject, 0 );

var         nginxSampleFilePath = 'resources/sample logs/nginx/nginx sample log.log';
fs.readFile(nginxSampleFilePath, function(err, file){
   if (err) {
       console.log(err);
       return;
   }
    var poo = [];
    var inside = false;
    var prev, next = 0, countGet = 0, countHead = 0, countErrors = 0;
    do {
        prev = next;
        next = nextStart(file, prev+1);

        if (tryMatcherFrom(file, next, PARSER.store.testGetObject)) {
            countGet++;
            inside = true;
           // console.log("get at " + next);
        } else
        if (tryMatcherFrom(file, next, PARSER.store.testHeadObject)) {
            countHead++;
            inside = true;
           // console.log("head at " + next);
        }

        if (inside) {
            var fin = nextStart(file, next + 1);

            if (!tryMatcherFrom(file, fin, endMatcher)) {
                countErrors++;
            }
            else {

                var string = file.toString('ascii', next, fin+5).split(' ');
             //   console.log(string );//= file.toString('ascii', next, fin+5).split(' ');
                var q = {
                    method: string[0].replace('"', ''),
                    protocol: string[2].replace('"', ''),
                    response: string[3]
                };

                string = string[1].split('?')[0];
                if (string.indexOf('/g/')==0) {
                    string = string.split('/g/')[1].split(',');
                    r = [];
                    _.each(string, function(s){
                        r.push(_.extend({}, [q, {key: s.split('@')[0]} ]));
                    });
                    _.each(r, function(item){
                        poo.push(item);
                    })
                } else {
                    string = string.split('/')[1];
                    q.key = string;
                    poo.push(q);
                }
            }
            inside = false;
        }

    } while (prev!=next && tryMatchFrom(file, next, testQuote));
    var moo = _.countBy(poo, function(item){
        return item.key;
    });
    var zoo = _.countBy(poo, function(item){
        return item.response;
    });
    var koo = _.countBy(poo, function(item){
        return item.protocol;
    });
    var roo = _.countBy(poo, function(item){
        return item.method;
    });
    console.log(JSON.stringify(moo));
    console.log();
    console.log(countGet + 'gets' );
    console.log();
    console.log(JSON.stringify(zoo));
    console.log();
    console.log(countHead + 'heads' );
    console.log(JSON.stringify(koo));
    console.log(JSON.stringify(roo));
    console.log();
    console.log(countErrors + 'errors' );
});
