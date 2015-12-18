var Connection = require('../../connection.js'),
    Resolver = require('y-resolver'),
    label = require('../../label.js'),
    labels = require('../labels.js'),

    ACCEPT = 0,
    REJECT = 1;

function* packer(buffer,data){
  var conn;

  data = data || {};

  if(data.done){
    yield buffer.pack(true,labels.Boolean);
    yield buffer.pack(data.accepted,labels.Boolean);
    if(data.accepted) yield buffer.pack(data.value);
    else yield buffer.pack(data.error);
  }else{
    conn = new Connection();
    yield buffer.pack(false,labels.Boolean);
    yield buffer.pack(conn.end,labels.Connection);

    try{
      conn.open();
      data.listen(listener,[conn]);
    }catch(e){ conn.detach(); }
  }

}

function listener(conn){
  if(this.accepted) conn.send([ACCEPT,this.value]);
  else conn.send([REJECT,this.error]);
}

function* unpacker(buffer,ref){
  var res = new Resolver(),
      conn;

  ref.set(res.yielded);

  if(yield buffer.unpack(labels.Boolean)){
    if(yield buffer.unpack(labels.Boolean)) res.accept(yield buffer.unpack());
    else res.reject(yield buffer.unpack());
  }else{
    conn = yield buffer.unpack(labels.Connection);
    try{
      conn.open();
      conn.once('message',onceMessage,res);
    }catch(e){}
  }

  return res.yielded;
}

function onceMessage(msg,d,res){

  if(msg instanceof Array) switch(msg[0]){

    case ACCEPT:
      res.accept(msg[1]);
      break;

    case REJECT:
      res.reject(msg[1]);
      break;

  }

  this.detach();

}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Yielded,packer);
  ebjs.setUnpacker(labels.Yielded,unpacker);
};
