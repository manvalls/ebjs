var label = require('../../../label.js'),
    labels = require('../../labels.js');

Object.defineProperty(FileList.prototype,label,{
  value: labels.FileList,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var length = data.length,
      i;

  if(!(data instanceof FileList)) length = 0;
  yield buffer.pack(length,labels.Number);
  for(i = 0;i < length;i++) yield buffer.pack(data[i] || new File([],''),labels.File);
}

function* unpacker(buffer,ref){
  var result = [],
      length = yield buffer.unpack(labels.Number);

  while(length > 0){
    result.push(yield buffer.unpack(labels.File));
    length--;
  }

  return result;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.FileList,packer);
  ebjs.setUnpacker(labels.FileList,unpacker);
};
