var label = require('../../label.js'),
    labels = require('../labels.js'),
    utils = require('./utils.js'),

    protocols = ['tcp','udp'],
    types = ['host','srflx','prflx','relay'],
    tcpTypes = ['active','passive','so'];

if(utils.RTCIceCandidate) Object.defineProperty(utils.RTCIceCandidate.prototype,label,{
  value: labels.RTCIceCandidate,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  data = data || {};
  yield buffer.pack(data.candidate,labels.String);
  yield buffer.pack(data.sdpMid,labels.String);
  yield buffer.pack(data.sdpMLineIndex,labels.Number);
  yield buffer.pack(data.foundation,labels.String);
  yield buffer.pack(data.priority,labels.Number);
  yield buffer.pack(data.ip,labels.String);
  yield buffer.pack(protocols.indexOf(data.protocol),labels.Number);
  yield buffer.pack(data.port,labels.Number);
  yield buffer.pack(types.indexOf(data.type),labels.Number);
  yield buffer.pack(tcpTypes.indexOf(data.tcpType),labels.Number);
  yield buffer.pack(data.relatedAddress,labels.String);
  yield buffer.pack(data.relatedPort,labels.Number);
}

function* unpacker(buffer,ref){
  var dic = {
    candidate: yield buffer.unpack(labels.String),
    sdpMid: yield buffer.unpack(labels.String),
    sdpMLineIndex: yield buffer.unpack(labels.Number),
    foundation: yield buffer.unpack(labels.String),
    priority: yield buffer.unpack(labels.Number),
    ip: yield buffer.unpack(labels.String),
    protocol: protocols[yield buffer.unpack(labels.Number)],
    port: yield buffer.unpack(labels.Number),
    type: types[yield buffer.unpack(labels.Number)],
    tcpType: tcpTypes[yield buffer.unpack(labels.Number)],
    relatedAddress: yield buffer.unpack(labels.String),
    relatedPort: yield buffer.unpack(labels.Number)
  };

  if(utils.RTCIceCandidate) return new utils.RTCIceCandidate(dic);
  return dic;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.RTCIceCandidate,packer);
  ebjs.setUnpacker(labels.RTCIceCandidate,unpacker);
};
