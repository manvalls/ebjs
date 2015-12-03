var Resolver = require('y-resolver'),

    label = require('../../../label.js'),
    labels = require('../../labels.js');

Object.defineProperty(Blob.prototype,label,{
  value: labels.Blob,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var remaining = data.size;

  yield buffer.pack(data.type,labels.String);
  yield buffer.pack(data.isClosed,labels.Boolean);
  if(data.isClosed) return;

  yield buffer.pack(remaining,labels.Number);
  while(remaining > 0){

    yield buffer.write(yield read(
      data,data.size - remaining,
      Math.min(data.size,data.size - remaining + 1e3)
    ));

    remaining -= 1e3;
  }

}

function* unpacker(buffer,ref){
  var type = yield buffer.unpack(labels.String),
      isClosed = yield buffer.unpack(labels.Boolean),
      ret = new Blob([],{type: type}),
      remaining;

  if(isClosed){
    if(ret.close) ret.close();
    else ret.isClosed = true;
    return ret;
  }

  remaining = yield buffer.unpack(labels.Number);
  while(remaining > 0){
    ret = new Blob([ret,yield buffer.read(Math.min(remaining,1e3))],{type: type});
    remaining -= 1e3;
  }

  return ret;
}

function read(blob,from,to){
  var fr = new FileReader(),
      resolver = new Resolver();

  fr.resolver = resolver;
  fr.onload = onceLoaded;
  fr.readAsArrayBuffer(blob.slice(from,to));

  return resolver.yielded;
}

function onceLoaded(){
  this.resolver.accept(new Uint8Array(this.result));
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Blob,packer);
  ebjs.setUnpacker(labels.Blob,unpacker);
};
