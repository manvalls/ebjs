var Connection = require('../../connection.js'),
    children = require('../../connection/children'),
    Setter = require('y-setter'),
    diff = require('input-diff'),
    label = require('../../label.js'),
    labels = require('../labels.js'),

    VALUE = 0,
    DIFF = 1;

function* packer(buffer,data){
  var conn = new Connection(),
      ov,d;

  data = data || {};
  yield buffer.pack(ov = data.value);
  yield buffer.pack(conn.end,labels.Connection);

  try{
    conn.open();
    d = data.observe(ov,watcher,conn);
    conn.until('detached').listen(detachIt,[d]);
    data.frozen().listen(detachIt,[conn]);
  }catch(e){ }

}

function watcher(value,oldValue,d,conn){
  if(typeof value == 'string' && typeof oldValue == 'string')
    conn.send([DIFF,diff.get(oldValue,value)]);
  else conn.send([VALUE,value]);
}

function detachIt(d){
  d.detach();
}

function* unpacker(buffer,ref){
  var setter = new Setter(),
      conn;

  ref.set(setter.getter);
  setter.value = yield buffer.unpack();
  conn = yield buffer.unpack(labels.Connection);

  try{
    conn.open();
    conn.on('message',onMessage,setter);
    conn.once('detached',freezeIt,setter);
  }catch(e){ }

  return setter.getter;
}

function onMessage(msg,d,setter){

  if(msg instanceof Array) switch(msg[0]){

    case VALUE:
      setter.value = msg[1];
      break;

    case DIFF:
      try{ setter.value = diff.apply(setter.value,msg[1]); }
      catch(e){ }
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
