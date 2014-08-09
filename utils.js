/**
 * Created by angelo on 8/8/14.

    file contents:
        .ERR,
        .PARSER
 *
 **/

// --- errors domain ---
var ERR = {
    thrrrow: function (error) {

        console.log('');
        console.log('<<<                        <<<');
        console.log('*****ERROR********************');
        console.log(error);
        console.log('***************ERROR****END***');
        console.log('<<<                        >>>');

        console.log('');
    }
};
exports.ERR = ERR;
// --- errors domain ends. ---



// --- --- PARSER DOMAIN --- --- TODO: give names that make sense
// --- data subdomain ---
// single chars
var dq = 0x22; // double quote
var nginx_quote = dq; // see resources/sample logs/nginx/
var space = 0x20; //
var new_line = 0x0a; // not used currently but definetely will be needed next :)

// currently used when in certain position matches >1 symbol, see example below
var patterns__sets = {
    digits1_5: [0x31, 0x32, 0x33, 0x34, 0x35], //[1-5], is used to match http response codes
    digits: [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30] //[123456789900]
};

// exporting prev. to global ns
var ASCII_CHARS = {
    A: 0x41,
    B: 0x42,
    C: 0x43,
    D: 0x44,
    E: 0x45,
    F: 0x46,
    G: 0x47,
    H: 0x48,
    I: 0x49,
    J: 0x4A,
    K: 0x4B,
    L: 0x4C,
    M: 0x4D,
    N: 0x4E,
    O: 0x4F,
    P: 0x50,
    Q: 0x51,
    R: 0x52,
    S: 0x53,
    T: 0x54
};

var a = ASCII_CHARS;
var digits = patterns__sets.digits;
var digits1_5 = patterns__sets.digits1_5;

// matcher is an array.
// if array item is a char (0-255) value, then it s the only char suitable
// if array item is array itself - then every item from that array suitable
// no variable length strings etc is supported
var matchers__dict = {
    nginx_quote: [nginx_quote],
    methods: {
        get: [nginx_quote, a.G, a.E, a.T, space], // TODO: ascii.G, ascii.E, ascii.T => a.G, a.E, a.T
        head: [nginx_quote, a.H, a.E, a.A, a.D, space],
        put: [], //todo:
        post: [] //todo:
    },
    response_code: [nginx_quote, space, digits1_5, digits, digits, space]
};
// --- data subdomain ends. ---

// --- code subdomain ---
var MATCHERS_STORAGE_OBJECT = matchers__dict;

//just extracts matcher from matchers__dict.
var _getMatcherAsArray = function(key){
    var ks = key.split('.');
    var pool = MATCHERS_STORAGE_OBJECT;
    for (var ii=0; ii<ks.length; ii++) {
        pool = pool[ks[ii]];
        if (!pool) {
            thrrrow({
                errorMessage: 'no such matcher :)',
                function: 'getMatcherArray',
                key: key,
                segment: ks[ii]
            })
        }
        if (Array.isArray(pool)) {
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
    var matcherArray = _getMatcherAsArray(key);
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

//TODO: could accept key.path, not only matcherObject here
var getMatcherFunction = function(matcherObject, localPosition){
    return matcherObject.matcherFunctions[localPosition];
};

//true if matches
var tryMatchingFunction = function (buffer, index, matcherFunction){
    return matcherFunction(buffer[index]);
};

var tryMatcherObject = function(buffer, index, matcherObject){
    var mf = matcherObject.matcherFunctions;
    for (var i=0; i< mf.length; i++) {
        if (!tryMatchingFunction(buffer, index+ i, mf[i])) return false;
    }
    return true;
};
// --- code subdomain ends. ---

// --- exports subdomain ---
var testQuoteObject = getMatcherObject('nginx_quote');
var testGetObject = getMatcherObject('methods.get');
var testHeadObject = getMatcherObject('methods.head');

var testQuote = getMatcherFunction ( testQuoteObject, 0 );

/*
var getOffset = function(testObject){ //TODO rename
    return testObject.matcherFunctions.length;
};*/

exports.PARSER = {
    getMatcherFunction: getMatcherFunction,
    getMatcherObject: getMatcherObject,

    tryMatchingFunction: tryMatchingFunction,
    tryMatcherObject: tryMatcherObject,

    storeNginx: {
        testQuoteObject:testQuoteObject,
        testGetObject: testGetObject,
        testHeadObject: testHeadObject,
        testQuote: testQuote,
        responseCodeMatcher: getMatcherObject('response_code')
    }
};
// --- exports subdomain ends. ---
// --- --- PARSER DOMAIN ends --- ---