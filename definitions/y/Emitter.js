var labels = require('../labels.js'),
    Connection = require('../../connection.js'),
    emitter = require('./Target.js').emitter,
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
      em = new Emitter();

  try{
    conn.open();
    em.target[emitter] = em;
    conn.send(em.target);
  }catch(e){ }

  return new Emitter(em,target);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Emitter,packer);
  ebjs.setUnpacker(labels.Emitter,unpacker);
};
