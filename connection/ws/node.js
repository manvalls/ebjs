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

  constraints = constraints || {};
  ld = link(new Connection(),{constraints,ebjs: constraints.ebjs});

  socket = prv.connect(parseInt(u.port),u.hostname);
  drv = websocket.client(location,{
    maxLength: constraints.chunkSize + 1e3,
    protocols: ['ebjs-connection']
  });

  socket[driver] = drv;
  drv[connection] = socket;

  socket.on('connect',start);
  drv.once('close',close);
  socket.pipe(drv.io).pipe(socket);
  handle(drv,ld.connection,ld.packer,ld.unpacker,constraints.bytes,constraints.chunkSize);

  socket[connection] = ld.connection;
  socket.once('close',detachIt);
  return ld.connection;
};

// Handlers

function start(){
  this[driver].start();
}

function close(){
  this[connection].end();
}

function detachIt(){
  this[connection].detach();
}
