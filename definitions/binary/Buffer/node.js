var label = require('../../../label.js'),
    labels = require('../../labels.js');

Object.defineProperty(Buffer.prototype,label,{
  value: labels.Buffer,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  yield buffer.pack(data.length,labels.Number);
  yield buffer.write(data);
}

function* unpacker(buffer,ref){
  var length = yield buffer.unpack(labels.Number),
      buff = new Buffer(length);

  return yield buffer.read(buff);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Buffer,packer);
  ebjs.setUnpacker(labels.Buffer,unpacker);
};
