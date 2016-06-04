var Detacher = require('detacher'),
    label = require('../../label.js'),
    labels = require('../labels.js'),
    utils = require('./utils.js'),
    Connection = require('../../connection.js'),
    RTCConnection = require('../../connection/rtc.js'),

    handle = require('../../connection/handle/browser-like.js'),
    link = require('../../connection/utils/link.js'),

    HANDOVER_START = 0,
    HANDOVER_END = 1,
    MESSAGE = 2;

function* packer(buffer,data){
  var relay = new Connection(),
      agent = data.lock(),
      col = new Detacher(),
      ctx = {queue: []},
      pc,fwd;

  yield buffer.pack(relay.end,labels.Connection);
  yield buffer.pack(data.bytes,labels.Number);
  yield buffer.pack(data.connections,labels.Number);
  yield buffer.pack(data.rtcConfig);

  if(utils.RTCPeerConnection){
    pc = new utils.RTCPeerConnection(data.rtcConfig || {iceServers: utils.iceServers});
    if(typeof pc.createDataChannel != 'function') pc = null;
  }

  relay.open();
  relay.once('detached',detachIt,data);
  relay.on('message',onMessage,pc,agent,data,col,ctx);
  data.once('detached',detachIt,relay);
  fwd = agent.on('message',forwardIt,relay);

  if(pc){
    handleDC(pc.createDataChannel(''),agent,relay,data,this,fwd,ctx,col);
    utils.sendCandidates(pc,relay);
    utils.sendOffer(pc,relay);
  }
}

function* unpacker(buffer,ref){
  var relay = yield buffer.unpack(labels.Connection),
      data = new RTCConnection({
        bytes: yield buffer.unpack(labels.Number),
        connections: yield buffer.unpack(labels.Number),
        rtcConfig: yield buffer.unpack()
      }),
      agent = data.end.lock(),
      col = new Detacher(),
      ctx = {queue: []},
      pc,fwd;

  if(utils.RTCPeerConnection){
    pc = new utils.RTCPeerConnection(data.rtcConfig || {iceServers: utils.iceServers});
    if(typeof pc.createDataChannel != 'function') pc = null;
  }

  relay.open();
  relay.once('detached',detachIt,data);
  relay.on('message',onMessage,pc,agent,data,col,ctx);
  data.once('detached',detachIt,relay);
  fwd = agent.on('message',forwardIt,relay);

  if(pc){
    utils.sendCandidates(pc,relay);
    pc.ondatachannel = e => {
      pc.ondatachannel = null;
      handleDC(e.channel,agent,relay,data,this,fwd,ctx,col);
    };
  }

  return data;
}

function* onMessage(message,d,pc,agent,conn,col,ctx){
  var msg;

  if(message instanceof Array) switch(message[0]){
    case MESSAGE: return agent.send(message[1]);
    case HANDOVER_START: return this.send([HANDOVER_END]);
    case HANDOVER_END:
      col.detach();
      agent.on('message',sendIt,ctx.connection);
      conn.once('detached',detachIt,ctx.connection);
      ctx.connection.once('detached',detachIt,conn);
      while(msg = ctx.queue.shift()) ctx.connection.send(msg);
      return;
  }

  if(!pc) return;
  utils.handleMessage(pc,message,this);
}

function handleDC(dc,agent,relay,conn,ebjs,fwd,ctx,col){
  var ld = link(new Connection(),{conn,ebjs: ebjs});

  handle(dc,ld.connection,ld.packer,ld.unpacker,conn.bytes,conn.chunkSize);
  ctx.connection = ld.connection;
  ld.connection.open();
  ld.connection.once('detached',detachIt,conn);
  ld.connection.on('message',sendIt,agent);

  function signalOpen(){
    fwd.detach();
    col.add(agent.on('message',queueIt,ctx.queue));
    relay.send([HANDOVER_START]);
  }

  if(dc.readyState == 'open') signalOpen();
  else dc.onopen = signalOpen;
}

function detachIt(ev,d,conn){
  conn.detach();
}

function sendIt(msg,d,conn){
  conn.send(msg);
}

function queueIt(msg,d,queue){
  queue.push(msg);
}

function forwardIt(msg,d,relay){
  relay.send([MESSAGE,msg]);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.RTCConnection,packer,ebjs);
  ebjs.setUnpacker(labels.RTCConnection,unpacker,ebjs);
};
