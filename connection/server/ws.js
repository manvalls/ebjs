/**/ 'use strict' /**/
var handle = require('../handle/driver.js'),
    link = require('../link.js'),
    Connection = require('../../connection.js'),

    Target = require('y-emitter').Target,
    websocket = require('websocket-driver'),

    emitter = Symbol(),
    server = Symbol(),
    listener = Symbol(),
    connection = Symbol();

module.exports = function(srv,options){
  var connectionServer = new ConnectionServer(),
      host,url,constraints;

  options = options || {};
  host = options.host;
  url = options.url;

  constraints = {
    bytes: options.bytes,
    connections: options.connections
  };

  function onUpgrade(request,socket,body){
    var driver,ld;

    if(!websocket.isWebSocket(request)) return;
    if(host && (request.headers.host || '').replace(/\:\d*$/,'') != host) return;
    if(url && request.url != url) return;

    driver = websocket.http(request,{
      maxLength: 2e3,
      protocols: ['ebjs-connection']
    });

    driver[connection] = socket;
    driver.once('close',close);
    driver.io.write(body);
    socket.pipe(driver.io).pipe(socket);

    ld = link(new Connection(),{constraints,ebjs: options.ebjs});
    handle(driver,ld.connection,ld.packer,ld.unpacker,constraints.bytes);

    driver.start();
    connectionServer[emitter].give('connection',ld.connection);
  }

  srv.on('upgrade',onUpgrade);
  connectionServer[listener] = onUpgrade;
  connectionServer[server] = srv;
  return connectionServer;
};

class ConnectionServer extends Target{

  constructor(){
    super(emitter);
  }

  detach(){
    this[server].removeListener('upgrade',this[listener]);
    this[emitter].set('detached');
  }

}

// Handlers

function close(){
  this[connection].end();
}
