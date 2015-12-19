var _Yielded = require('./y/Yielded.js'),
    _Resolver = require('./y/Resolver.js');

module.exports = function(ebjs){
  _Yielded(ebjs);
  _Resolver(ebjs);
};
