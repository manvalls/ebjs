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
    conn.walk(handleConnection,[ack,data,this.burst]);
  }catch(e){ }
}

function* handleConnection(ack,setter,burst){
  var getter = yield this.until('message');

  getter.frozen().listen(setter.freeze,[],setter);
  getter.observe(getter.value,watcher,ack,setter,burst);
  this.send();
}

function watcher(v,ov,d,ack,setter,burst){

  ack.array.push(v);
  if(ack.array.length > burst){
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
    conn.once('message',connectGetter,sent,setter.getter,ack,this.burst);
  }catch(e){ }

  return new Setter(setter,getter);
}

function* connectGetter(m,d,sent,getter,ack,burst){
  sent.getter.observe(sent.getter.value,fillAck,ack,burst);
  getter.connect(sent);
  if(this[children]) yield this[children].is(0);
  this.detach();
}

function fillAck(v,ov,d,ack,burst){

  ack.array.push(v);
  if(ack.array.length > burst){
    ack.offset++;
    ack.array.shift();
  }

}

module.exports = function(ebjs,constraints){
  constraints = constraints || {burst: 5};
  ebjs.setPacker(labels.Setter,packer,constraints);
  ebjs.setUnpacker(labels.Setter,unpacker,constraints);
};
