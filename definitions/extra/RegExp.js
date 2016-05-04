var label = require('../../label.js'),
    labels = require('../labels.js');

Object.defineProperty(RegExp.prototype,label,{
  value: labels.RegExp,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var flags = 0;

  data = data || {};
  if(data.multiline)  flags |= 1;
  if(data.global)     flags |= 2;
  if(data.ignoreCase) flags |= 4;
  if(data.sticky)     flags |= 8;
  if(data.unicode)    flags |= 16;

  yield buffer.pack(flags,labels.Number);
  yield buffer.pack(data.source,labels.String);
  yield buffer.pack(data.lastIndex,labels.Number);
}

function* unpacker(buffer,ref){
  var re,flags = '',fn;

  fn = yield buffer.unpack(labels.Number);

  if(fn & 1)  flags += 'm';
  if(fn & 2)  flags += 'g';
  if(fn & 4)  flags += 'i';
  if(fn & 8)  flags += 'y';
  if(fn & 16) flags += 'u';

  re = new RegExp((yield buffer.unpack(labels.String)),flags);
  re.lastIndex = yield buffer.unpack(labels.Number);

  return re;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.RegExp,packer);
  ebjs.setUnpacker(labels.RegExp,unpacker);
};
