var labels = require('../labels.js'),
    Connection = require('../../connection.js'),
    Emitter = require('y-emitter'),
    Collection = require('detacher/collection'),

    LISTEN = 0,
    IGNORE = 1,
    EVENT = 0,
    STATE = 1;

function* packer(buffer,data){
  var conn = new Connection(),
      detachers = new Map(),
      d;

  conn.open();
  d = conn.on('message',onPackerMsg,data,conn,detachers);
  conn.once('detached',oncePackerDetached,d,detachers);
  yield buffer.pack(conn.end,labels.Connection);
}

function onPackerMsg(msg,d,target,conn,detachers){

  if(msg instanceof Array) switch(msg[0]){

    case LISTEN:

      if(detachers.has(msg[1])) return;
      detachers.set(msg[1],
        target.on(msg[1],listener,msg[1],conn)
      );

      break;

    case IGNORE:

      if(detachers.has(msg[1])){
        detachers.get(msg[1]).detach();
        detachers.delete(msg[1]);
      }

      break;

  }

}

function listener(ev,d,en,conn){
  if(this.is(en)) conn.send([STATE,en,ev]);
  else conn.send([EVENT,en,ev]);
}

function oncePackerDetached(e,dt,d,detachers){
  d.detach();
  for(d of detachers.values()) d.detach();
  detachers.clear();
}

function* unpacker(buffer,ref){
  var conn = yield buffer.unpack(labels.Connection),
      em = new Emitter(),
      col = new Collection();

  col.add(
    em.target.on(em.target.eventListened,sendEL,conn),
    em.target.on(em.target.eventIgnored,sendEI,conn)
  );

  conn.once('detached',onceUnpackerDetached,col);

  try{

    conn.open();
    col.add(
      conn.on('message',onUnpackerMsg,em)
    );

  }catch(e){ }

  return em.target;
}

function onceUnpackerDetached(e,d,col){
  col.detach();
}

function sendEL(event,d,conn){
  try{ conn.send([LISTEN,event]); }
  catch(e){ }
}

function sendEI(event,d,conn){
  try{ conn.send([IGNORE,event]); }
  catch(e){ }
}

function onUnpackerMsg(msg,d,em){

  if(msg instanceof Array) switch(msg[0]){

    case EVENT:
      em.give(msg[1],msg[2]);
      break;

    case STATE:
      em.set(msg[1],msg[2]);
      break;

  }

}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Target,packer);
  ebjs.setUnpacker(labels.Target,unpacker);
};