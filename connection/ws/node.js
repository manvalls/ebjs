var handle = require('../handle/driver.js'),
    link = require('../utils/link.js'),
    Connection = require('../../connection.js'),

    websocket = require('websocket-driver'),

    net = require('net'),
    tls = require('tls'),
    url = require('url'),

    driver = Symbol(),
    connection = Symbol();

module.exports = function(location,constraints){
  var u = url.parse(location),
      prv,socket,drv,ld;

  if(u.protocol == 'wss:') prv = tls;
  else prv = net;

  socket = prv.connect(parseInt(u.port),u.hostname);
  drv = websocket.client(location,{
    maxLength: 2e3,
    protocols: ['ebjs-connection']
  });

  socket[driver] = drv;
  drv[connection] = socket;

  socket.on('connect',start);
  drv.once('close',close);
  socket.pipe(drv.io).pipe(socket);

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});
  handle(drv,ld.connection,ld.packer,ld.unpacker,constraints.bytes);
  return ld.connection;
};

// Handlers

function start(){
  this[driver].start();
}

function close(){
  this[connection].end();
}
