var walk = require('y-walk'),
    unpacker = Symbol(),
    connection = Symbol(),
    maxBytes = Symbol(),
    DATA = 0,
    DETACH = 1,
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(port,c,packer,up,mb,cs){
  var walker;

  packer.sync(sync);
  up.sync(sync).listen(detachIfNot,[c]);

  port[unpacker] = up;
  port[connection] = c;
  port[maxBytes] = mb;
  walker = walk(handlePacker,[packer,port,cs]);

  port.addEventListener('message',onMessage,false);
  if(typeof port.start == 'function') port.start();
  c.once('detached',onceDetached,port,walker);
};

function onMessage(e){

  if(!(e.data instanceof Array)) return;

  switch(e.data[0]){

    case DATA:
      if(!(e.data[1] instanceof ArrayBuffer)) return;
      this[unpacker].write(new Uint8Array(e.data[1]));
      if(this[maxBytes] && this[unpacker].bytesSinceFlushed > this[maxBytes]) this[connection].detach();
      break;

    case DETACH:
      this[connection].detach();
      break;

  }

}

function onceDetached(e,d,port,walker){
  walker.pause();
  port.removeEventListener('message',onMessage,false);
  port.postMessage([DETACH]);
}

function* handlePacker(packer,port,chunkSize){
  var buffer;

  while(true){
    buffer = yield packer.read(chunkSize,Uint8Array);
    port.postMessage([DATA,buffer.buffer]/*,[buffer.buffer]*/);
  }

}

function detachIfNot(conn){
  if(!this.value) conn.detach();
}
