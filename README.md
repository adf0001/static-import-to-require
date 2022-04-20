# static-import-to-require
transfer static import statement to require statement

# Install
```
npm install static-import-to-require
```

# Accepted format
```javascript

//refer https://262.ecma-international.org/11.0/#sec-imports
//refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";
import { export1 , export2 } from "module-name";
import { export1 , export2 as alias2 , [...] } from "module-name";
import defaultExport, { export1 [ , [...] ] } from "module-name";
import defaultExport, * as name from "module-name";
import "module-name";

```

* do not transfer dynamic import-calling, that is, `import(...)` with round brackets;

# Usage & Api
```javascript

var static_import_to_require = require("static-import-to-require");

function cmp(source, expect) {
	/*
	function transfer(source, options)
		options:
			.debugInfo
				show debug information
			.sourceComment
				add source comment
			.defaultKey
				default is empty, and the default export is same as name-space export, such as in node.js;
				it can be appointed a string key,
					such as "default" like that in babel, then the default export is `require("module").default`;
			.singleLine
				if set true, format multiple named-imports in single line;
	*/
	var s = static_import_to_require(source, { sourceComment: false }).toString();

	return (s === expect);
}

cmp('import def111 from "module-name";',
	'var def111= require("module-name");') &&

cmp('import defaultExport, { export1c, export2c } from "module-name";',
	'var defaultExport= require("module-name"),\n' +
	'	export1c= defaultExport.export1c,\n' +
	'	export2c= defaultExport.export2c;') &&

cmp('import defaultExport2,*as name2 from "module-name";',
	'var defaultExport2= require("module-name"),\n' +
	'	name2= defaultExport2;')

```

# Samples
```javascript

//import def111/*ccc*/from "module-name"/*as*/;
var def111= require("module-name");     //comment as splitter


//import def222 from "module-name";
var def222= require("module-name");     ///bbb

//import * as name from "module-name";
var name= require("module-name");

//import*as nameb from"module-name";
var nameb= require("module-name");      //special spaces


//import { export1 } from "module-name";
var export1= require("module-name").export1;

//import { export1 as alias1 } from "module-name";
var alias1= require("module-name").export1;

//import { export1a , export2a } from "module-name";
var module_name= require("module-name"),
        export1a= module_name.export1a,
        export2a= module_name.export2a;

//import {export1b, export2b as alias2 } from "module-name";
var module_name= require("module-name"),
        export1b= module_name.export1b,
        alias2= module_name.export2b;

//import{export1cc,export2b as alias2b}from"module-name";
var module_name= require("module-name"),
        export1cc= module_name.export1cc,
        alias2b= module_name.export2b;  //special spaces

//import defaultExport, { export1c, export2c } from "module-name";
var defaultExport= require("module-name"),
        export1c= defaultExport.export1c,
        export2c= defaultExport.export2c;

//import defaultExport2,*as name2 from "module-name";
var defaultExport2= require("module-name"),
        name2= defaultExport2;

//import     defaultExport2b, * as name2b from "module-name";
var defaultExport2b= require("module-name"),
        name2b= defaultExport2b;        //special spaces

//import "module-name";
require("module-name");

//multiple statement in 1 line
//import defaultExport3 from "module-name";
var defaultExport3= require("module-name");
//import defaultExport4 from "module-name2";
var defaultExport4= require("module-name2");

var promise = import("module-name");    //do not transfer dynamic import-calling

//single import statement in multiple lines
//import defaultExport5\n     from/*mmm*/\n     "module-name";
var defaultExport5= require("module-name");

//not started at line head
"strict mode";
//import defaultExport6 from "module-name";
var defaultExport6= require("module-name");

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

```
