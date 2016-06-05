var handlePacker = require('./browser-like/packer'),
    handleUnpacker = require('./browser-like/unpacker'),
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ];

module.exports = function(ch,connection,packer,unpacker,maxBytes,chunkSize){

  packer.sync(sync);
  unpacker.sync(sync).listen(detachIfNot,[connection]);

  handlePacker(ch,connection,packer,chunkSize);
  handleUnpacker(ch,connection,unpacker,maxBytes);

};

// Utils

function detachIfNot(conn){
  if(!this.value) conn.detach();
}
