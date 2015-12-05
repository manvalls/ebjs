var getBytes = require('./String/getBytes.js'),
    getString = require('./String/getString.js'),
    label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(String.prototype,label,{
  value: labels.String,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var bytes = getBytes(String(data == null ? '' : data));

  yield buffer.pack(bytes.length,labels.Number);
  yield buffer.write(bytes);
}

function* unpacker(buffer,ref){
  var length = yield buffer.unpack(labels.Number);
  return getString(yield buffer.read(length));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.String,packer);
  ebjs.setUnpacker(labels.String,unpacker);
};
