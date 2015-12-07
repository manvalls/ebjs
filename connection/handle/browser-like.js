var tick = require('y-timers/tick'),
    walk = require('y-walk');

module.exports = function(ch,connection,packer,unpacker,maxBytes){
  var walker;

  function handleState(){

    switch(ch.readyState){

      case 3:
      case 'closed':
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

  walker = walk(handlePacker,[packer,ch]);
  walker.pause();

  connection.once('detached',removeListeners,handleState,handleData,walker,ch);
  handleState();
};

// Handlers

function removeListeners(ev,d,handleState,handleData,walker,ch){
  ch.removeEventListener('open',handleState,false);
  ch.removeEventListener('close',handleState,false);
  ch.removeEventListener('error',handleState,false);
  ch.removeEventListener('message',handleData,false);
  walker.pause();
  ch.close();
}

function* handlePacker(packer,ch){
  var buffer,ab;

  while(true){
    buffer = new Uint8Array(1e3);
    ab = getAB(yield packer.read(buffer));

    while(ch.bufferedAmount){
      if(ch.readyState == 3 || ch.readyState == 'closed') return;
      yield tick();
    }

    ch.send(ab);
  }

}

// Utils

function getCode(char){
  return char.charCodeAt(0);
}

function getAB(ui8a){
  return ui8a.buffer.slice(ui8a.byteOffset,ui8a.byteLength);
}