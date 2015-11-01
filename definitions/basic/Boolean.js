var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Boolean.prototype,label,{value: labels.Boolean});

function* packer(buffer,data){
  yield buffer.pack(data ? 1 : 0,labels.Number);
}

function* unpacker(buffer,ref){
  return !!(yield buffer.unpack(labels.Number));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Boolean,packer);
  ebjs.setUnpacker(labels.Boolean,unpacker);
};
