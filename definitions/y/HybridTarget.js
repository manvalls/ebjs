var Emitter = require('y-emitter'),
    HybridTarget = Emitter.Hybrid,
    labels = require('../labels.js');

function* packer(buffer,data){
  yield buffer.pack(data,labels.Emitter);
}

function* unpacker(buffer,ref){
  return new HybridTarget(yield buffer.unpack(labels.Emitter));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.HybridTarget,packer);
  ebjs.setUnpacker(labels.HybridTarget,unpacker);
};
