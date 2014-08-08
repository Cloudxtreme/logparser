#!/bin/node

//throw an exception lol
var _ = require('underscore');

var thrrrow = function(error){
    console.log('*****************ERROR********')
    console.log(error);

    console.log('<<<')
    console.log('')
};

var dq = 0x22; // double quote
var nginx_quote = dq; //
var space = 0x20; //
var new_line = 0x0a; //

var patterns__sets = {
	digits: [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30], //[123456789900]
    digits1_5: [0x31, 0x32, 0x33, 0x34, 0x35] //[1-5]
};

var digits = patterns__sets.digits;
var digits1_5 = patterns__sets.digits1_5;

var matchers__dict = {
	nginx_quote: [nginx_quote],
	methods: {
		get: [nginx_quote, 0x47, 0x45, 0x54, space],
		head: [nginx_quote, 0x48, 0x45, 0x41, 0x44, space]
	},
	response_code: [nginx_quote, space, digits1_5, digits, digits, space]
};

var MATCHERS_OBJECT = matchers__dict;

var getMatcherArray = function(key){
	var ks = key.split('.');
	var pool = MATCHERS_OBJECT;
	for (i=0; i<ks.length; i++) {
		pool = pool[ks[i]];
		if (!pool) {
			thrrrow({
                errorMessage: 'no such matcher :)',
                function: 'getMatcherArray',
				key: key,
				segment: ks[i]
			})			
		}
		if (Array.isArray(pool)) {
			//console.log(ks.length-1);
            //console.log(pool);
			return pool;
		}
	}
	return pool;
};

var getMatcherObject = function(key){
    var get_matcher_function = function(item){
        var mfSingle        = function(byte){            return (byte == item)        };
        var mfMultiple      = function(byte){
            return (item.indexOf(byte) > -1)
        };
        return Array.isArray(item) ? mfMultiple : mfSingle;
    };

    var ret = {meta: {key: key}};

    var matcherArray = getMatcherArray(key);
    if (!Array.isArray(matcherArray)){
        thrrrow({
            errorMessage: 'no such matcher :)',
            function: 'getMatcherObject'
        })
    }
    ret.matcherArray = matcherArray;

    ret.matcherFunctions = [];
    matcherArray.forEach(function(matcherItem){
        ret.matcherFunctions.push(get_matcher_function(matcherItem));
    });

    return ret;
};

var testQuoteObject = getMatcherObject('nginx_quote');
var testGetObject = getMatcherObject('methods.get');
var testHeadObject = getMatcherObject('methods.head');

var startMatchers = [testGetObject, testHeadObject];
var endMatcher = getMatcherObject('response_code');

var getMatcherFunction = function(matcherObject, localPosition){
    return matcherObject.matcherFunctions[localPosition];
};

var testQuote = getMatcherFunction ( testQuoteObject, 0 );

//true if matches
var tryMatchFrom = function (buffer, index, matcherFunction){
    return matcherFunction(buffer[index]);
};

var tryMatcherFrom = function(buffer, index, matcherObject){
    var mf = matcherObject.matcherFunctions;
    //console.log(matcherObject.matcherArray);
    for (var i=0; i< mf.length; i++) {
        if (!tryMatchFrom(buffer, index+ i, mf[i])) return false;
    }
    return true;
};

function nextStart(buffer, resumePosition) {
    while (buffer.length >= resumePosition++ && !tryMatchFrom(buffer, resumePosition, testQuote)){
    }
    return resumePosition;
}

module.exports = {
  getMatcherArray: getMatcherArray,
  getMatcherFunction: getMatcherFunction,
  tryMatchFrom: tryMatchFrom,
  nextStart: nextStart
};

var fs = require('fs');

fs.readFile('tests/methods', function(err, linkString){
	if (!err) {
        //console.log(linkString);
    }
});

var getOffset = function(testObject){
    return testObject.matcherFunctions.length;
};

fs.readFile('sample/access.log', function(err, buf){
   if (err) {
       console.log(err);
       return;
   }
    var poo = [];
    var inside = false;
    var prev, next = 0, countGet = 0, countHead = 0, countErrors = 0;
    do {
        prev = next;
        next = nextStart(buf, prev+1);

        if (tryMatcherFrom(buf, next, testGetObject)) {
            countGet++;
            inside = true;
           // console.log("get at " + next);
        } else
        if (tryMatcherFrom(buf, next, testHeadObject)) {
            countHead++;
            inside = true;
           // console.log("head at " + next);
        }

        if (inside) {
            var fin = nextStart(buf, next + 1);

            if (!tryMatcherFrom(buf, fin, endMatcher)) {
                countErrors++;
            }
            else {
              //  console.log('length is ' + (fin - next));
                var string = buf.toString('ascii', next, fin).split(' ');
                string.pop();
                string.shift();
                string = (string.join(' ').split('?')[0]);
                if (string.indexOf('/g/')==0) {
                    string = string.split('/g/')[1].split(',');
                    _.each(string, function(s){
                        poo.push(s.split('@')[0]);
                    })
                } else {
                    string = string.split('/')[1];
                    poo.push(string);
                }


            }
            inside = false;
        }

    } while (prev!=next && tryMatchFrom(buf, next, testQuote));
    var moo = _.countBy(poo);
    console.log(JSON.stringify(moo));
    console.log(countGet + 'gets' );
    console.log(countHead + 'heads' );
    console.log(countErrors + 'errors' );
});
