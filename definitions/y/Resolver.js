var Connection = require('../../connection.js'),
    children = require('../../connection/utils/children.js'),
    Resolver = require('y-resolver'),
    label = require('../../label.js'),
    labels = require('../labels.js'),
    ydPacker = require('./Yielded.js').packer,
    ydUnpacker = require('./Yielded.js').unpacker,
    walk = require('y-walk'),

    ACCEPT = 0,
    REJECT = 1;

function* packer(buffer,data){
  var conn = new Connection(),
      ack = new Resolver();

  data = data || {};
  yield walk(ydPacker,[buffer,data.yielded,ack.yielded]);

  conn.open();
  conn.once('message',onceMessage,data,ack);
  yield buffer.pack(conn.end,labels.Connection);

}

function* unpacker(buffer,ref){
  var ack = new Resolver(),
      yd = yield walk(ydUnpacker,[buffer,null,ack.yielded]),
      conn = yield buffer.unpack(labels.Connection);

  try{ conn.open(); }
  catch(e){ conn.detach(); }

  ack.yielded.listen(listener,[conn,yd]);
  return new Resolver(ack,yd);
}

function* onceMessage(msg,d,res,ack){

  if(msg instanceof Array) switch(msg[0]){

    case ACCEPT:
      ack.accept(msg[1]);
      res.accept(msg[1]);
      break;

    case REJECT:
      ack.reject(msg[1],true);
      res.reject(msg[1],true);
      break;

  }

  if(this[children]) yield this[children].is(0);
  this.detach();

}

function listener(conn,yd){
  if(yd.done) return;
  if(this.accepted) conn.send([ACCEPT,this.value]);
  else conn.send([REJECT,this.error]);
}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Resolver,packer);
  ebjs.setUnpacker(labels.Resolver,unpacker);
};
