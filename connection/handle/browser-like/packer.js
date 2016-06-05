var tick = require('y-timers/tick'),
    walk = require('y-walk');

module.exports = function(ch,connection,packer,chunkSize){
  var walker;

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

  ch.addEventListener('open',handleState,false);
  ch.addEventListener('close',handleState,false);
  ch.addEventListener('error',handleState,false);

  walker = walk(handlePacker,[packer,ch,chunkSize]);
  walker.pause();

  handleState();
  connection.once('detached',removeListeners,handleState,walker,ch);
};

// Handlers

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

function* removeListeners(ev,d,handleState,walker,ch){

  ch.removeEventListener('open',handleState,false);
  ch.removeEventListener('close',handleState,false);
  ch.removeEventListener('error',handleState,false);

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

// Utils

function getAB(ui8a){
  return ui8a.buffer.slice(ui8a.byteOffset,ui8a.byteLength);
}
