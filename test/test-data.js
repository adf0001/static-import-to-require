
//global variable, for html page, refer tpsvr @ npm.
static_import_to_require = require("../static-import-to-require.js");

module.exports = {

	"default": function (done) {
		//if (typeof window !==/=== "undefined") throw "disable for browser/nodejs";

		function cmp(source, expect) {
			var s = static_import_to_require(source).toString();
			if (s === expect) return true;
			console.error("compare fail, source: " + source);
			console.log("expect: " + expect);
			console.log("result: " + s);
			return false;
		}

		done(!(
			cmp('import def111 from "module-name";',
				'var def111= require("module-name");') &&
			cmp('import def111 from "module-name"	//comment',
				'var def111= require("module-name");	//comment') &&
			cmp(' 	 import def111 from "module-name" 	 //spaces',
				' 	 var def111= require("module-name"); 	 //spaces') &&
			cmp('import def111/*ccc*/from "module-name"/*as*/;	//comment as splitter',
				'var def111= require("module-name");	//comment as splitter') &&
			cmp("import def111 from 'module-name';	//quotation mark",
				"var def111= require('module-name');	//quotation mark") &&

			cmp('import * as name from "module-name";',
				'var name= require("module-name");') &&
			cmp('import*as nameb from"module-name";		//special spaces',
				'var nameb= require("module-name");		//special spaces') &&

			cmp('import { export1 } from "module-name";',
				'var export1= require("module-name").export1;') &&
			cmp('import { export1 as alias1 } from "module-name";',
				'var alias1= require("module-name").export1;') &&

			cmp('import { export1a , export2a } from "module-name";',
				'var module_name= require("module-name"),\n' +
				'	export1a= module_name.export1a,\n' +
				'	export2a= module_name.export2a;') &&
			cmp('import {export1b, export2b as alias2 } from "module-name";',
				'var module_name= require("module-name"),\n' +
				'	export1b= module_name.export1b,\n' +
				'	alias2= module_name.export2b;') &&
			cmp('import{export1cc,export2b as alias2b}from"module-name";  //special spaces',
				'var module_name= require("module-name"),\n' +
				'	export1cc= module_name.export1cc,\n' +
				'	alias2b= module_name.export2b;  //special spaces') &&

			cmp('import defaultExport, { export1c, export2c } from "module-name";',
				'var defaultExport= require("module-name"),\n' +
				'	export1c= defaultExport.export1c,\n' +
				'	export2c= defaultExport.export2c;') &&

			cmp('import defaultExport2,*as name2 from "module-name";',
				'var defaultExport2= require("module-name"),\n' +
				'	name2= defaultExport2;') &&
			cmp(' import     defaultExport2b, * as name2b from "module-name";  //special spaces',
				' var defaultExport2b= require("module-name"),\n' +
				'	name2b= defaultExport2b;  //special spaces') &&

			cmp('import "module-name";',
				'require("module-name");') &&

			cmp(' import defaultExport3 from "module-name"; import defaultExport4 from "module-name2"; //multiple statement in 1 line',
				' var defaultExport3= require("module-name"); var defaultExport4= require("module-name2"); //multiple statement in 1 line') &&

			cmp('var promise = import("module-name");    //do not transfer dynamic import-calling',
				'var promise = import("module-name");    //do not transfer dynamic import-calling') &&

			cmp('import defaultExport5\n' +
				'	from/*mmm*/\n' +
				'	"module-name";  //single import statement in multiple lines',
				'var defaultExport5= require("module-name");  //single import statement in multiple lines') &&

			true
		));
	},

	"options.sourceComment": function (done) {
		//if (typeof window !==/=== "undefined") throw "disable for browser/nodejs";

		function cmp(source, expect) {
			var s = static_import_to_require(source, { sourceComment: true }).toString();
			if (s === expect) return true;
			console.error("compare fail, source: " + source);
			console.log("expect: " + expect);
			console.log("result: " + s);
			return false;
		}

		done(!(
			cmp('import def111 from "module-name";',
				'\n//import def111 from "module-name";\n' +
				'var def111= require("module-name");') &&

			cmp('import def111 from "module-name"	//comment',
				'\n//import def111 from "module-name"\n' +
				'var def111= require("module-name");	//comment') &&
			cmp(' 	 import def111 from "module-name" 	 //spaces',
				' 	 ' +
				'\n//import def111 from "module-name"\n' +
				'var def111= require("module-name"); 	 //spaces') &&
			cmp('import def111/*ccc*/from "module-name"/*as*/;	//comment as splitter',
				'\n//import def111/*ccc*/from "module-name"/*as*/;\n' +
				'var def111= require("module-name");	//comment as splitter') &&


			 cmp(' import defaultExport3 from "module-name"; import defaultExport4 from "module-name2"; //multiple statement in 1 line',
			 	' '+
				 '\n//import defaultExport3 from "module-name";\n'+
				 'var defaultExport3= require("module-name"); '+
				 '\n//import defaultExport4 from "module-name2";\n'+
				 'var defaultExport4= require("module-name2"); //multiple statement in 1 line') &&


			cmp('import defaultExport5\n' +
				'	from/*mmm*/\n' +
				'	"module-name";  //single import statement in multiple lines',
				'\n//import defaultExport5\\n 	from/*mmm*/\\n 	"module-name";\n'+
				'var defaultExport5= require("module-name");  //single import statement in multiple lines') &&

			true
		));
	},

	"sample files & options": function (done) {
		if (typeof window !== "undefined") throw "disable for browser";
		var fs = require("fs");

		var fn = __dirname + "/sample/sample.js";
		var txt = fs.readFileSync(fn);

		console.log("---------------------------");
		console.log(static_import_to_require(txt, { debugInfo: true, sourceComment: true }));

		done(false);
	},

};

// for html page
//if (typeof setHtmlPage === "function") setHtmlPage("title", "10em", 1);	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('static_import_to_require', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(5000); } });