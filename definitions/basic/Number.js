var util = require('./Number/util.js');

function* packer(buffer,data){

  if(util.isUi32(data)){

    if(data < 248){
      yield buffer.write([data]);
      return;
    }

    if(data < 256){
      yield buffer.write([255]);
      yield buffer.write([data]);
      return;
    }

    if(data < 65536){
      yield buffer.write([254]);
      yield buffer.write(util.packUi16(data));
      return;
    }

    yield buffer.write([253]);
    yield buffer.write(util.packUi32(data));
    return;
  }

  if(util.isI32(data)){

    if(util.isI8(data)){
      yield buffer.write([252]);
      yield buffer.write(util.packI8(data));
      return;
    }

    if(util.isI16(data)){
      yield buffer.write([251]);
      yield buffer.write(util.packI16(data));
      return;
    }

    yield buffer.write([250]);
    yield buffer.write(util.packI32(data));
    return;
  }

  if(util.isF32(data)){
    yield buffer.write([249]);
    yield buffer.write(util.packF32(data));
    return;
  }

  yield buffer.write([248]);
  yield buffer.write(util.packF64(data));
}

function* unpacker(buffer,ref){
  var n;

  switch( n = (yield buffer.read(1))[0] ){

    case 255: return (yield buffer.read(1))[0];
    case 254: return util.unpackUi16(yield buffer.read(2));
    case 253: return util.unpackUi32(yield buffer.read(4));

    case 252: return util.unpackI8(yield buffer.read(1));
    case 251: return util.unpackI16(yield buffer.read(2));
    case 250: return util.unpackI32(yield buffer.read(4));

    case 249: return util.unpackF32(yield buffer.read(4));
    case 248: return util.unpackF64(yield buffer.read(8));

    default: return n;
  }

}

module.exports = function(ebjs){
  ebjs.setPacker(Number,packer);
  ebjs.setUnpacker(Number,unpacker);
};
