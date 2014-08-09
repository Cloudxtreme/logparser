#!/bin/node

//throw an exception lol
var parser = require('./prsr');
var filename = 'resources/sample logs/nginx/nginx sample log.log';
parser.parseNginx(filename, function(ret) {
    var bads = ret[0];
    var stats = ret[1];
    console.log("1. List of entries which could not be counted: ");
    console.log(bads);
    console.log();
    console.log();
    console.log("2. Staticstics for log file '" + filename + "'");
    console.log(stats);
});