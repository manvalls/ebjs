var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Date.prototype,label,{
  value: labels.Date,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  if(!(data instanceof Date)) data = new Date(data);
  yield buffer.pack(data.getTime(),labels.Number);
}

function* unpacker(buffer,ref){
  return new Date(yield buffer.unpack(labels.Number));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Date,packer);
  ebjs.setUnpacker(labels.Date,unpacker);
};
