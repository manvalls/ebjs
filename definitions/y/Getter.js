var Connection = require('../../connection.js'),
    children = require('../../connection/utils/children.js'),
    walk = require('y-walk'),
    Setter = require('y-setter'),
    diff = require('input-diff'),
    label = require('../../label.js'),
    labels = require('../labels.js'),

    VALUE = 0,
    DIFF = 1,
    ACK = 2;

function* packer(buffer,data,ack){
  var conn = new Connection(),
      ov,d;

  data = data || {};
  yield buffer.pack(ov = data.value);
  yield buffer.pack(conn.end,labels.Connection);

  try{
    conn.open();
    d = data.observe(ov,watcher,conn,ack);
    conn.until('detached').listen(detachIt,[d]);
    walk(handleFreeze,[data,conn]);
  }catch(e){ }

}

function watcher(value,oldValue,d,conn,ack){
  var i;

  if(!conn.is('open')) return;

  if(ack && ack.array[0] === value){
    ack.array.shift();
    for(i = 0;i < ack.offset;i++) conn.send([ACK]);
    conn.send([ACK]);
    ack.offset = 0;
    return;
  }

  if(typeof value == 'string' && typeof oldValue == 'string')
    conn.send([DIFF,diff.get(oldValue,value)]);
  else conn.send([VALUE,value]);

}

function detachIt(d){
  d.detach();
}

function* handleFreeze(data,conn){
  yield data.frozen();
  if(conn[children]) yield conn[children].is(0);
  conn.detach();
}

function* unpacker(buffer,ref,ack){
  var setter = new Setter(),
      conn;

  if(ref) ref.set(setter.getter);
  setter.value = yield buffer.unpack();
  conn = yield buffer.unpack(labels.Connection);

  try{
    conn.open();
    conn.on('message',onMessage,setter,ack);
    conn.once('detached',freezeIt,setter);
  }catch(e){ }

  return setter.getter;
}

function onMessage(msg,d,setter,ack){

  if(msg instanceof Array) switch(msg[0]){

    case VALUE:
      setter.value = msg[1];
      break;

    case DIFF:
      try{ setter.value = diff.apply(setter.value,msg[1]); }
      catch(e){ }
      break;

    case ACK:
      if(!ack) return;
      if(ack.offset > 0) ack.offset--;
      else setter.value = ack.array.shift();
      break;

  }

}

function freezeIt(e,d,setter){
  setter.freeze();
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Getter,packer);
  ebjs.setUnpacker(labels.Getter,unpacker);
};

module.exports.packer = packer;
module.exports.unpacker = unpacker;
