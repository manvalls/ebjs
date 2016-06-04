var tick = require('y-timers/tick'),
    walk = require('y-walk'),
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(ch,connection,packer,unpacker,maxBytes,chunkSize){
  var walker;

  packer.sync(sync);
  unpacker.sync(sync).listen(detachIfNot,[connection]);

  function handleState(){

    switch(ch.readyState){

      case 3:
      case 'closed':
      case 2:
      case 'closing':
        connection.detach();
        break;

      case 1:
      case 'open':
        walker.resume();
        break;

    }

  }

  function handleData(event){
    var data = event.data;

    if(typeof data == 'string') data = new Uint8Array(data.split('').map(getCode));
    else data = new Uint8Array(data);

    unpacker.write(data);
    if(maxBytes && unpacker.bytesSinceFlushed > maxBytes) connection.detach();
  }

  ch.binaryType = 'arraybuffer';
  ch.addEventListener('open',handleState,false);
  ch.addEventListener('close',handleState,false);
  ch.addEventListener('error',handleState,false);
  ch.addEventListener('message',handleData,false);

  walker = walk(handlePacker,[packer,ch,chunkSize]);
  walker.pause();

  connection.once('detached',removeListeners,handleState,handleData,walker,ch);
  handleState();
};

// Handlers

function* removeListeners(ev,d,handleState,handleData,walker,ch){
  ch.removeEventListener('open',handleState,false);
  ch.removeEventListener('close',handleState,false);
  ch.removeEventListener('error',handleState,false);
  ch.removeEventListener('message',handleData,false);

  while(ch.bufferedAmount){
    yield tick();
    yield tick();
    if(
      ch.readyState == 3 ||
      ch.readyState == 'closed' ||
      ch.readyState == 2 ||
      ch.readyState == 'closing'
    ) break;
  }

  walker.pause();
  ch.close();
}

function* handlePacker(packer,ch,chunkSize){
  var buffer,ab;

  while(true){
    ab = getAB(yield packer.read(chunkSize,Uint8Array));

    while(ch.bufferedAmount){
      yield tick();
      if(
        ch.readyState == 3 ||
        ch.readyState == 'closed' ||
        ch.readyState == 2 ||
        ch.readyState == 'closing'
      ) return;
    }

    if(
      ch.readyState == 3 ||
      ch.readyState == 'closed' ||
      ch.readyState == 2 ||
      ch.readyState == 'closing'
    ) return;

    ch.send(ab);
  }

}

// Utils

function detachIfNot(conn){
  if(!this.value) conn.detach();
}

function getCode(char){
  return char.charCodeAt(0);
}

function getAB(ui8a){
  return ui8a.buffer.slice(ui8a.byteOffset,ui8a.byteLength);
}
