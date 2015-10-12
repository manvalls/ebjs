
function* packer(buffer,data){
  var flags = 0;

  if(data.multiline)  flags |= 1;
  if(data.global)     flags |= 2;
  if(data.ignoreCase) flags |= 4;
  if(data.sticky)     flags |= 8;
  if(data.unicode)    flags |= 16;

  yield buffer.pack(flags,Number);
  yield buffer.pack(data.source,String);
  yield buffer.pack(data.lastIndex,Number);
}

function* unpacker(buffer,ref){
  var re,flags = '',fn;

  fn = yield buffer.unpack(Number);

  if(fn & 1)  flags += 'm';
  if(fn & 2)  flags += 'g';
  if(fn & 4)  flags += 'i';
  if(fn & 8)  flags += 'y';
  if(fn & 16) flags += 'u';

  re = new RegExp(yield buffer.unpack(String),flags);
  re.lastIndex = yield buffer.unpack(Number);

  return re;
}

module.exports = function(ebjs){
  ebjs.setPacker(RegExp,packer);
  ebjs.setUnpacker(RegExp,unpacker);
};
