var labels = require('../labels.js'),
    utils = require('./utils.js'),
    Connection = require('../../connection.js'),
    RTCConnection = require('../../connection/rtc.js'),
    walk = require('y-walk'),

    handlePacker = require('../../connection/handle/browser-like/packer.js'),
    handleUnpacker = require('../../connection/handle/browser-like/unpacker.js'),
    link = require('../../connection/utils/link.js'),

    HANDOVER_START = 0,
    HANDOVER_END = 1,
    MESSAGE = 2;

// Packer

function* packer(buffer,data){
  var relay = new Connection(),
      ld = link(data.end,{constraints: data,ebjs: this}),
      pc,fwd;

  yield buffer.pack(relay.end,labels.Connection);
  yield buffer.pack(data.bytes,labels.Number);
  yield buffer.pack(data.connections,labels.Number);
  yield buffer.pack(data.chunkSize,labels.Number);
  yield buffer.pack(data.rtcConfig);

  if(utils.RTCPeerConnection) try{
    pc = new utils.RTCPeerConnection(data.rtcConfig || {iceServers: utils.iceServers});
    if(typeof pc.createDataChannel != 'function') pc = null;
  }catch(e){}

  relay.open();
  relay.once('detached',detachIt,data);
  data.once('detached',detachIt,relay);

  relay.forwarding = true;
  relay.waiting = false;
  fwd = walk(forwardIt,[ld.packer,relay,data.chunkSize]);
  relay.on('message',onMessage,pc,ld,data);

  if(pc){
    handleDC(pc.createDataChannel(''),relay,fwd,ld);
    utils.sendCandidates(pc,relay);
    utils.sendOffer(pc,relay);
  }

}

// Unpacker

function* unpacker(buffer,ref){
  var relay = yield buffer.unpack(labels.Connection),
      data = new RTCConnection({
        bytes: yield buffer.unpack(labels.Number),
        connections: yield buffer.unpack(labels.Number),
        chunkSize: yield buffer.unpack(labels.Number),
        rtcConfig: yield buffer.unpack()
      }),
      ld = link(data,{constraints: data,ebjs: this}),
      pc,fwd;

  if(utils.RTCPeerConnection) try{
    pc = new utils.RTCPeerConnection(data.rtcConfig || {iceServers: utils.iceServers});
    if(typeof pc.createDataChannel != 'function') pc = null;
  }catch(e){}

  relay.open();
  relay.once('detached',detachIt,data);
  data.once('detached',detachIt,relay);

  relay.forwarding = true;
  relay.waiting = false;
  fwd = walk(forwardIt,[ld.packer,relay,data.chunkSize]);
  relay.on('message',onMessage,pc,ld,data);

  if(pc){
    utils.sendCandidates(pc,relay);
    pc.ondatachannel = e => {
      pc.ondatachannel = null;
      handleDC(e.channel,relay,fwd,ld);
    };
  }

  return data;
}

// handlers

function handleDC(dc,relay,fwd,ld){

  function signalOpen(){
    relay.forwarding = false;
    relay.dc = dc;
    fwd.listen(startHandover,[relay]);
  }

  handleUnpacker(dc,ld.connection,ld.unpacker,ld.connection.bytes);
  if(dc.readyState == 'open') signalOpen();
  else dc.onopen = signalOpen;

}

function startHandover(relay,packer){
  relay.waiting = true;
  relay.send([HANDOVER_START]);
}

function detachIt(ev,d,conn){
  conn.detach();
}

function* forwardIt(packer,relay,chunkSize){
  while(relay.forwarding) relay.send([MESSAGE,yield packer.read(chunkSize)]);
}

function* onMessage(message,d,pc,ld,conn){
  var msg;

  if(message instanceof Array) switch(message[0]){
    case MESSAGE:
      if(!(message[1] instanceof Uint8Array)) return;
      ld.unpacker.write(message[1]);
      if(conn.bytes && ld.unpacker.bytesSinceFlushed > conn.bytes) conn.detach();
      return;
    case HANDOVER_START: return this.send([HANDOVER_END]);
    case HANDOVER_END:
      if(!this.waiting) return;
      this.waiting = false;
      handlePacker(this.dc,ld.connection,ld.packer,conn.chunkSize);
      return;
  }

  if(!pc) return;
  utils.handleMessage(pc,message,this);
}

/*/ exports /*/

module.exports = function(ebjs){
  ebjs.setPacker(labels.RTCConnection,packer,ebjs);
  ebjs.setUnpacker(labels.RTCConnection,unpacker,ebjs);
};
