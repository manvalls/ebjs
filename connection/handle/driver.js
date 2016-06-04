var walk = require('y-walk'),
    walker = Symbol(),
    interval = Symbol(),
    unpacker = Symbol(),
    connection = Symbol(),
    maxBytes = Symbol(),
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(driver,c,packer,up,mb,cs){
  driver[connection] = c;
  driver[unpacker] = up;
  driver[maxBytes] = mb;

  packer.sync(sync);
  up.sync(sync).listen(detachIfNot,[c]);

  driver.on('open',handleState);
  driver.on('error',handleState);
  driver.on('close',handleState);
  driver.on('message',handleData);

  driver[walker] = walk(handlePacker,[packer,driver,cs]);
  driver[walker].pause();

  c.once('detached',removeListeners,driver);
  handleState.call(driver);
};

// Handlers

function handleState(){

  switch(this.readyState){

    case 1:
      this[walker].resume();
      this[interval] = setInterval(ping,25e3,this);
      break;

    case 3:
      this[connection].detach();
      break;

  }

}

function handleData(event){
  var data = event.data;

  if(typeof data == 'string') data = new Uint8Array(data.split('').map(getCode));
  this[unpacker].write(data);

  if(this[maxBytes] && this[unpacker].bytesSinceFlushed > this[maxBytes]) this[connection].detach();
}

function removeListeners(ev,d,driver){
  driver.removeListener('open',handleState);
  driver.removeListener('error',handleState);
  driver.removeListener('close',handleState);
  driver.removeListener('message',handleData);
  clearInterval(driver[interval]);
  driver[walker].pause();
  driver.close();
}

function* handlePacker(packer,driver,chunkSize){
  var buffer;

  while(true){
    buffer = yield packer.read(chunkSize,Buffer);
    if(!driver.binary(buffer)) driver.text(buffer.toString('binary'));
  }

}

function ping(driver){
  driver.ping();
}

// Utils

function detachIfNot(conn){
  if(!this.value) conn.detach();
}

function getCode(char){
  return char.charCodeAt(0);
}
