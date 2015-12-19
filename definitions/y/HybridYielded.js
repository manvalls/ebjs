var Resolver = require('y-resolver'),
    HybridYielded = Resolver.Hybrid,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  var res = new Resolver();

  yield buffer.pack(res,labels.Resolver);

  try{
    res.bind(data);
    data.bind(res.yielded);
  }catch(e){}
}

function* unpacker(buffer,ref){
  var res = yield buffer.unpack(labels.Resolver),
      data = new HybridYielded();

  res.bind(data);
  data.bind(res.yielded);
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.HybridYielded,packer);
  ebjs.setUnpacker(labels.HybridYielded,unpacker);
};
