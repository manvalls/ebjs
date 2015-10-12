var _Number = require('./basic/Number.js'),
    _Boolean = require('./basic/Boolean.js'),
    _String = require('./basic/String.js'),
    _Object = require('./basic/Object.js'),
    _Array = require('./basic/Array.js'),
    _null = require('./basic/null.js'),
    _undefined = require('./basic/undefined.js');

module.exports = function(ebjs){
  _Number(ebjs);
  _Boolean(ebjs);
  _String(ebjs);
  _Object(ebjs);
  _Array(ebjs);
  _null(ebjs);
  _undefined(ebjs);
};
