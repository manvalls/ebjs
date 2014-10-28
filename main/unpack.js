var com = require('./common.js'),
    InternalBuffer = require('./InternalBuffer.js'),
    Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    
    internal = Su(),
    
    Buffer = global.Buffer,
    Blob = global.Blob;

function ReadBuffer(target){
  
  this[internal] = {
    buffer: new InternalBuffer(),
    brefs: [],
    pushBr: false,
    target: target
  };
  
}

Object.defineProperties(ReadBuffer.prototype,{
  
  unpack: {value: function(){
    return walk(unpack,[this,arguments[0],this[internal]]);
  }},
  
  read: {value: function(size,type){
    if(Buffer) type = type || Buffer;
    else type = type || Uint8Array;
    
    return walk(read,[size,type,this[internal]]);
  }},
  
  start: {value: function(data){
    var id = this[internal];
    
    if(!id.pushBr) return data;
    id.brefs.push(data);
    id.pushBr = false;
    
    return data;
  }}
  
});

function* unpack(buff,type,id){
  var label,
      info,
      i,
      data;
  
  if(!type){
    if(id.pushBr) throw new Error('To use chained generic unpack calls you must call ReadBuffer.start first');
    
    label = yield walk(unpack,[buff,Number,id]);
    if(label === 0){
      i = yield walk(unpack,[buff,Number,id]);
      return id.brefs[i];
    }
    
    info = com.labels[label];
    if(info.constant === label) return info.data;
    
    id.pushBr = true;
    type = info.data;
  }
  
  info = info || com.info.get(type);
  
  data = yield walk(info.unpacker,[buff]);
  
  if(id.pushBr){
    id.brefs.push(data);
    id.pushBr = false;
  }
  
  return data;
}

function* read(size,type,id){
  if(id.target) while(size > id.buffer.size) id.buffer.write(yield id.target.shift());
  return yield id.buffer.read(size,type);
}

module.exports = function(data){
  var buff,
      id;
  
  if(data.isYarr){
    buff = new ReadBuffer(data);
    return buff.unpack();
  }
  
  buff = new ReadBuffer(),
  id = buff[internal];
  id.buffer.write(data);
  return buff.unpack();
};

