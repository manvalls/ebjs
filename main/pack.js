var com = require('./common.js'),
    InternalBuffer = require('./InternalBuffer.js'),
    walk = require('vz.walk'),
    Property = require('vz.property'),
    Su = require('vz.rand').Su,
    
    Buffer = global.Buffer,
    
    internal = Su();

function WriteBuffer(){
  
  this[internal] = {
    bref: new Property(),
    nextBref: 0,
    buffer: new InternalBuffer()
  };
  
}

Object.defineProperties(WriteBuffer.prototype,{
  
  pack: {value: function(){
    
    switch(arguments.length){
      case 1: return walk(pack,[this,arguments[0],null]); // pack(data);
      case 2: return walk(pack,[this,arguments[1],arguments[0]]); // pack(Type,data);
    }
    
  }},
  
  write: {value: function(data){
    return walk(write,[data,this[internal]]);
  }}
  
});

function* write(data,id){
  id.buffer.write(data);
  if(id.target) while(id.buffer.size > 0){
    yield id.target.push(
      yield id.buffer.read(
        Math.min(id.size,id.buffer.size),
        id.type
      )
    );
  }
}

function* pack(buff,data,type){
  var info,proto,id,brl;
  
  if(type){
    info = com.info.get(type);
    yield walk(info.packer,[buff,data]);
    return;
  }
  
  info = com.info.get(data);
  
  if(info && info.constant){
    yield walk(pack,[buff,info.constant,Number]);
    return;
  }
  
  id = buff[internal];
  
  brl = id.bref.get(data);
  if(brl){
    yield walk(pack,[buff,0,Number]);
    yield walk(pack,[buff,brl,Number]);
    return;
  }
  
  id.bref.set(data,id.nextBref++);
  type = data.constructor;
  
  while(!((info = com.info.get(type)) && info.label)){
    proto = Object.getPrototypeOf(type.prototype);
    if(!proto) throw new TypeError('Unsupported type "' + data.constructor.name + '"');
    type = proto.constructor;
  }
  
  yield walk(pack,[buff,info.label,Number]);
  yield walk(info.packer,[buff,data]);
}

function* packExport(data,type,target,chunkSize){
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
  
}

module.exports = function(data,type,target,chunkSize){
  return walk(packExport,[data,type,target,chunkSize]);
};

