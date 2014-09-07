
var Property = require('vz.property'),
    Buffer = global.Buffer;

exports.label = new Property();
exports.uLabel = new Property();

exports.classes = [];
exports.types = [];
exports.packers = [];
exports.unpackers = [];

if(Buffer) exports.toBuffer = function(data,base64){
  var i;
  
  switch(data.constructor){
    case String:
      
      if(base64){
        i = data.indexOf('base64,');
        if(i != -1) data = data.substring(i + 7);
        return new Buffer(data,'base64');
      }
      
      return new Buffer(data,'utf8');
    case Uint8Array:
    case Uint8ClampedArray:
      return new Buffer(data);
    case Uint16Array:
    case Uint32Array:
    case Int16Array:
    case Int32Array:
    case Int8Array:
    case Float32Array:
    case Float64Array:
    case DataView:
      data = data.buffer.slice(data.byteOffset,data.length);
    case ArrayBuffer:
      return new Buffer(new Uint8Array(data));
    case Buffer:
      return data;
  }
  
};

exports.resolvers = new Property();

exports.resFunction = function(callback,action,args,that){
  this.callback = callback;
  this.that = that;
  exports.resolvers.of(that).get().push(this);
  action.apply(that,args);
};

exports.resCallback = function(data){
  this.callback.call(this.that,data);
};

