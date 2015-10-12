
function* packer(buffer,data){
  yield buffer.pack(data.name,String);
  yield buffer.pack(data.message,String);
}

function* unpacker(buffer,ref){
  var name = yield buffer.unpack(String),
      error = new this(yield buffer.unpack(String));

  error.name = name;
  return error;
}

module.exports = function(ebjs){
  ebjs.setPacker(Error,packer,Error);
  ebjs.setUnpacker(Error,unpacker,Error);

  ebjs.setPacker(EvalError,packer,EvalError);
  ebjs.setUnpacker(EvalError,unpacker,EvalError);

  ebjs.setPacker(RangeError,packer,RangeError);
  ebjs.setUnpacker(RangeError,unpacker,RangeError);

  ebjs.setPacker(ReferenceError,packer,ReferenceError);
  ebjs.setUnpacker(ReferenceError,unpacker,ReferenceError);

  ebjs.setPacker(SyntaxError,packer,SyntaxError);
  ebjs.setUnpacker(SyntaxError,unpacker,SyntaxError);

  ebjs.setPacker(TypeError,packer,TypeError);
  ebjs.setUnpacker(TypeError,unpacker,TypeError);

  ebjs.setPacker(URIError,packer,URIError);
  ebjs.setUnpacker(URIError,unpacker,URIError);
};
