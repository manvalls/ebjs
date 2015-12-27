var Setter = require('y-setter'),
    HybridGetter = Setter.Hybrid,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  var setter = new Setter();
  
  yield buffer.pack(setter,labels.Setter);

  try{
    setter.getter.connect(data);
    data.connect(setter);
  }catch(e){}
}

function* unpacker(buffer,ref){
  var data = ref.set(new HybridGetter()),
      setter = yield buffer.unpack(labels.Setter);

  setter.getter.connect(data);
  data.connect(setter);
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.HybridGetter,packer);
  ebjs.setUnpacker(labels.HybridGetter,unpacker);
};
