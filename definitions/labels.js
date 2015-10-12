var label = require('../label.js');

/*/--- basic ---/*/

Number.prototype[label] =           1;
Boolean.prototype[label] =          2;
String.prototype[label] =           3;
Object.prototype[label] =           4;
Array.prototype[label] =            5;
exports[null] =                     6;
exports[undefined] =                7;
/** RESERVED **/                    8;
/** RESERVED **/                    9;
/** RESERVED **/                    10;

/*/--- extra ---/*/

Date.prototype[label] =             11;
RegExp.prototype[label] =           12;
Error.prototype[label] =            13;
EvalError.prototype[label] =        14;
RangeError.prototype[label] =       15;
ReferenceError.prototype[label] =   16;
SyntaxError.prototype[label] =      17;
TypeError.prototype[label] =        18;
URIError.prototype[label] =         19;
/** RESERVED **/                    20;
