
module.exports = function(ch,connection,unpacker,maxBytes){

  function handleData(event){
    var data = event.data;

    if(typeof data == 'string') data = new Uint8Array(data.split('').map(getCode));
    else data = new Uint8Array(data);

    unpacker.write(data);
    if(maxBytes && unpacker.bytesSinceFlushed > maxBytes) connection.detach();
  }

  ch.binaryType = 'arraybuffer';
  ch.addEventListener('message',handleData,false);

  connection.once('detached',removeListeners,handleData,ch);
};

// Handlers

function* removeListeners(ev,d,handleData,ch){
  ch.removeEventListener('message',handleData,false);
}

// Utils

function getCode(char){
  return char.charCodeAt(0);
}
