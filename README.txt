# ##########################################################################################
# 
#
# logparser
# =========
#
#
# abstract
# --------

# below is 'logparser for jsdelivr ' project's documentation

# according to Jim Black, there will be 3 types of log. currently 2/3 processed - 
# those are keyed as 'nginx' and 'maxcdn' logs

# (i would appreciate if you, Jim :],  commit small (well smaller than 8M or 420M)
#  logs sample to paths 
#  '/recources/sample logs/nginx' 
#  '/recources/sample logs/maxcdn'
#  (as well as to create folder for third type, if any. ) )
 
# maxcdn is TabSeparatedValues, with newlines determining log item' borders 
# nginx is. well i actually do not recall. 
 
#  anyway, parser should extract response code, requested projects names.. 
#  and some other information
 
 
 
# implementation
# --------------

# specifics is input files are way large (as of my opinion)
# so implementation should be memory-efficient.
# also, file as buffer is used, from time to time soft splits string 
# between "log items terminators" and then this string 
# is processed by cutting into pieces, detecting necessary info.

# matching patterns is distributed between ./utils.js and ./prsr.js
# utils.js contain matching logic code, and defines patterns (as arrays of 
(chars and/or arrays_of_chars) )

#   prsr js uses utils js as a libraly - it 'imports' required items from utils
#   and implements parsing logic.

#   in turn, app.js runs what prsr.js exports.

## Conclusion
## =============

### remark
#documentation format:
#@<word>. ended with dot is item definition.
#@ <word> is invoking variable into context


# conclusion
# ==========

# further logic was inside project description
# would be nice to see it here.

 