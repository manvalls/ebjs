var label = require('../../label.js'),
    labels = require('../labels.js'),
    Connection = require('../../connection.js');

function* packer(buffer,data){
  yield buffer.pack(-1,labels.Number);
}

function* unpacker(buffer,ref){
  var conn = new Connection();

  yield buffer.unpack(labels.Number);
  conn.detach();
  return conn;
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Connection,packer);
  ebjs.setUnpacker(labels.Connection,unpacker);
};
