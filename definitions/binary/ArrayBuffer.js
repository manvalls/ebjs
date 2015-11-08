var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(ArrayBuffer.prototype,label,{value: labels.ArrayBuffer});

function* packer(buffer,data){
  yield buffer.pack(data.byteLength,labels.Number);
  yield buffer.write(new Uint8Array(data));
}

function* unpacker(buffer,ref){
  var length = yield buffer.unpack(labels.Number),
      ui8 = new Uint8Array(length);

  ui8 = yield buffer.read(ui8);
  return ui8.buffer.slice(ui8.byteOffset,ui8.byteLength);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.ArrayBuffer,packer);
  ebjs.setUnpacker(labels.ArrayBuffer,unpacker);
};
