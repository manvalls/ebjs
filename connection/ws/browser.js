var handle = require('../handle/browser-like.js'),
    link = require('../link.js'),
    Connection = require('../../connection.js');

module.exports = function(url,constraints){
  var ws = new WebSocket(url,'ebjs-connection'),
      ld;

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});
  handle(ws,ld.connection,ld.packer,ld.unpacker,constraints.bytes);
  return ld.connection;
};
