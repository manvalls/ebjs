
function* packer(buffer,data){
  yield buffer.pack(data ? 1 : 0,Number);
}

function* unpacker(buffer,ref){
  return !!(yield buffer.unpack(Number));
}

module.exports = function(ebjs){
  ebjs.setPacker(Boolean,packer);
  ebjs.setUnpacker(Boolean,unpacker);
};
