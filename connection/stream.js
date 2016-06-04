var handle = require('./handle/stream.js'),
    link = require('./utils/link.js'),
    Connection = require('../connection.js');

module.exports = function(stream,constraints){
  var ld;

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});
  handle(stream,ld.connection,ld.packer,ld.unpacker,constraints.bytes,constraints.chunkSize);
  return ld.connection;
};
