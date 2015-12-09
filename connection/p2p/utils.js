var prefix = require('u-proto/prefix'),
    Pair = require('y-callback/pair');

exports.iceServers = [];

exports.RTCPeerConnection = global[prefix]('RTCPeerConnection');
exports.RTCSessionDescription = global[prefix]('RTCSessionDescription');
exports.RTCIceCandidate = global[prefix]('RTCIceCandidate');

if(!exports.RTCPeerConnection && global.RTCRtpSender){
  exports.RTCPeerConnection = require('ortc-adapter').RTCPeerConnection;
  exports.RTCSessionDescription = require('ortc-adapter').RTCSessionDescription;
  exports.RTCIceCandidate = require('ortc-adapter').RTCIceCandidate;
}

if(exports.RTCPeerConnection) (function(){
  var pc = new exports.RTCPeerConnection({iceServers: []}),
      promise;

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
