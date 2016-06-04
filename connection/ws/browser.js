var handle = require('../handle/browser-like.js'),
    link = require('../utils/link.js'),
    Connection = require('../../connection.js');

module.exports = function(url,constraints){
  var ws = new WebSocket(url,'ebjs-connection'),
      ld;

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});
  console.log('--->',constraints.chunkSize);
  handle(ws,ld.connection,ld.packer,ld.unpacker,constraints.bytes,constraints.chunkSize);
  return ld.connection;
};
