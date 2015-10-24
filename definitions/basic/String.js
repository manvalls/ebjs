var getBytes = require('./String/getBytes.js'),
    getString = require('./String/getString.js'),
    label = require('../../label.js'),
    labels = require('../labels.js');

String.prototype[label] = labels.String;

function* packer(buffer,data){
  var bytes = getBytes(data);

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
