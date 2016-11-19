var label = require('../../label.js'),
    labels = require('../labels.js'),
    utils = require('./utils.js'),
    Connection = require('../../connection.js'),
    Resolver = require('y-resolver');

if(utils.MediaStream) Object.defineProperty(utils.MediaStream.prototype,label,{
  value: labels.MediaStream,
  writable: true,
  configurable: true
});

// Real definitions

function* packer(buffer,data){
  var conn = new Connection(),
      pc;

  if(data.rtcConfig){
    yield buffer.pack(true,labels.Boolean);
    yield buffer.pack(data.rtcConfig,labels.Object);
  }else yield buffer.pack(false,labels.Boolean);

  yield buffer.pack(conn.end,labels.Connection);

  try{
    pc = new utils.RTCPeerConnection(data.rtcConfig || {iceServers: utils.iceServers});
    pc.addStream(data);

    conn.open();
    conn.on('message',onMessage,pc,conn);
    utils.sendCandidates(pc,conn);
    utils.sendOffer(pc,conn);
  }catch(e){
    conn.detach();
    return;
  }

}

function* unpacker(buffer,ref){
  var res = new Resolver(),
      config,conn,pc,st;

  if(yield buffer.unpack(labels.Boolean)) config = yield buffer.unpack(labels.Object);
  conn = yield buffer.unpack(labels.Connection);

  try{
    pc = new utils.RTCPeerConnection(config || {iceServers: utils.iceServers});
    pc.onaddstream = function(e){
      res.accept(e.stream);
    };

    conn.open();
    conn.on('message',onMessage,pc,conn);
    conn.once('detached',resolveIt,res);
    utils.sendCandidates(pc,conn);

    st = yield res.yielded;
    if(config) st.rtcConfig = config;
    st.addEventListener('ended',function(e){
      conn.detach();
    });

    return st;
  }catch(e){ return new utils.MediaStream(); }
}

function onMessage(msg,d,pc,conn){
  utils.handleMessage(pc,msg,conn);
}

function resolveIt(e,d,res){
  res.accept(new utils.MediaStream());
}

// Fake definitions

function* fakePacker(buffer,data){
  data = data || {};

  if(data.rtcConfig){
    yield buffer.pack(true,labels.Boolean);
    yield buffer.pack(data.rtcConfig,labels.Object);
  }else yield buffer.pack(false,labels.Boolean);

  yield buffer.pack(data.connection,labels.Connection);
}

function* fakeUnpacker(buffer,ref){
  var ret = ref.set({
    [label]: labels.MediaStream
  });

  if(yield buffer.unpack(labels.Boolean)) ret.rtcConfig = yield buffer.unpack(labels.Object);
  ret.connection = yield buffer.unpack(labels.Connection);
  return ret;
}

/*/ exports /*/

module.exports = function(ebjs){

  if(utils.MediaStream && utils.RTCPeerConnection && utils.canAddStream){
    ebjs.setPacker(labels.MediaStream,packer);
    ebjs.setUnpacker(labels.MediaStream,unpacker);
  }else{
    ebjs.setPacker(labels.MediaStream,fakePacker);
    ebjs.setUnpacker(labels.MediaStream,fakeUnpacker);
  }

};
