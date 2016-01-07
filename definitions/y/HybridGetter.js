var Setter = require('y-setter'),
    HybridGetter = Setter.Hybrid,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  yield buffer.pack(data,labels.Setter);
}

function* unpacker(buffer,ref){
  return new HybridGetter(yield buffer.unpack(labels.Setter));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.HybridGetter,packer);
  ebjs.setUnpacker(labels.HybridGetter,unpacker);
};
