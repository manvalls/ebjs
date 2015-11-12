var labels = require('../../labels.js');

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
  ebjs.setUnpacker(labels.FileList,unpacker);
};
