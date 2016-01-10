/**/ 'use strict' /**/
var Resolver = require('y-resolver'),
    Lock = require('y-lock'),
    labels = require('../labels.js'),
    Connection = require('../../connection.js'),
    connection = Symbol(),

    GIVE = 0,
    TAKE = 1;

class LockProxy extends Lock{

  constructor(conn){
    super();
    this[connection] = conn;
  }

  give(n){
    try{ this[connection].send([GIVE,[...arguments]]); }
    catch(e){ }
  }

  take(n){
    var res = new Resolver();

    try{ this[connection].send([TAKE,[...arguments],res]); }
    catch(e){ }
    return res.yielded;
  }

}

function onMessage(msg,d,lock){

  if(msg instanceof Array) switch(msg[0]){

    case GIVE:
      try{ lock.give(...msg[1]); }
      catch(e){ }
      break;

    case TAKE:
      try{ msg[2].bind(lock.take(...msg[1])); }
      catch(e){ }
      break;

  }

}

function* packer(buffer,data){
  var conn = new Connection();

  conn.open();
  conn.on('message',onMessage,data);
  yield buffer.pack(conn.end,labels.Connection);
}

function* unpacker(buffer,ref){
  var conn = yield buffer.unpack(labels.Connection);

  try{ conn.open(); }
  catch(e){ }
  return new LockProxy(conn);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Lock,packer);
  ebjs.setUnpacker(labels.Lock,unpacker);
};
