var _RTCConnection = require('./rtc/RTCConnection.js'),
    _RTCIceCandidate = require('./rtc/RTCIceCandidate.js'),
    _RTCSessionDescription = require('./rtc/RTCSessionDescription.js'),
    _MediaStream = require('./rtc/MediaStream.js');

module.exports = function(ebjs){
  _RTCSessionDescription(ebjs);
  _RTCIceCandidate(ebjs);
  _RTCConnection(ebjs);
  _MediaStream(ebjs);
};
