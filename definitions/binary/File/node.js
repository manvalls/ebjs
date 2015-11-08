var labels = require('../../labels.js');

function* unpacker(buffer,ref){
  var name = yield buffer.unpack(labels.String),
      lastModified = yield buffer.unpack(labels.Number),
      ret = yield buffer.unpack(labels.Blob);

  ret.name = name;
  ret.lastModified = lastModified;
  return ret;
}

module.exports = function(ebjs){
  ebjs.setUnpacker(labels.File,unpacker);
};
