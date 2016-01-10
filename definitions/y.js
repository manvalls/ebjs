var _Yielded = require('./y/Yielded.js'),
    _Resolver = require('./y/Resolver.js'),
    _HybridYielded = require('./y/HybridYielded.js'),
    _Getter = require('./y/Getter.js'),
    _Setter = require('./y/Setter.js'),
    _HybridGetter = require('./y/HybridGetter.js'),
    _Target = require('./y/Target.js'),
    _Emitter = require('./y/Emitter.js'),
    _HybridTarget = require('./y/HybridTarget.js'),
    _Lock = require('./y/Lock.js');

module.exports = function(ebjs){
  _Yielded(ebjs);
  _Resolver(ebjs);
  _HybridYielded(ebjs);
  _Getter(ebjs);
  _Setter(ebjs);
  _HybridGetter(ebjs);
  _Target(ebjs);
  _Emitter(ebjs);
  _HybridTarget(ebjs);
  _Lock(ebjs);
};
