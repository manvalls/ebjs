var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(Uint8Array.prototype,label,{
  value: labels.Uint8Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Uint8ClampedArray.prototype,label,{
  value: labels.Uint8ClampedArray,
  writable: true,
  configurable: true
});

Object.defineProperty(Uint16Array.prototype,label,{
  value: labels.Uint16Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Uint32Array.prototype,label,{
  value: labels.Uint32Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Int8Array.prototype,label,{
  value: labels.Int8Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Int16Array.prototype,label,{
  value: labels.Int16Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Int32Array.prototype,label,{
  value: labels.Int32Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Float32Array.prototype,label,{
  value: labels.Float32Array,
  writable: true,
  configurable: true
});

Object.defineProperty(Float32Array.prototype,label,{
  value: labels.Float32Array,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  yield buffer.pack(data.buffer.slice(data.byteOffset,data.byteLength),ArrayBuffer);
}

function* unpacker(buffer,ref){
  return new this(yield buffer.unpack(ArrayBuffer));
}

module.exports = function(ebjs){

  ebjs.setPacker(labels.Uint8Array,packer,Uint8Array);
  ebjs.setPacker(labels.Uint8ClampedArray,packer,Uint8ClampedArray);
  ebjs.setPacker(labels.Uint16Array,packer,Uint16Array);
  ebjs.setPacker(labels.Uint32Array,packer,Uint32Array);
  ebjs.setPacker(labels.Int8Array,packer,Int8Array);
  ebjs.setPacker(labels.Int16Array,packer,Int16Array);
  ebjs.setPacker(labels.Int32Array,packer,Int32Array);
  ebjs.setPacker(labels.Float32Array,packer,Float32Array,Float32Array);
  ebjs.setPacker(labels.Float64Array,packer,Float64Array,Float64Array);

  ebjs.setUnpacker(labels.Uint8Array,unpacker,Uint8Array);
  ebjs.setUnpacker(labels.Uint8ClampedArray,unpacker,Uint8ClampedArray);
  ebjs.setUnpacker(labels.Uint16Array,unpacker,Uint16Array);
  ebjs.setUnpacker(labels.Uint32Array,unpacker,Uint32Array);
  ebjs.setUnpacker(labels.Int8Array,unpacker,Int8Array);
  ebjs.setUnpacker(labels.Int16Array,unpacker,Int16Array);
  ebjs.setUnpacker(labels.Int32Array,unpacker,Int32Array);
  ebjs.setUnpacker(labels.Float32Array,unpacker,Float32Array);
  ebjs.setUnpacker(labels.Float64Array,unpacker,Float64Array);

};
