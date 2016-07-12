var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Map.prototype,label,{
  value: labels.Map,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var keys = Array.from(data.keys()),
      values = Array.from(data.values());

  yield buffer.pack(keys,labels.Array);
  yield buffer.pack(values,labels.Array);
}

function* unpacker(buffer,ref){
  var keys = yield buffer.unpack(labels.Array),
      values = yield buffer.unpack(labels.Array),
      map = new Map(),
      i;

  for(i = 0;i < keys.length;i++) map.set(keys[i],values[i]);
  return map;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Map,packer);
  ebjs.setUnpacker(labels.Map,unpacker);
};
