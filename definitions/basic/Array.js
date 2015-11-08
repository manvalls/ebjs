var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Array.prototype,label,{value: labels.Array});

function* packer(buffer,data){
  var length = data.length,
      i;

  yield buffer.pack(length,labels.Number);
  for(i = 0;i < length;i++) yield buffer.pack(data[i]);
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
