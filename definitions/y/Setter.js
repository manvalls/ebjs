var Connection = require('../../connection.js'),
    Setter = require('y-setter'),
    walk = require('y-walk'),
    gtPacker = require('./Getter.js').packer,
    gtUnpacker = require('./Getter.js').unpacker,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  var ack = [],
      conn = new Connection();

  data = data || {};
  yield buffer.pack(conn.end,labels.Connection);
  yield walk(gtPacker,[buffer,data.getter,ack]);

  try{
    conn.open();
    conn.walk(handleConnection,[ack,data]);
  }catch(e){ }
}

function* handleConnection(ack,setter){
  var getter = yield this.until('message');

  getter.observe(getter.value,watcher,ack,setter);
  this.send();
}

function watcher(v,ov,d,ack,setter){
  ack.push(v);
  setter.value = v;
}

function* unpacker(buffer,ref){
  var ack = [],
      conn = yield buffer.unpack(labels.Connection),
      getter = yield walk(gtUnpacker,[buffer,null,ack]),
      setter = new Setter(),
      sent = new Setter();

  try{
    conn.open();
    conn.send(sent.getter);
    conn.once('message',connectGetter,sent,setter.getter,ack);
  }catch(e){ }

  return new Setter(setter,getter);
}

function connectGetter(m,d,sent,getter,ack){
  sent.getter.observe(sent.getter.value,fillAck,ack);
  getter.connect(sent);
}

function fillAck(v,ov,d,ack){
  ack.push(v);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Setter,packer);
  ebjs.setUnpacker(labels.Setter,unpacker);
};
