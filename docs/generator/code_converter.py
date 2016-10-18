#!/usr/bin/env python
# -*- coding: utf-8 -*-
#!/usr/bin/python
#
#	doxy_preprocess.py
#	
#	creator:	kan.k
#	created:	[2013-12-06 18:18:06+09:00]
#	modified:	[2013-12-10 19:29:12+09:00]
#	description:
#       Converting function notation.
#       This is just easy made script to generate doc with less effort.
#       少ない手数で、ドキュメントを作ろうとするための簡易スクリプト。
#	

import sys
import optparse
import os

class PlainDescriptionHelpFormatter(optparse.IndentedHelpFormatter):
    def format_description(self, description):
        if description:
            if self.parser is not None:
                return self.parser.expand_prog_name(description.strip()) + "\n"
            else:
                return description.strip() + "\n"
            # return self._format_text(description) + "\n"
        else:
            return ""

parser = optparse.OptionParser(
    formatter=PlainDescriptionHelpFormatter(),
    usage="usage: %prog [options]",
    description="""
Converting code.
""",
    epilog=None
)

###################################
##	Common arguments
###################################

parser.add_option(
    "-v", "--verbose",
    action='store_true',
    dest='verbose',
    help="verbose mode."
    )

###################################
##	Argument Check and Mapping
###################################

(options, args) = parser.parse_args(sys.argv)

infilepath = None
if len(args) > 1:
    infilepath = args[1]

##@}


######################################################################
##	Domestic classes
######################################################################
##@{

##@}


######################################################################
##	Domestic functions
######################################################################
##@{

##@}


######################################################################
##	Main Part
######################################################################
##@{

import re

func_decl_re = re.compile(r"""^
(\s*
(?:private\s*)?
(?:static\s*)?
(?:(?:get|set)\s*)?
)                                   # preseeding white

(?:function\s*)?
(
  ([a-zA-Z_\$][a-zA-Z0-9_]*)              # function, method or parameter name.
  \(
     (?:
     [^\(\)\;]*
     \(
     [^\(\)\;]*
     \)
     )*                                 # Counting parens.
     [^\(\)\;]*
  \)                                    # function parameters part
)                                       # function name and params
  (?:\s*\:\s*
    ([a-zA-Z_][a-zA-Z0-9_]*)            # return param types.
  )?
(\s*
  (?:\{|;)                              # function paren or decration end.
.*\s*)                                  # trailing
$""", re.VERBOSE)

member_decl_re = re.compile(r"""^
(\s*
(?:private\s*)?
(?:static\s*)?
(?:(?:get|set)\s*)?
)                                   # preseeding white
(
  ([a-zA-Z_\$][a-zA-Z0-9_]*)              # member, method or parameter name.
)                                       # member name and params
  (?:\s*\:\s*
    ([a-zA-Z_][a-zA-Z0-9_]*)            # return param types.
  )?
(\s*
  ;                                     # member decration end.
.*\s*)                                  # trailing
$""", re.VERBOSE)


func_decl_start_re = re.compile(r"""^
(\s*
(?:private\s*)?
(?:static\s*)?
(?:(?:get|set)\s*)?
)                                   # preseeding white
(?:function\s*)?
  ([a-zA-Z_\$][a-zA-Z0-9_]*)              # function name
  \(.*
""", re.VERBOSE)


func_decl_cancel_re = re.compile(r"""^
\s+(?:[^\s]+\s+)*
(?:\}|;)
""", re.VERBOSE)

linetomatch = ''

reference_re = re.compile(r"""^
/
(
  //\s*<reference
)
""", re.VERBOSE)

fhin = sys.stdin
if infilepath is not None:
    fhin = open(infilepath, 'r')

line = fhin.readline()

while line != '':
    # print "fetching: %s" % line
    m = member_decl_re.match(line)
    if m is not None:
        ms = m.groups()
        if ms[3] is not None:
            sys.stdout.write(ms[0] + ms[3] + " " + ms[1] + ms[4])
        else:
            sys.stdout.write(line)
        # print "as member %s" % repr(ms)
        line = fhin.readline()
        continue
        
    m = func_decl_start_re.match(line)
    if m is not None:
        # print repr(m)
        linetomatch = line
        # print "hoga"
        m = func_decl_re.match(linetomatch)
        while m is None and line != '':
            # print repr(m)
            line = fhin.readline()
            linetomatch += line
            m = func_decl_re.match(linetomatch)
            # print "start %s" % linetomatch
            # if func_decl_cancel_re.search(linetomatch):
            # print "start match"
            if m is None and func_decl_cancel_re.match(linetomatch):
                # print "end match"
                # print "break"
                break
            # print "end match"

            # print "end"

        if m is not None:
            ms = m.groups()
            if ms[3] is not None:
                sys.stdout.write(ms[0] + ms[3] + " " + ms[1] + ms[4])
            else:
                sys.stdout.write(linetomatch)
            # print "as func"
        else:
            sys.stdout.write(linetomatch)
            # print "as regular"
    else:
        m = reference_re.match(line)
        if m is not None:
            ms = m.groups()
            sys.stdout.write(ms[0])
        else:
            sys.stdout.write(line)
        # print "as regular"
    line = fhin.readline()

fhin.close()

##@}

