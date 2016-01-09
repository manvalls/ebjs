var labels = require('../labels.js'),
    Connection = require('../../connection.js'),
    Emitter = require('y-emitter');

function* packer(buffer,data){
  var conn = new Connection();

  conn.open();
  data = data || {};
  yield buffer.pack(data.target,labels.Target);
  yield buffer.pack(conn.end,labels.Connection);
  conn.once('message',bindIt,data);
}

function* bindIt(target,d,emitter){
  var link;

  try{
    link = emitter.bind(target);
    yield this.until('detached');
    link.detach();
  }catch(e){ }

}

function* unpacker(buffer,ref){
  var target = yield buffer.unpack(labels.Target),
      conn = yield buffer.unpack(labels.Connection),
      emitter = new Emitter();

  try{
    conn.open();
    conn.send(emitter.target);
  }catch(e){ }

  return new Emitter(emitter,target);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Emitter,packer);
  ebjs.setUnpacker(labels.Emitter,unpacker);
};
