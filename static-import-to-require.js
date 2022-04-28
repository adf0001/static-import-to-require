
//static-import-to-require @ npm, transfer static import statement to require statement.

var acorn = require('acorn');
var falafel = require('falafel');

function formatNamedImports(namedPartial, spaceName, moduleName, options) {
	var sn = spaceName || moduleName.slice(1, -1).replace(/\W/g, "_");
	var splitter = (options && options.singleLine) ? ", " : ",\n\t";

	var sa = namedPartial.replace(/(^[\s\{,]+|[\s\},]+$)/g, "").split(",");
	var i, imax = sa.length, si, mr, a = [];
	for (i = 0; i < imax; i++) {
		si = sa[i];
		mr = si.match(/^\s*(\w+)(\s+as\s+\w+)?/);
		if (!mr) continue;	//may empty

		if (mr[2]) a[a.length] = mr[2].match(/\w+$/)[0] + "= " + sn + "." + mr[1];	//alias
		else a[a.length] = mr[1] + "= " + sn + "." + mr[1];
	}

	if (!a.length) return "";

	if (spaceName) return a.join(splitter);	//spaceName already exists

	if (a.length === 1 && !spaceName) {
		//only 1 item, rebuild single line.
		if (mr[2]) return mr[2].match(/\w+$/)[0] + "= require(" + moduleName + ")." + mr[1];	//alias
		else return mr[1] + "= require(" + moduleName + ")." + mr[1];
	}

	return sn + "= require(" + moduleName + ")" + splitter + a.join(splitter);
}

function formatSourceComment(source, options) {
	if (!options || !options.sourceComment) return "";

	return "\n//" + source.replace(/[\r\n]+/g, "\\n ") + "\n";
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

/*
refer https://262.ecma-international.org/11.0/#sec-imports

Syntax
	ImportDeclaration:
		import ImportClause FromClause;
		import ModuleSpecifier;
	ImportClause:
		ImportedDefaultBinding
		NameSpaceImport
		NamedImports
		ImportedDefaultBinding,NameSpaceImport
		ImportedDefaultBinding,NamedImports
*/

function transferSource(source, options) {
	var s = removeComment(source).replace(/^import\s*/, "");	//remove 'import' and the following spaces

	switch (s.charAt(0)) {
		case "*":	//import * as name from "module-name";
			return s.replace(/^\*\s*as\s+(\S+)\s+from\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/,
				function (m, p1, p2) {
					//NameSpaceImport
					return formatSourceComment(source, options) +
						"var " + p1 + "= require(" + p2 + ");";
				});
		case "{":	//import { export1 , export2 as alias2  } from "module-name";
			return s.replace(/^\{([^\}]*)\}\s*from\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/,
				function (m, p1, p2) {
					//NamedImports
					return formatSourceComment(source, options) +
						"var " + formatNamedImports(p1, null, p2, options) + ";";
				});
		case "\"":	//import "module-name";
			return s.replace(/^([\'\"][^\'\"]+[\'\"])[\s;]*$/,
				function (m, p1) {
					//import ModuleSpecifier;
					return formatSourceComment(source, options) +
						"require(" + p1 + ");";
				});
		default:	//import defaultExport (,* as \w+)? (,{...})? from "module-name";
			var defaultKey = options && options.defaultKey;
			var splitter = (options && options.singleLine) ? ", " : ",\n\t";

			return s.replace(/^([^\s,]+)(\s*,\s*\*\s*as\s+[^\s,]+)?(\s*,\s*\{[^\}]*\})?\s*from\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/,
				function (m, p1, p2, p3, p4) {

					if (!p2 && !p3) {
						//ImportedDefaultBinding
						return formatSourceComment(source, options) +
							"var " + p1 + "= require(" + p4 + ")" + (defaultKey ? ("." + defaultKey) : "") + ";";
					}
					else if (!p3) {
						//ImportedDefaultBinding,NameSpaceImport
						var nm = p2.match(/\S+$/)[0];

						if (defaultKey) {
							return formatSourceComment(source, options) +
								"var " + nm + "= require(" + p4 + ")" + splitter + p1 + "= " + nm + "." + defaultKey + ";";
						}
						else {
							return formatSourceComment(source, options) +
								"var " + p1 + "= require(" + p4 + ")" + splitter + nm + "= " + p1 + ";";
						}
					}
					else if (!p2) {
						//ImportedDefaultBinding,NamedImports
						if (defaultKey) {
							return formatSourceComment(source, options) +
								"var " + formatNamedImports("{" + defaultKey + " as " + p1 + ", " + p3.replace(/^[\s\{,]+/, ""), null, p4, options) + ";";
						}
						else {
							return formatSourceComment(source, options) +
								"var " + p1 + "= require(" + p4 + ")" + splitter + formatNamedImports(p3, p1, null, options) + ";";
						}
					}
					else return m;	//unknown
				});
	}
}

var regImport = /\bimport\b/;
var defaultFalafelOptions = { sourceType: 'module', ecmaVersion: ECMA_VERSION };

//return boolean
var fastCheck = function (source) {
	return regImport.test(source);
}

//return callback object { node: function(node), final: function(result) }
var falafelCallback = function (source, options) {
	return {
		node: function (node) {
			if (node.type === 'ImportDeclaration') {
				//console.log(node);

				var itemSource = node.source();

				if (options && options.debugInfo) { console.log("match line: " + itemSource); }

				//console.log("clear: "+removeComment(node.source()));
				var newSource = transferSource(itemSource, options);

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
