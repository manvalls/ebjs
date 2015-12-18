var Connection = require('../../connection.js'),
    label = require('../../label.js'),
    labels = require('../labels.js'),

    RESOLVE = 0,
    REJECT = 1;

Object.defineProperty(Promise.prototype,label,{
  value: labels.Promise,
  writable: true,
  configurable: true
});

function* packer(buffer,data){
  var conn = new Connection();

  conn.open();
  yield buffer.pack(conn.end,labels.Connection);

  try{
    data.then(function(value){
      conn.send([RESOLVE,value]);
      conn.detach();
    },function(error){
      conn.send([REJECT,error]);
      conn.detach();
    });
  }catch(e){
    conn.send([REJECT,e]);
    conn.detach();
  }
  
}

function* unpacker(buffer,ref){
  var conn = yield buffer.unpack(labels.Connection);

  return new Promise(function(resolve,reject){
    conn.open();
    conn.on('message',onMessage,resolve,reject);
  });
}

function onMessage(msg,d,resolve,reject){
  if(!(msg instanceof Array)) return;

  switch(msg[0]){

    case RESOLVE:
      resolve(msg[1]);
      d.detach();
      this.detach();
      break;

    case REJECT:
      reject(msg[1]);
      d.detach();
      this.detach();
      break;

  }

}

module.exports = function(ebjs){
  ebjs.setPacker(labels.Promise,packer);
  ebjs.setUnpacker(labels.Promise,unpacker);
};
