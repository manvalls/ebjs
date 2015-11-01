var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Date.prototype,label,{value: labels.Date});

function* packer(buffer,data){
  yield buffer.pack(data.getTime(),labels.Number);
}

function* unpacker(buffer,ref){
  return new Date(yield buffer.unpack(labels.Number));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Date,packer);
  ebjs.setUnpacker(labels.Date,unpacker);
};
