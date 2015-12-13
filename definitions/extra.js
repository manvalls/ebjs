var _Date = require('./extra/Date.js'),
    _RegExp = require('./extra/RegExp.js'),
    _Error = require('./extra/Error.js'),
    _Promise = require('./extra/Promise.js');

module.exports = function(ebjs){
  _Date(ebjs);
  _RegExp(ebjs);
  _Error(ebjs);
  _Promise(ebjs);
};
