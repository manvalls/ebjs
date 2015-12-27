var _Yielded = require('./y/Yielded.js'),
    _Resolver = require('./y/Resolver.js'),
    _HybridYielded = require('./y/HybridYielded.js'),
    _Getter = require('./y/Getter.js'),
    _Setter = require('./y/Setter.js');

module.exports = function(ebjs){
  _Yielded(ebjs);
  _Resolver(ebjs);
  _HybridYielded(ebjs);
  _Getter(ebjs);
  _Setter(ebjs);
};
