var walk = require('y-walk'),
    walker = Symbol(),
    unpacker = Symbol(),
    connection = Symbol(),
    maxBytes = Symbol();

module.exports = function(driver,c,packer,up,mb){
  driver[connection] = c;
  driver[unpacker] = up;
  driver[maxBytes] = mb;

  driver.on('open',handleState);
  driver.on('error',handleState);
  driver.on('close',handleState);
  driver.on('message',handleData);

  driver[walker] = walk(handlePacker,[packer,driver]);
  driver[walker].pause();

  c.once('detached',removeListeners,driver);
  handleState.call(driver);
};

// Handlers

function handleState(){

  switch(this.readyState){

    case 1:
      this[walker].resume();
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
  driver[walker].pause();
  driver.close();
}

function* handlePacker(packer,driver){
  var buffer;

  while(true){
    buffer = yield packer.read(new Buffer(1e3));
    if(!driver.binary(buffer)) driver.text(buffer.toString('binary'));
  }

}

// Utils

function getCode(char){
  return char.charCodeAt(0);
}
