var _RTCConnection = require('./rtc/RTCConnection.js'),
    _RTCIceCandidate = require('./rtc/RTCIceCandidate.js'),
    _RTCSessionDescription = require('./rtc/RTCSessionDescription.js');

module.exports = function(ebjs){
  _RTCSessionDescription(ebjs);
  _RTCIceCandidate(ebjs);
  _RTCConnection(ebjs);
};
