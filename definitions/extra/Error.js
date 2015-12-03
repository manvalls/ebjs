var label = require('../../label.js'),
    labels = require('../labels.js');

Error.prototype[label] = labels.Error;
EvalError.prototype[label] = labels.EvalError;
RangeError.prototype[label] = labels.RangeError;
ReferenceError.prototype[label] = labels.ReferenceError;
SyntaxError.prototype[label] = labels.SyntaxError;
TypeError.prototype[label] = labels.TypeError;
URIError.prototype[label] = labels.URIError;

Object.defineProperty(Error.prototype,label,{
  value: labels.Error,
  writable: true,
  configurable: true
});

Object.defineProperty(EvalError.prototype,label,{
  value: labels.EvalError,
  writable: true,
  configurable: true
});

Object.defineProperty(RangeError.prototype,label,{
  value: labels.RangeError,
  writable: true,
  configurable: true
});

Object.defineProperty(ReferenceError.prototype,label,{
  value: labels.ReferenceError,
  writable: true,
  configurable: true
});

Object.defineProperty(SyntaxError.prototype,label,{
  value: labels.SyntaxError,
  writable: true,
  configurable: true
});

Object.defineProperty(TypeError.prototype,label,{
  value: labels.TypeError,
  writable: true,
  configurable: true
});

Object.defineProperty(URIError.prototype,label,{
  value: labels.URIError,
  writable: true,
  configurable: true
});


function* packer(buffer,data){
  yield buffer.pack(data.name,labels.String);
  yield buffer.pack(data.message,labels.String);
}

function* unpacker(buffer,ref){
  var name = yield buffer.unpack(labels.String),
      error = new this(yield buffer.unpack(labels.String));

  error.name = name;
  return error;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Error,packer,Error);
  ebjs.setUnpacker(labels.Error,unpacker,Error);

  ebjs.setPacker(labels.EvalError,packer,EvalError);
  ebjs.setUnpacker(labels.EvalError,unpacker,EvalError);

  ebjs.setPacker(labels.RangeError,packer,RangeError);
  ebjs.setUnpacker(labels.RangeError,unpacker,RangeError);

  ebjs.setPacker(labels.ReferenceError,packer,ReferenceError);
  ebjs.setUnpacker(labels.ReferenceError,unpacker,ReferenceError);

  ebjs.setPacker(labels.SyntaxError,packer,SyntaxError);
  ebjs.setUnpacker(labels.SyntaxError,unpacker,SyntaxError);

  ebjs.setPacker(labels.TypeError,packer,TypeError);
  ebjs.setUnpacker(labels.TypeError,unpacker,TypeError);

  ebjs.setPacker(labels.URIError,packer,URIError);
  ebjs.setUnpacker(labels.URIError,unpacker,URIError);
};
