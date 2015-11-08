var labels = require('../../labels.js');

function* unpacker(buffer,ref){
  var type = yield buffer.unpack(labels.String),
      isClosed = yield buffer.unpack(labels.Boolean),
      length,buff,ret;

  if(isClosed){
    ret = new Buffer(0);
    ret.isClosed = true;
    ret.type = type;
    return ret;
  }

  length = yield buffer.unpack(labels.Number);
  buff = new Buffer(length);
  ret = yield buffer.read(buff);
  ret.type = type;
  return ret;
}

module.exports = function(ebjs){
  ebjs.setUnpacker(labels.Blob,unpacker);
};
