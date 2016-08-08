var label = require('../../label.js'),
    labels = require('../labels.js'),
    RBlob = require('rblob'),
    Connection = require('../../connection.js');

function* packer(buffer,data){
  var conn = new Connection();

  try{ data.handleConnection(conn); }
  catch(e){ }

  yield buffer.pack(conn.end,labels.Connection);
  yield buffer.pack(data.size,labels.Number);
  yield buffer.pack(data.metadata,labels.Object);
}

function* unpacker(buffer,ref){
  var conn = yield buffer.unpack(labels.Connection),
      size = yield buffer.unpack(labels.Number),
      metadata = yield buffer.unpack(labels.Object);

  return new RBlob(conn,size,metadata);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.RBlob,packer);
  ebjs.setUnpacker(labels.RBlob,unpacker);
};
