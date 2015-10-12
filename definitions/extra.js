var _Date = require('./extra/Date.js'),
    _RegExp = require('./extra/RegExp.js'),
    _Error = require('./extra/Error.js');

module.exports = function(ebjs){
  _Date(ebjs);
  _RegExp(ebjs);
  _Error(ebjs);
};
