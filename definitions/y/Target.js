var labels = require('../labels.js'),
    Connection = require('../../connection.js'),
    Emitter = require('y-emitter'),
    Detacher = require('detacher'),
    emitter = '2JqDV4FmMF6yV2V',

    LISTEN = 0,
    IGNORE = 1,
    EVENT = 0,
    STATE = 1,
    UNSET = 2;

function* packer(buffer,data){
  var conn = new Connection(),
      detachers = new Map(),
      d,d2;

  conn.open();
  d = conn.on('message',onPackerMsg,data,conn,detachers,this.events,this.eventLength);
  try{ d2 = data.on(data.stateUnset,onSU,conn); }
  catch(e){ }

  conn.once('detached',oncePackerDetached,d,d2,detachers);
  yield buffer.pack(conn.end,labels.Connection);
}

function onPackerMsg(msg,d,target,conn,detachers,events,eventLength){

  if(msg instanceof Array) switch(msg[0]){

    case LISTEN:

      if(detachers.has(msg[1]) || detachers.size >= events || msg[1].length > eventLength) return;
      detachers.set(msg[1],
        target.on(msg[1],listener,msg[1],conn,detachers,events)
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

function onSU(state,d,conn){
  try{ conn.send([UNSET,state]); }
  catch(e){ }
}

function* listener(ev,d,en,conn,detachers,events){
  if(this.is(en)){
    conn.send([STATE,en,ev]);
    if(this[emitter]) this[emitter].unset(en,true);
  }else conn.send([EVENT,en,ev]);
}

function oncePackerDetached(e,dt,d,d2,detachers){
  d.detach();
  try{ d2.detach(); }
  catch(e){ }

  for(d of detachers.values()) d.detach();
  detachers.clear();
}

function* unpacker(buffer,ref){
  var conn = yield buffer.unpack(labels.Connection),
      em = new Emitter(),
      col = new Detacher();

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
      if(!em.target.listened(msg[1])) return;
      em.give(msg[1],msg[2]);
      break;

    case STATE:
      if(!em.target.listened(msg[1])) return;
      em.set(msg[1],msg[2]);
      break;

    case UNSET:
      em.unset(msg[1]);
      break;

  }

}

module.exports = function(ebjs,constraints){
  constraints = constraints || {events: 500, eventLength: 500};
  ebjs.setPacker(labels.Target,packer,constraints);
  ebjs.setUnpacker(labels.Target,unpacker,constraints);
};

module.exports.emitter = emitter;
