var path = require('path');
var format = require('util').format;

exports.init = function(grunt) {
  var ast = require('cmd-util').ast;
  var iduri = require('cmd-util').iduri;

  var exports = {};

  exports.html2jsParser = function(fileObj, options) {
    // don't transport debug html files
    if (/\-debug\.html/.test(fileObj.src)) return;

    grunt.log.verbose.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);
    // transport html to js
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var id = unixy(options.idleading + fileObj.name.replace(/\.js$/, ''));

    data = html2js(data, id);
    data = ast.getAst(data).print_to_string(options.uglify);
    var dest = fileObj.dest + '.js';
    grunt.file.write(dest, data);

    if (!options.debug) {
      return;
    }
    dest = dest.replace(/\.html\.js$/, '-debug.html.js');

    data = ast.modify(data, function(v) {
      var ext = path.extname(v);
      if (ext && options.parsers[ext]) {
        return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
      } else {
        return v + '-debug';
      }
    });
    data = data.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  };

  exports.jsonParser = function(fileObj, options) {
    var dest = fileObj.dest + '.js';
    grunt.log.verbose.writeln('Transport ' + fileObj.src + ' -> ' + dest);

    var id = unixy(options.idleading + fileObj.name.replace(/\.js$/, ''));
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var code = format('define("%s", [], %s)', id, data);
    var astCache = ast.getAst(code);

    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);

    // create debug file
    if (!options.debug) {
      return;
    }
    dest = dest.replace(/\.json\.js$/, '-debug.json.js');

    astCache = ast.modify(astCache, function(v) {
      var ext = path.extname(v);
      if (ext && options.parsers[ext]) {
        return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
      } else {
        return v + '-debug';
      }
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  };
  return exports;
};


// helpers
function html2js(code, id) {
  var tpl = 'define("%s", [], "%s");';

  code = code.split(/\r\n|\r|\n/).map(function(line) {
    return line.replace(/\\/g, '\\\\');
  }).join('\n');

  code = format(tpl, id, code.replace(/\"/g, '\\\"'));
  return code;
}

function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

exports.html2js = html2js;
