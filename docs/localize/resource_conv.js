/**
 * PMO Web Resource converter (from ods to messages/messages.*.res)
 *
 * Usage: 'cscript resource_conv.js' in Command prompt window
 *
 * How to use:
 * 1. Place "messages_webfrontend.xlsx" (Language resource file) at same directory.
 * 2. Open "Command Prompt" window from [Start] menu of Windows.
 * 3. Type "cd /d <this_directory>" and press Enter.
 * 4. Type "cscript resource_conv.js" and press Enter.
 * 5. Then this converter output application locale files "messages.<localeKey>" (i.e: messages.en-us, messages.ja-jp, ...)
 */

/*jshint boss: true */

var outputBOM = false;

var fso = new ActiveXObject('Scripting.FileSystemObject');

function log(s) {
    try {
        WScript.StdOut.WriteLine(s);
    } catch (e) {
        var message = "Usage 'cscript resource_conv.js' in Command prompt window";
        WScript.Echo(message);
        throw new Error(message);
    }
}
var console = { log: log };

/**
 * JSON file formatter
 */
var JsonFormatter = function (singular) {
    var self = this;
    this.singluer = singular;
    this.requireDefaultFile = false;
    // [Garage customize]
    this.folderName = '..\\..\\app\\res\\locales';
    // [Garage customize]
    this.formatLine = function (key, value) {
        var v2 = '' + value;
        return '  "' + key + '": "' + v2.replace(/"/g, '\\"') + '",\n';
    };
    this.formatLastLine = function (key, value) {
        var v2 = '' + value;
        return '  "' + key + '": "' + v2.replace(/"/g, '\\"') + '"\n';
    };
    this.formatComment = function (comment) {
        return '';
    };
    this.formatEmptyLine = function () { return ''; };
    this.formatHeader = function (localeKey) {
        return self.singluer ? '{\n' : '';
    };
    this.formatFooter = function (localeKey) {
        return self.singluer ? '\n}' : '';
    };
    this.getFilePath = function (folderPath, localeKey) {
        return folderPath + '\\messages.' + localeKey + '.json';
    };
    this.normalizeLines = function (lines) {
        // format: json-singluer, noop.
        if (self.singluer) {
            return lines;
        }

        // ensure JSON object
        (function () {
            if (typeof JSON !== 'object') {
                var fileStream = fso.openTextFile('.\\json2.js');
                var fileData = fileStream.readAll();
                fileStream.Close();
                /*jshint evil: true */
                eval(fileData);
                /*jshint evil: false */
            }
        }());

        var flatJsonObj = (function () {
            var flatSrc = '{\n';
            for (var i = 0, n = lines.length; i < n; i++) {
                var line = lines[i];
                if (i === n - 1) {  // last line
                    line = line.split(',')[0];
                }
                flatSrc += line;
            }
            flatSrc += '\n}';
            return JSON.parse(flatSrc);
        }());

        var jsonText = (function (flat) {
            var normalize = {};
            for (var key in flat) {
                var value = flat[key];
                var keys = key.split(".");
                var temp = normalize;
                for (var i = 0, n = keys.length; i < n; i++) {
                    if (!temp[keys[i]]) {
                        if (i < n - 1) {
                            temp[keys[i]] = {};
                        } else {
                            temp[keys[i]] = value;
                        }
                    }
                    temp = temp[keys[i]];
                }
            }
            return JSON.stringify(normalize, null, 4);
        }(flatJsonObj));

        return jsonText.split('\r\n');
    };
};

/**
 * Play framework language file formatter 
 */
var PlayFormatter = function() {
    this.requireDefaultFile = true;
    this.folderName = 'conf';
    this.isDefaultLocale = function (localeKey) {
        if (localeKey == 'en-us' || localeKey == 'en-US') {
            return true;
        }
        return false;
    };
    this.getDefaultFilePath = function (folderPath) {
        return folderPath + '\\' + 'messages';
    };
    this.formatLine = function (key, value) {
        return key + '=' + value + '\n';
    };
    this.formatLastLine = function (key, value) {
        return this.formatLine(key, value);
    };
    this.formatComment = function (comment) {
        return comment + '\n';
    };
    this.formatEmptyLine = function () { return '\n'; };
    this.formatHeader = function (localeKey) { return ''; };
    this.formatFooter = function (localeKey) { return ''; };
    this.getFilePath = function (folderPath, localeKey) {
        return folderPath + '\\messages.' + localeKey;
    };
    this.normalizeLines = function (lines) {
        // noop
        return lines;
    };
};

/**
 * Node.js ini file formatter
 */
var NodeIniFormatter = function() {
    this.requireDefaultFile = false;
    this.folderName = 'messages';
    this.formatLine = function (key, value) {
        return key + '=' + value + '\n';
    };
    this.formatLastLine = function (key, value) {
        return this.formatLine(key, value);
    };
    this.formatComment = function (comment) {
        return comment;
    };
    this.formatEmptyLine = function () { return '\n'; };
    this.formatHeader = function (localeKey) { return ''; };
    this.formatFooter = function (localeKey) { return ''; };
    this.getFilePath = function (folderPath, localeKey) {
        return folderPath + '\\messages.' + localeKey;
    };
    this.normalizeLines = function (lines) {
        // noop
        return lines;
    };
};

/**
 * ResourceConverter class
 */
var ResourceConverter = function (formatter) {
    this.formatter = formatter;

    /**
     * Convert 
     *
     * @param filePath input ods file path
     */
    this.convert = function (filePath) {
        log('Message resource converter');
        log('Execute convert: ' + filePath);

        var excelApp = new ActiveXObject('Excel.Application');
        excelApp.Visible = true;
        log('Start');
        var book = excelApp.Workbooks.Open(filePath);
        var sheet = book.Worksheets(1);
        this.extractResources(sheet);
        log("End");
        book.Close(false);
        excelApp.Quit();
        excelApp = null;
    };

    this.data = [];
    this.fillData = function (sheet, lastCol, lastRow) {
      WScript.StdOut.Write('                        \r');
      this.data.push(undefined);
      for (var r = 1; r <= lastRow; r++) {
        var row = [];
        row.push(undefined);
        for (var c = 1; c <= lastCol; c++) {
          row.push(sheet.Cells(r, c).Value);
        }
        this.data.push(row);
        WScript.StdOut.Write('\rLoading... ' + r + ' / ' + lastRow);
      }
      WScript.StdOut.WriteLine();
    };
    this.value = function (row, col) {
        if (row >= this.data.length) throw Error('Array index out of range error(row): ' + row + ' in ' + this.data.length);
        if (col >= this.data[row].length) throw Error('Array index out of range error(col): ' + col + ' in ' + this.data[row].length);
        return this.data[row][col];
    };
    this.getLocaleColIndex = function(locale) {
        for (var col = 1; col < 100; col++) {
            if (this.value(3, col).toLowerCase() === locale.toLowerCase()) {
                return col;
            }
        }
        throw new Error('ref locale "' + locale + '" not found');
    };
    this.getRealValue = function (row, col) {
        var v = this.value(row, col);
        if (v === '^') {
            return this.getRealValue(row, col - 1);
        } else if (v === undefined) {
            return '';
        } else if (v.length > 1 && v.charAt(0) === '^') {
            var m = v.match(/^\^([a-z]+[\-_][a-zA-Z]+)$/);
            if (m) {
                var refLocaleCol = this.getLocaleColIndex(m[1]);
                return this.getRealValue(row, refLocaleCol);
            }
        }
        return v;
    };
    this.extractResources = function (sheet) {
        var locales = [];
        var lastLocaleCol = 1;
        var startLocaleCol = 4;
        for (var col = startLocaleCol, cellValue; cellValue = sheet.Cells(3, col).Value; col++) {
            lastLocaleCol = col;
        }
        var lastKeyRow = this.getLastKeyRow(sheet, 5);
        this.fillData(sheet, lastLocaleCol, lastKeyRow);
        console.log('Writing files...');
        var locales = [];
        for (var col = startLocaleCol; col <= lastLocaleCol; col++) {
            var localeKey = this.value(3, col);
            var lines = [];
            for (var row = 4; row <= lastKeyRow; row++) {
                var key = this.value(row, 3);
                var v = this.getRealValue(row, col);
                if (key) {
                    if (key.substr(0, 1) === '#') {
                        lines.push(formatter.formatComment(key));
                    } else {
                        if (row === lastKeyRow) {
                            lines.push(formatter.formatLastLine(key, v));
                        } else {
                            lines.push(formatter.formatLine(key, v));
                        }
                    }
                } else {
                    lines.push(''); // empty line
                }
            }
            locales.push(localeKey);
            this.writeSingleResourceFile(localeKey, formatter.normalizeLines(lines));
        }
        console.log('Wrote ' + locales.length + ' files in messages/ directory.');
    };
    this.writeSingleResourceFile = function (localeKey, lines) {
        var folderName = formatter.folderName;
        if (!fso.FolderExists(folderName)) {
            fso.CreateFolder(folderName);
        }
        // const
        var adTypeBinary = 1; // Binary
        var adTypeText = 2; // Text
        var adWriteChar = 0; // no EOL
        var adSaveCreateOverWrite = 2; // create or over write

        var filename = formatter.getFilePath(folderName, localeKey);
        var sw = new ActiveXObject('ADODB.Stream');
        sw.Type = adTypeText;
        sw.charset = 'utf-8';
        sw.Open();
        var headerText = formatter.formatHeader(localeKey);
        sw.WriteText(headerText, adWriteChar);
        for (var i = 0; i < lines.length; i++) {
            sw.WriteText(lines[i], adWriteChar);
        }
        var footerText = formatter.formatFooter(localeKey);
        sw.WriteText(footerText, adWriteChar);
        // Change to binary mode
        sw.Position = 0;
        sw.Type = adTypeBinary;
        // UTF-8 BOM
        if (outputBOM) {
            // Keep UTF-8 BOM
            sw.Position = 0;
        } else {
            // Skip UTF-8 BOM
            sw.Position = 3;
        }
        var binBlock = sw.Read();
        sw.Close();

        // Write binBlock as binary
        var os = new ActiveXObject('ADODB.Stream');
        os.Type = adTypeBinary;
        os.Open();
        os.Write(binBlock);
        os.SaveToFile(filename, adSaveCreateOverWrite);
        if (formatter.requireDefaultFile && formatter.isDefaultLocale(localeKey)) {
            var filenameOriginal = formatter.getDefaultFilePath(folderName);
            os.SaveToFile(filenameOriginal, adSaveCreateOverWrite);
        }
        os.Close();
    };

    // True if there are 
    this.getLastKeyRow = function (sheet, startRow) {
        var isBlank10rows = function (row) {
            for (var i = 0; i < 10; i++) {
                if (sheet.Cells(row + i, 3).Value) {
                    return false;
                }
            }
            return true;
        };
        for (var j = startRow; j < 5000; j++) { 
            if (isBlank10rows(j)) {
                return j - 1;
            }
        }
        return startRow;
    };
    return this;
};

/**
 * Find first .ods file
 */
function findExcelFile() {
    var files = fso.getFolder(".").Files;
    for (var e = new Enumerator(files) ; !e.atEnd() ; e.moveNext()) {
        var file = e.item();
        // [Garage customize]
        var extXLSX = '.xlsx';
        var extODS = '.ods';
        if (file.Name.substr(file.Name.length - extXLSX.length) === extXLSX) {
            return file.Path;
        } else if (file.Name.substr(file.Name.length - extODS.length) === extODS) {
            return file.Path;            
        }
        // [Garage customize]
    }
    return null;
}

function main() {
    var isCScript = true;
    try {
        WScript.StdOut.Write('\r');
    } catch (e) {
        isCScript = false;
    }
    if (!isCScript) {
        WScript.Echo('Auto cscript execution: cscript resource_conv.js');
        var shell = new ActiveXObject('WScript.Shell');
        shell.Run('cmd /k cscript resource_conv.js');
        WScript.Quit();
    }

    var args = WScript.Arguments;
    var formatKey = null;
    for (var i = 0; i < args.length; i++) {
        switch (args(i)) {
            case '--format':
                formatKey = args(i + 1);
        }
    }
    var odsFilePath = findExcelFile();
    if (!odsFilePath) {
        throw new Error("ods file not found");
    }
    var formatter  = new JsonFormatter();
    switch (formatKey) {
        case 'play':
            console.log('Formatter: PlayFormatter');
            formatter = new PlayFormatter();
            break;
        case 'node':
            console.log('Formatter: NodeIniFormatter');
            formatter = new NodeIniFormatter();
            break;
        case 'json':
            console.log('Formatter: JsonFormatter');
            formatter = new JsonFormatter();
            break;
        case 'json-singular':
            console.log('Formatter: JsonFormatter, singular form');
            formatter = new JsonFormatter(true);
            break;
        default:
            console.log('Formatter: JsonFormatter');
    }
    var converter = new ResourceConverter(formatter);
    converter.convert(odsFilePath);
}

(function () {
/*
    json2.js
    2015-05-03

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/
/* jshint ignore:start */
typeof JSON!="object"&&(JSON={}),function(){"use strict";function i(n){return n<10?"0"+n:n}function e(){return this.valueOf()}function o(n){return f.lastIndex=0,f.test(n)?'"'+n.replace(f,function(n){var t=s[n];return typeof t=="string"?t:"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+n+'"'}function u(i,f){var s,l,h,a,v=n,c,e=f[i];e&&typeof e=="object"&&typeof e.toJSON=="function"&&(e=e.toJSON(i));typeof t=="function"&&(e=t.call(f,i,e));switch(typeof e){case"string":return o(e);case"number":return isFinite(e)?String(e):"null";case"boolean":case"null":return String(e);case"object":if(!e)return"null";if(n+=r,c=[],Object.prototype.toString.apply(e)==="[object Array]"){for(a=e.length,s=0;s<a;s+=1)c[s]=u(s,e)||"null";return h=c.length===0?"[]":n?"[\n"+n+c.join(",\n"+n)+"\n"+v+"]":"["+c.join(",")+"]",n=v,h}if(t&&typeof t=="object")for(a=t.length,s=0;s<a;s+=1)typeof t[s]=="string"&&(l=t[s],h=u(l,e),h&&c.push(o(l)+(n?": ":":")+h));else for(l in e)Object.prototype.hasOwnProperty.call(e,l)&&(h=u(l,e),h&&c.push(o(l)+(n?": ":":")+h));return h=c.length===0?"{}":n?"{\n"+n+c.join(",\n"+n)+"\n"+v+"}":"{"+c.join(",")+"}",n=v,h}}var rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,f=/[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,n,r,s,t;typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+i(this.getUTCMonth()+1)+"-"+i(this.getUTCDate())+"T"+i(this.getUTCHours())+":"+i(this.getUTCMinutes())+":"+i(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=e,Number.prototype.toJSON=e,String.prototype.toJSON=e);typeof JSON.stringify!="function"&&(s={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(i,f,e){var o;if(n="",r="",typeof e=="number")for(o=0;o<e;o+=1)r+=" ";else typeof e=="string"&&(r=e);if(t=f,f&&typeof f!="function"&&(typeof f!="object"||typeof f.length!="number"))throw new Error("JSON.stringify");return u("",{"":i})});typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(n,t){var r,u,i=n[t];if(i&&typeof i=="object")for(r in i)Object.prototype.hasOwnProperty.call(i,r)&&(u=walk(i,r),u!==undefined?i[r]=u:delete i[r]);return reviver.call(n,t,i)}var j;if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,function(n){return"\\u"+("0000"+n.charCodeAt(0).toString(16)).slice(-4)})),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),typeof reviver=="function"?walk({"":j},""):j;throw new SyntaxError("JSON.parse");})}();
/* jshint ignore:end */
}());

main();
