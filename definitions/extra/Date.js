
function* packer(buffer,data){
  yield buffer.pack(data.getTime(),Number);
}

function* unpacker(buffer,ref){
  return new Date(yield buffer.unpack(Number));
}

module.exports = function(ebjs){
  ebjs.setPacker(Date,packer);
  ebjs.setUnpacker(Date,unpacker);
};
