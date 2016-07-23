var handle = require('./handle/message-port.js'),
    link = require('./utils/link.js'),
    Connection = require('../connection.js');

module.exports = function(port,constraints){
  var ld;

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});
  handle(port,ld.connection,ld.packer,ld.unpacker,constraints.bytes,constraints.chunkSize);
  return ld.connection;
};
