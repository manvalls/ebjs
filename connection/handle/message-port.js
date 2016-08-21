var walk = require('y-walk'),
    DATA = 0,
    DETACH = 1,
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(port,c,packer,unpacker,maxBytes,cs){
  var walker,pin,pout;

  if(port.constructor == Object) ({in: pin, out: pout} = port);
  else pin = pout = port;

  packer.sync(sync);
  unpacker.sync(sync).listen(detachIfNot,[c]);

  function onMessage(e){

    if(!(e.data instanceof Array)) return;
    if(e.source && e.source != pout) return;

    switch(e.data[0]){

      case DATA:
        if(!(e.data[1] instanceof ArrayBuffer)) return;
        unpacker.write(new Uint8Array(e.data[1]));
        if(maxBytes && unpacker.bytesSinceFlushed > maxBytes) c.detach();
        break;

      case DETACH:
        c.detach();
        break;

    }

  }

  walker = walk(handlePacker,[packer,pout,cs]);
  pin.addEventListener('message',onMessage,false);
  if(typeof pin.start == 'function') pin.start();
  c.once('detached',onceDetached,pin,pout,walker,onMessage);
};

function onceDetached(e,d,pin,pout,walker,onMessage){
  walker.pause();
  pin.removeEventListener('message',onMessage,false);
  if(pout.postMessage.length == 2) pout.postMessage([DETACH],'*');
  else pout.postMessage([DETACH]);
}

function* handlePacker(packer,port,chunkSize){
  var buffer;

  while(true){
    buffer = yield packer.read(chunkSize,Uint8Array);
    if(port.postMessage.length == 2) port.postMessage([DATA,buffer.buffer],'*',[buffer.buffer]);
    else port.postMessage([DATA,buffer.buffer]/*,[buffer.buffer]*/);
  }

}

function detachIfNot(conn){
  if(!this.value) conn.detach();
}
