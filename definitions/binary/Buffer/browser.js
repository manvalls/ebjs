var labels = require('../../labels.js');

function* unpacker(buffer,ref){
  var length = yield buffer.unpack(labels.Number),
      buff = new Uint8Array(length);

  return yield buffer.read(buff);
}

module.exports = function(ebjs){
  ebjs.setUnpacker(labels.Buffer,unpacker);
};
