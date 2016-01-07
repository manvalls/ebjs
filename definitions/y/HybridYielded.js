var Resolver = require('y-resolver'),
    HybridYielded = Resolver.Hybrid,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  yield buffer.pack(data,labels.Resolver);
}

function* unpacker(buffer,ref){
  return new HybridYielded(yield buffer.unpack(labels.Resolver));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.HybridYielded,packer);
  ebjs.setUnpacker(labels.HybridYielded,unpacker);
};
