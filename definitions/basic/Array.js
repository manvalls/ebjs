
function* packer(buffer,data){
  yield buffer.pack(data.length,Number);
  for(var i = 0;i < data.length;i++) yield buffer.pack(data[i]);
}

function* unpacker(buffer,ref){
  var data = ref.set([]),
      size = yield buffer.unpack(Number);

  for(var i = 0;i < size;i++) data[i] = yield buffer.unpack();
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(Array,packer);
  ebjs.setUnpacker(Array,unpacker);
};
