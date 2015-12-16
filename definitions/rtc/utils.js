var prefix = require('u-proto/prefix'),
    Pair = require('y-callback/pair'),
    walk = require('y-walk');

exports.iceServers = [
  {urls: 'stun:stun.l.google.com:19302'},
  {urls: 'stun:stun1.l.google.com:19302'},
  {urls: 'stun:stun2.l.google.com:19302'},
  {urls: 'stun:stun3.l.google.com:19302'},
  {urls: 'stun:stun4.l.google.com:19302'},
  {urls: 'stun:stun-turn.org:3478'},
  {urls: 'turn:stun-turn.org:3478'},
  {
    urls: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username: 'homeo'
  }
];

exports.RTCPeerConnection = global[prefix]('RTCPeerConnection');
exports.RTCSessionDescription = global[prefix]('RTCSessionDescription');
exports.RTCIceCandidate = global[prefix]('RTCIceCandidate');
exports.MediaStream = global[prefix]('MediaStream');

if(!exports.RTCPeerConnection && global.RTCRtpSender){
  exports.RTCPeerConnection = require('ortc-adapter').RTCPeerConnection;
  exports.RTCSessionDescription = require('ortc-adapter').RTCSessionDescription;
  exports.RTCIceCandidate = require('ortc-adapter').RTCIceCandidate;
}

if(exports.RTCPeerConnection) (function(){
  var pc = new exports.RTCPeerConnection({iceServers: []}),
      promise;

  if(typeof pc.createDataChannel == 'function') exports.canCreateDataChannel = true;
  if(typeof pc.addStream == 'function') exports.canAddStream = true;

  try{
    promise = pc.createOffer();
    if(typeof promise.then != 'function') throw new Error();

    exports.addIceCandidate = function(pc,ice){
      return pc.addIceCandidate(ice);
    };

    exports.createOffer = function(pc){
      return pc.createOffer();
    };

    exports.createAnswer = function(pc){
      return pc.createAnswer();
    };

    exports.setLocalDescription = function(pc,desc){
      return pc.setLocalDescription(desc);
    };

    exports.setRemoteDescription = function(pc,desc){
      return pc.setRemoteDescription(desc);
    };

  }catch(e){

    exports.addIceCandidate = function(pc,ice){
      var pair = Pair();
      pc.addIceCandidate(ice,pair[0],pair[1]);
      return pair;
    };

    exports.createOffer = function(pc){
      var pair = Pair();
      pc.createOffer(pair[0],pair[1]);
      return pair;
    };

    exports.createAnswer = function(pc){
      var pair = Pair();
      pc.createAnswer(pair[0],pair[1]);
      return pair;
    };

    exports.setLocalDescription = function(pc,desc){
      var pair = Pair();
      pc.setLocalDescription(desc,pair[0],pair[1]);
      return pair;
    };

    exports.setRemoteDescription = function(pc,desc){
      var pair = Pair();
      pc.setRemoteDescription(desc,pair[0],pair[1]);
      return pair;
    };

  }

})();

exports.handleMessage = walk.wrap(function*(pc,message,relay){
  var answer;

  if(message.candidate){
    exports.addIceCandidate(pc,message);
    return;
  }

  if(message.type == 'offer'){
    yield exports.setRemoteDescription(pc,message);
    answer = yield exports.createAnswer(pc);
    exports.setLocalDescription(pc,answer);
    relay.send(answer);
    return;
  }

  if(message.type == 'answer'){
    yield exports.setRemoteDescription(pc,message);
    return;
  }

});

exports.sendCandidates = function(pc,relay){

  pc.onicecandidate = function(e){
    if(e.candidate) relay.send(e.candidate);
  };

};

exports.sendOffer = walk.wrap(function*(pc,relay){
  var offer = yield exports.createOffer(pc);
  exports.setLocalDescription(pc,offer);
  relay.send(offer);
});
