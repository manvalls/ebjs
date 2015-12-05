var label = require('../../../label.js'),
    labels = require('../../labels.js');

Object.defineProperty(File.prototype,label,{
  value: labels.File,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  if(!(data instanceof File)) data = new File([],'');
  yield buffer.pack(data.name,labels.String);
  yield buffer.pack(data.lastModified,labels.Number);
  yield buffer.pack(data,labels.Blob);
}

function* unpacker(buffer,ref){
  var name = yield buffer.unpack(labels.String),
      lastModified = yield buffer.unpack(labels.Number),
      blob = yield buffer.unpack(labels.Blob),
      ret;

  if(blob.isClosed){
    ret = new File([],name,{type: blob.type, lastModified: lastModified});
    if(ret.close) ret.close();
    else ret.isClosed = true;
    return ret;
  }

  return new File([blob],name,{type: blob.type,lastModified: lastModified});
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.File,packer);
  ebjs.setUnpacker(labels.File,unpacker);
};
