var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Set.prototype,label,{
  value: labels.Set,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  yield buffer.pack(Array.from(data),labels.Array);
}

function* unpacker(buffer,ref){
  return new Set(yield buffer.unpack(labels.Array));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Set,packer);
  ebjs.setUnpacker(labels.Set,unpacker);
};
