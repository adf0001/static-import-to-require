

import def111/*ccc*/from "module-name"/*as*/;	//comment as splitter

import def222 from "module-name";	///bbb
import * as name from "module-name";
import*as nameb from"module-name";	//special spaces

import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";

import { export1a , export2a } from "module-name";
import {export1b, export2b as alias2 } from "module-name";
import{export1cc,export2b as alias2b}from"module-name";	//special spaces
import defaultExport, { export1c, export2c } from "module-name";
import defaultExport2,*as name2 from "module-name";
  import     defaultExport2b, * as name2b from "module-name";	//special spaces
import "module-name";

//multiple statement in 1 line
import defaultExport3 from "module-name"; import defaultExport4 from "module-name2";

var promise = import("module-name");    //do not transfer dynamic import-calling

//single import statement in multiple lines
import defaultExport5
    from/*mmm*/
	"module-name";

//not started at line head
"strict mode"; import defaultExport6 from "module-name";

//block comment
/*
import defaultExport from "module-name";
*/
/*
import defaultExport from "module-name";*/


//template strings
var s=`gfgsdfgsdf
import defaultExport from 'module-name';
fasdfas`;

var s=`gfgsdfgsdf
import defaultExport from 'module-name'`;

//multiple string, lined with ending '\'
var s="gfgsdfgsdf\
import defaultExport from 'module-name';\
fasdfas";

var s="gfgsdfgsdf\
import defaultExport from 'module-name';";
