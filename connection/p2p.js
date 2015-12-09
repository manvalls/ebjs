var handle = require('./handle/browser-like.js'),
    link = require('./link.js'),
    Connection = require('../connection.js'),
    prefix = require('u-proto/prefix'),

    utils = require('./p2p/utils.js'),

    iceServers = [],

    MSG = 0,
    HI = 1,
    ICE = 2,
    OFFER = 3,
    ANSWER = 4;

module.exports = function(connection,constraints){
  var relay = connection.lock(),
      outConn = new Connection(),
      agent = outConn.lock(),
      ice = {queue: [],ready: false},
      forwarder,pc,dc,date,perf,rand;

  constraints = constraints || {};

  if(utils.RTCPeerConnection){
    pc = new utils.RTCPeerConnection({iceServers: constraints.iceServers || iceServers});
    if(typeof pc.createDataChannel != 'function') pc = null;
    else{
      date = Date.now();
      perf = global.performance ? performance.now() : Math.random();
      rand = Math.random();
    }
  }

  function onDataChannel(e){
    var ld;

    if(dc) return;
    forwarder.detach();
    dc = e.channel;
    ld = link(new Connection(),{constraints});
    handle(dc,ld.connection,ld.packer,ld.unpacker,constraints.bytes);

    ld.connection.open();
    outConn.once('detached',detachIt,ld.connection);
    ld.connection.once('detached',detachIt,outConn);
    ld.connection.on('message',sendIt,agent);
    agent.on('message',sendIt,ld.connection);
  }

  forwarder = agent.on('message',forwardIt,relay);
  relay.on('message',onMessage,agent,relay,pc,date,perf,rand,onDataChannel,ice);
  connection.once('detached',detachIt,outConn);

  if(pc){

    relay.send([HI,date,perf,rand]);
    pc.ondatachannel = onDataChannel;
    pc.onicecandidate = function(e){
      if(!e.candidate) return;
      relay.send([ICE,{
        candidate: e.candidate.candidate,
        sdpMid: e.candidate.sdpMid,
        sdpMLineIndex: e.candidate.sdpMLineIndex,
        foundation: e.candidate.foundation,
        priority: e.candidate.priority,
        ip: e.candidate.ip,
        protocol: e.candidate.protocol,
        port: e.candidate.port,
        type: e.candidate.type,
        tcpType: e.candidate.tcpType,
        relatedAddress: e.candidate.relatedAddress,
        relatedPort: e.candidate.relatedPort
      }]);
    };

  }else relay.send([HI]);

  return outConn.end;
};

// Handlers

function* onMessage(msg,d,agent,relay,pc,date,perf,rand,onDataChannel,ice){
  var offer,answer;

  if(msg instanceof Array) switch(msg[0]){

    case MSG:
      agent.send(msg[1]);
      break;

    case HI:

      if(
        msg.length < 4 ||
        !pc ||
        msg[1] < date ||
        (
          msg[1] == date && (
            msg[2] < perf || (
              msg[2] == perf && msg[3] <= rand
            )
          )
        )
      ) return;

      onDataChannel({channel: pc.createDataChannel('')});
      offer = yield utils.createOffer(pc);
      yield utils.setLocalDescription(pc,offer);
      relay.send([OFFER,{type: offer.type, sdp: offer.sdp}]);

      break;

    case ICE:
      if(!pc) return;

      if(ice.ready) utils.addIceCandidate(pc,new utils.RTCIceCandidate(msg[1]));
      else ice.queue.push(msg[1]);

      break;

    case OFFER:
      if(!pc) return;

      yield utils.setRemoteDescription(pc,new utils.RTCSessionDescription(msg[1]));
      answer = yield utils.createAnswer(pc);
      yield utils.setLocalDescription(pc,answer);
      processQueue(ice,pc);
      relay.send([ANSWER,{type: answer.type,sdp: answer.sdp}]);

      break;

    case ANSWER:
      if(!pc) return;
      yield utils.setRemoteDescription(pc,new utils.RTCSessionDescription(msg[1]));
      processQueue(ice,pc);
      break;

  }

}

function processQueue(ice,pc){
  var candidate;

  ice.ready = true;
  while(candidate = ice.queue.shift())
    utils.addIceCandidate(pc,new utils.RTCIceCandidate(candidate));
}

function detachIt(ev,d,conn){
  conn.detach();
}

function sendIt(msg,d,conn){
  conn.send(msg);
}

function forwardIt(msg,d,relay){
  relay.send([MSG,msg]);
}
