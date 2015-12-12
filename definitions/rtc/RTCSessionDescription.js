var label = require('../../label.js'),
    labels = require('../labels.js'),
    utils = require('./utils.js'),

    types = ['offer','pranswer','answer','rollback'];

if(utils.RTCSessionDescription) Object.defineProperty(utils.RTCSessionDescription.prototype,label,{
  value: labels.RTCSessionDescription,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  data = data || {};
  yield buffer.pack(types.indexOf(data.type),labels.Number);
  yield buffer.pack(data.sdp,labels.String);
}

function* unpacker(buffer,ref){
  var dic = {
    type: types[yield buffer.unpack(labels.Number)],
    sdp: yield buffer.unpack(labels.String)
  };

  if(utils.RTCSessionDescription) return new utils.RTCSessionDescription(dic);
  return dic;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.RTCSessionDescription,packer);
  ebjs.setUnpacker(labels.RTCSessionDescription,unpacker);
};
