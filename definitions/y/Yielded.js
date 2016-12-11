var Connection = require('../../connection.js'),
    children = require('../../connection/utils/children.js'),
    Resolver = require('y-resolver'),
    label = require('../../label.js'),
    labels = require('../labels.js'),

    ACCEPT = 0,
    REJECT = 1,
    ACK = 2;

function* packer(buffer,data,ack){
  var conn;

  if(data && data.done){
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
      data.listen(listener,[conn,ack]);
    }catch(e){ conn.detach(); }
  }

}

function listener(conn,ack){

  if(!conn.is('open')) return;

  if(
    ack &&
    ack.done &&
    ack.accepted == this.accepted &&
    (
      (
        ack.accepted && this.value === ack.value
      ) ||
      (
        !ack.accepted && this.error === ack.error
      )
    )
  ){
    conn.send([ACK]);
    return;
  }

  if(this.accepted) conn.send([ACCEPT,this.value]);
  else conn.send([REJECT,this.error]);
}

function* unpacker(buffer,ref,ack){
  var res = new Resolver(),
      conn;

  if(ref) ref.set(res.yielded);

  if(yield buffer.unpack(labels.Boolean)){
    if(yield buffer.unpack(labels.Boolean)) res.accept(yield buffer.unpack());
    else res.reject((yield buffer.unpack()),true);
  }else{
    conn = yield buffer.unpack(labels.Connection);
    try{
      conn.open();
      conn.once('message',onceMessage,res,ack);
      conn.until('detached').listen(res.reject,[],res);
    }catch(e){
      res.reject(e);
    }
  }

  return res.yielded;
}

function* onceMessage(msg,d,res,ack){

  if(msg instanceof Array) switch(msg[0]){

    case ACCEPT:
      res.accept(msg[1]);
      break;

    case REJECT:
      res.reject(msg[1],true);
      break;

    case ACK:
      if(!ack.done) break;
      if(ack.accepted) res.accept(ack.value);
      else res.reject(ack.error,true);
      break;

  }

  if(this[children]) yield this[children].is(0);
  this.detach();

}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Yielded,packer);
  ebjs.setUnpacker(labels.Yielded,unpacker);
};

module.exports.packer = packer;
module.exports.unpacker = unpacker;
