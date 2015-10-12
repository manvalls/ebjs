
function* packer(buffer,data){
  var keys = Object.keys(data),i;

  yield buffer.pack(keys.length,Number);

  for(i = 0;i < keys.length;i++){
    yield buffer.pack(keys[i],String);
    yield buffer.pack(data[keys[i]]);
  }

}

function* unpacker(buffer,ref){
  var data = ref.set({}),
      size = yield buffer.unpack(Number),
      i;

  for(i = 0;i < size;i++) data[yield buffer.unpack(String)] = yield buffer.unpack();
  return data;
}

module.exports = function(ebjs){
  ebjs.setPacker(Object,packer);
  ebjs.setUnpacker(Object,unpacker);
};
