var Connection = require('../../connection.js'),
    children = require('../../connection/children'),
    Setter = require('y-setter'),
    walk = require('y-walk'),
    gtPacker = require('./Getter.js').packer,
    gtUnpacker = require('./Getter.js').unpacker,
    label = require('../../label.js'),
    labels = require('../labels.js');

function* packer(buffer,data){
  var ack = {
        array: [],
        offset: 0
      },
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

  getter.frozen().listen(setter.freeze,[],setter);
  getter.observe(getter.value,watcher,ack,setter);
  this.send();
}

function watcher(v,ov,d,ack,setter){

  ack.array.push(v);
  if(ack.array.length > 5){
    ack.offset++;
    ack.array.shift();
  }

  setter.value = v;
}

function* unpacker(buffer,ref){
  var ack = {
        array: [],
        offset: 0
      },
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

function* connectGetter(m,d,sent,getter,ack){
  sent.getter.observe(sent.getter.value,fillAck,ack);
  getter.connect(sent);
  if(this[children]) yield this[children].is(0);
  this.detach();
}

function fillAck(v,ov,d,ack){

  ack.array.push(v);
  if(ack.array.length > 5){
    ack.offset++;
    ack.array.shift();
  }

}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Setter,packer);
  ebjs.setUnpacker(labels.Setter,unpacker);
};
