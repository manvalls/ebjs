var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Array.prototype,label,{value: labels.Array});

function* packer(buffer,data){
  yield buffer.pack(data.length,labels.Number);
  for(var i = 0;i < data.length;i++) yield buffer.pack(data[i]);
}

function* unpacker(buffer,ref){
  var data = ref.set([]),
      size = yield buffer.unpack(labels.Number);

  for(var i = 0;i < size;i++) data[i] = yield buffer.unpack();
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Array,packer);
  ebjs.setUnpacker(labels.Array,unpacker);
};
