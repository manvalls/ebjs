var com = require('./main/common.js'),
    BinaryBuffer = require('binary-buffer'),
    Su = require('vz.rand').Su,
    walk = require('vz.walk'),
    
    internal = Su(),
    
    Buffer = global.Buffer,
    Blob = global.Blob;

function ReadBuffer(target){
  
  this[internal] = {
    buffer: new BinaryBuffer(),
    brefs: [],
    pushBr: false,
    target: target
  };
  
}

Object.defineProperties(ReadBuffer.prototype,{
  
  unpack: {value: walk.wrap(function*(type){
    var label,
        id = this[internal],
        skip = false,
        info,
        i,
        data;
    
    if(!type){
      if(id.pushBr) throw new Error('To use chained generic unpack calls you must call ReadBuffer.start first');
      
      label = yield this.unpack(Number);
      if(label === 0){
        i = yield this.unpack(Number);
        return id.brefs[i];
      }
      
      info = com.labels[label];
      if(info.constant === label) return info.data;
      
      id.pushBr = true;
      type = info.data;
    }else skip = true;
    
    info = info || com.info.get(type);
    
    data = yield walk(info.unpacker,[type],this);
    
    if(!skip && id.pushBr){
      id.brefs.push(data);
      id.pushBr = false;
    }
    
    return data;
  })},
  
  read: {value: walk.wrap(function*(size,type){
    var id = this[internal];
    
    if(Buffer) type = type || Buffer;
    else type = type || Uint8Array;
    
    if(id.target) while(size > id.buffer.size) id.buffer.write(yield id.target.shift());
    return yield id.buffer.read(type,size);
  })},
  
  start: {value: function(data){
    var id = this[internal];
    
    if(!id.pushBr) return data;
    id.brefs.push(data);
    id.pushBr = false;
    
    return data;
  }}
  
});

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

