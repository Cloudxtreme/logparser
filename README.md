logparser
=========

abstract
--------



according to Jim Black, there will be 3 types of log. currently 2/3 processed - 
those are keyed as 'nginx' and 'maxcdn' logs

maxcdn is TabSeparatedValues, with newlines determining log item' borders 
nginx is. well i actually do not recall. 
 
anyway, parser should extract response code, requested projects names.. 
 and some other information
 
installation & running
----------------------

this currently is a work in progress, and for now will
only parse sample files listed in config.json

1. clone repo. go to folder.
2. $ npm install
3. go to config.json and setup proper paths for sample files.
to cancel file parse, comment out resp. line in config. respect commas.
currently there s only 'nginx' and 'maxcdn' file formats.
paths are relative to project root
4. $ node app
 
implementation
--------------

specifics is input files are way large (as of my opinion)
so implementation should be memory-efficient.
also, file as buffer is used, from time to time soft splits string 
between "log items terminators" and then this string 
is processed by cutting into pieces, detecting necessary info.

matching patterns is distributed between ./utils.js and ./prsr.js
utils.js contain matching logic code, and defines patterns (as arrays of 
(chars and/or arrays_of_chars) )

prsr js uses utils js as a libraly - it 'imports' required items from utils
and implements parsing logic.

in turn, app.js runs what prsr.js exports.

conclusion
==========

further logic was inside project description
would be nice to see it here.

[detailed p.l.a.n. link](https://github.com/jsdelivr/logparser/issues/1]https://github.com/jsdelivr/logparser/issues/1)

