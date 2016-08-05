var labels = require('../../labels.js'),
    Buff = global.Buffer || global.Uint8Array;

function* unpacker(buffer,ref){
  var type = yield buffer.unpack(labels.String),
      isClosed = yield buffer.unpack(labels.Boolean),
      length,buff,ret;

  if(isClosed){
    ret = new Buff(0);
    ret.isClosed = true;
    ret.type = type;
    return ret;
  }

  length = yield buffer.unpack(labels.Number);
  buff = new Buff(length);
  ret = yield buffer.read(buff);
  ret.type = type;
  return ret;
}

module.exports = function(ebjs){
  ebjs.setUnpacker(labels.Blob,unpacker);
};
