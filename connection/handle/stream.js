var walk = require('y-walk'),
    Cb = require('y-callback'),
    unpacker = Symbol(),
    connection = Symbol(),
    maxBytes = Symbol(),
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(stream,c,packer,up,mb){
  var readable,writable,walker;

  packer.sync(sync);
  up.sync(sync).listen(detachIfNot,[c]);

  if(stream.constructor == Object){
    writable = stream.write;
    readable = stream.read;
  }else{
    readable = stream;
    writable = stream;
  }

  readable[unpacker] = up;
  writable[connection] = c;
  readable[connection] = c;
  readable[maxBytes] = mb;
  walker = walk(handlePacker,[packer,writable]);

  readable.on('data',onData);
  readable.once('error',onceClosed);
  readable.once('end',onceClosed);
  writable.once('error',onceClosed);
  c.once('detached',onceDetached,readable,writable,walker);
};

function onData(buffer){
  this[unpacker].write(buffer);
  if(this[maxBytes] && this[unpacker].bytesSinceFlushed > this[maxBytes]) this[connection].detach();
}

function onceClosed(){
  this[connection].detach();
}

function onceDetached(e,d,readable,writable,walker){
  readable.removeListener('data',onData);
  readable.removeListener('error',onceClosed);
  readable.removeListener('end',onceClosed);
  writable.removeListener('error',onceClosed);
  writable.end();
  walker.pause();
}

function* handlePacker(packer,writable){
  var buffer,cb;

  while(true){
    buffer = yield packer.read(new Buffer(1e3));
    writable.write(buffer,cb = Cb());
    yield cb;
  }

}

function detachIfNot(conn){
  if(!this.value) conn.detach();
}
