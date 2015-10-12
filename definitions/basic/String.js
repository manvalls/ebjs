var getBytes = require('./String/getBytes.js'),
    getString = require('./String/getString.js');

function* packer(buffer,data){
  var bytes = getBytes(data);

  yield buffer.pack(bytes.length,Number);
  yield buffer.write(bytes);
}

function* unpacker(buffer,ref){
  var length = yield buffer.unpack(Number);
  return getString(yield buffer.read(length));
}

module.exports = function(ebjs){
  ebjs.setPacker(String,packer);
  ebjs.setUnpacker(String,unpacker);
};
