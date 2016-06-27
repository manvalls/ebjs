var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Object.prototype,label,{

  get: function(){
    if(typeof this.then == 'function') return labels.Promise;
    return labels.Object;
  },

  set: function(value){

    Object.defineProperty(this,label,{
      value: value,
      configurable: true,
      writable: true,
      enumerable: true
    });

  },

  configurable: true

});

function* packer(buffer,data){
  var keys,i;

  try{ keys = Object.keys(data); }
  catch(e){
    data = {};
    keys = [];
  }

  yield buffer.pack(keys.length,labels.Number);

  for(i = 0;i < keys.length;i++){
    yield buffer.pack(keys[i],labels.String);
    yield buffer.pack(data[keys[i]]);
  }

}

function* unpacker(buffer,ref){
  var data = ref.set({}),
      size = yield buffer.unpack(labels.Number),
      i;

  for(i = 0;i < size;i++) data[yield buffer.unpack(labels.String)] = yield buffer.unpack();
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Object,packer);
  ebjs.setUnpacker(labels.Object,unpacker);
};
