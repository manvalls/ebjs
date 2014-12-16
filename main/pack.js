var com = require('./common.js'),
    BinaryBuffer = require('binary-buffer'),
    walk = require('vz.walk'),
    Property = require('vz.property'),
    Su = require('vz.rand').Su,
    
    Buffer = global.Buffer,
    
    internal = Su();

function WriteBuffer(){
  
  this[internal] = {
    bref: new Property(),
    nextBref: 0,
    buffer: new BinaryBuffer()
  };
  
}

Object.defineProperties(WriteBuffer.prototype,{
  
  pack: {value: walk.wrap(function*(type,data){
    var info,proto,id,brl;
    
    if(arguments.length > 1){
      info = com.info.get(type);
      yield walk(info.packer,[data,type],this);
      return;
    }
    
    data = type;
    info = com.info.get(data);
    
    if(info && info.constant){
      yield this.pack(Number,info.constant);
      return;
    }
    
    id = this[internal];
    
    brl = id.bref.get(data);
    if(brl){
      yield this.pack(Number,0);
      yield this.pack(Number,brl);
      return;
    }
    
    id.bref.set(data,id.nextBref++);
    type = data.constructor;
    
    while(!((info = com.info.get(type)) && info.label)){
      proto = Object.getPrototypeOf(type.prototype);
      if(!proto) throw new TypeError('Unsupported type "' + data.constructor.name + '"');
      type = proto.constructor;
    }
    
    yield this.pack(Number,info.label);
    yield walk(info.packer,[data,type],this);
    
  })},
  
  write: {value: walk.wrap(function*(data){
    var id = this[internal];
    
    id.buffer.write(data);
    if(id.target) while(id.buffer.size > 0){
      yield id.target.push(
        yield id.buffer.read(
          id.type,
          Math.min(id.size,id.buffer.size)
        )
      );
    }
    
  })}
  
});

module.exports = walk.wrap(function*(data,type,target,chunkSize){
  var buff = new WriteBuffer(),
      id = buff[internal];
  
  if(Buffer) type = type || Buffer;
  else type = type || Uint8Array;
  
  if(target){
    id.target = target;
    id.type = type;
    id.size = chunkSize || 10e3;
    yield buff.pack(data);
  }else{
    yield buff.pack(data);
    return yield id.buffer.read(type);
  }
  
});
