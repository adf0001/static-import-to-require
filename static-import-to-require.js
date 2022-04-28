
//static-import-to-require @ npm, transfer static import statement to require statement.

var acorn = require('acorn');
var falafel = require('falafel');

/*
Accepted format

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

*/

//textSeedObject: { id, text }
function importVarName(textSeedObject) {
	if (!textSeedObject.id) textSeedObject.id = 1;

	var sid;
	while (textSeedObject.text.indexOf(sid = "_import_" + (textSeedObject.id++) + "_") >= 0) { }
	return sid;
}

function formatSourceComment(source, options, lineHead) {
	if (!options || !options.sourceComment) return "";

	return (lineHead ? "" : "\n") + "//" + source.replace(/[\r\n]+/g, "\\n ") + "\n";
}

var ECMA_VERSION = 99;	//to avoid SyntaxError by dynamic import-calling `import()`, or other future error.

function removeComment(source) {
	var a = [], lastEnd = 0;
	acorn.parse(source, {
		sourceType: 'module', ecmaVersion: ECMA_VERSION,
		onComment: function (block, text, start, end) {
			a.push(source.slice(lastEnd, start));
			lastEnd = end;
		}
	});
	if (!a.length) return source;	//have no comment

	a.push(source.slice(lastEnd));
	return a.join(" ");		//block comment can be a splitter like a space
}

var regImport = /\bimport\b/;
var defaultFalafelOptions = { sourceType: 'module', ecmaVersion: ECMA_VERSION };

var regLineHead = /[\r\n]$/;

var regModuleName = /\b(from|import)\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/;

//return boolean
var fastCheck = function (source) {
	return regImport.test(source);
}

//return callback object { node: function(node), final: function(result) }
var falafelCallback = function (source, options) {
	var textSeedObject = { text: source };

	var defaultKey = options && options.defaultKey;
	var splitter = (options && options.singleLine) ? ", " : ",\n\t";

	return {
		node: function (node) {
			if (node.type === 'ImportDeclaration') {
				//console.log(node);

				var itemSource = node.source();
				if (options && options.debugInfo) { console.log("match line: " + itemSource); }
				var lineHead = node.start ? regLineHead.test(source.slice(node.start - 1, node.start)) : true;

				var moduleName = removeComment(itemSource).match(regModuleName)[2];
				var newSource;

				if (node.specifiers && node.specifiers.length > 0) {
					var varName, i, imax;

					switch (node.specifiers[0].type) {
						case "ImportDefaultSpecifier":

							imax = node.specifiers.length;
							if (imax === 1) {
								//import defaultExport from "module-name";

								newSource = formatSourceComment(itemSource, options, lineHead) +
									"var " + node.specifiers[0].local.name + "= require(" + moduleName + ")" +
									(defaultKey ? ("." + defaultKey) : "") + ";";
							}
							else {

								if (node.specifiers[1].type === "ImportNamespaceSpecifier") {
									//import defaultExport, * as name from "module-name";

									varName = node.specifiers[defaultKey ? 1 : 0].local.name;
									newSource = formatSourceComment(itemSource, options, lineHead) +
										"var " + varName + "= require(" + moduleName + ")" + splitter +	//1st
										node.specifiers[defaultKey ? 0 : 1].local.name + "= " +		//2nd
										varName + (defaultKey ? ("." + defaultKey) : "") + ";";
								}
								else {
									//import defaultExport, { export1 [ , [...] ] } from "module-name";

									varName = defaultKey ? importVarName(textSeedObject) : node.specifiers[0].local.name;

									newSource = formatSourceComment(itemSource, options, lineHead) +
										"var " + varName + "= require(" + moduleName + ")";

									if (defaultKey)
										newSource += splitter + node.specifiers[0].local.name + "= " +
											varName + "." + defaultKey;

									for (i = 1; i < imax; i++) {
										newSource += splitter + node.specifiers[i].local.name + "= " +
											varName + "." + node.specifiers[i].imported.name;
									}
									newSource += ";";
								}
							}
							break;
						case "ImportNamespaceSpecifier":
							//import * as name from "module-name";

							newSource = formatSourceComment(itemSource, options, lineHead) +
								"var " + node.specifiers[0].local.name + "= require(" + moduleName + ");";
							break;
						case "ImportSpecifier":
							// import { export1 } from "module-name";
							// import { export1 as alias1 } from "module-name";
							// import { export1 , export2 } from "module-name";
							// import { export1 , export2 as alias2 , [...] } from "module-name";

							imax = node.specifiers.length;
							if (imax == 1) {
								newSource = formatSourceComment(itemSource, options, lineHead) +
									"var " + node.specifiers[0].local.name +
									"= require(" + moduleName + ")." + node.specifiers[0].imported.name + ";";
							}
							else {
								varName = importVarName(textSeedObject);
								newSource = formatSourceComment(itemSource, options, lineHead) +
									"var " + varName + "= require(" + moduleName + ")";

								for (i = 0; i < imax; i++) {
									newSource += splitter + node.specifiers[i].local.name + "= " +
										varName + "." + node.specifiers[i].imported.name;
								}
								newSource += ";";
							}
							break;
						default:
							return;
					}

				}
				else {
					//import "module-name";

					newSource = formatSourceComment(itemSource, options, lineHead) +
						"require(" + moduleName + ");";
				}

				if (newSource && itemSource !== newSource) {
					//console.log("new  : "+newSource);
					node.update(newSource);
				}
			}
		}
	}
}

/*
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
	.falafelOptions
		options passed to falafel, default { sourceType: 'module', ecmaVersion: 99 };
*/
function transfer(source, options) {
	if (!fastCheck(source)) return source;

	var cbo = falafelCallback(source, options);

	var resultSource = falafel(source, (options && options.falafelOptions) || defaultFalafelOptions, cbo.node);

	if (cbo.final) resultSource = cbo.final(resultSource);

	return resultSource.toString();
}

//module

module.exports = exports = transfer;

exports.fastCheck = fastCheck;
exports.falafelCallback = falafelCallback;
exports.defaultFalafelOptions = Object.assign({}, defaultFalafelOptions);
