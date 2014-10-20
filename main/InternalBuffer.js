var InternalBuffer,
    Blob = global.Blob,
    Buffer = global.Buffer,
    File = global.File,
    
    walk = require('vz.walk'),
    Yielded = require('vz.yielded');

// Parts

function Part(data){
  
  switch(data.constructor){
    case Buffer: return new BufferPart(data);
    case File:
    case Blob: return new BlobPart(data);
    case ArrayBuffer: return new ArrayBufferPart(data);
    case Uint8ClampedArray:
    case Uint8Array: return new ArrayPart(data);
    case Uint16Array:
    case Uint32Array:
    case Int8Array:
    case Int16Array:
    case Int32Array:
    case Float32Array:
    case Float64Array:
    case DataView:
      return new ArrayBufferPart(data.buffer.slice(data.byteOffset,data.byteOffset + data.byteLength));
    
    default: throw new TypeError('Unsupported part type');
  }
  
}

  // Buffer

{
  
  function BufferPart(data){
    this.data = data;
  }
  
  Object.defineProperty(BufferPart.prototype,'size',{ get: function(){
    return this.data.length;
  }});
  
  BufferPart.prototype.slice = function(start,end){
    return new BufferPart(this.data.slice(start,end));
  };
  
  BufferPart.prototype.getBuffer = function(){
    return new Yielded(this.data);
  };
  
  BufferPart.prototype.getArray = function(){
    return new Yielded(new Uint8Array(this.data));
  };
  
}

  // Uint8Array
  // Uint8ClampedArray

{
  
  function ArrayPart(data){
    this.data = data;
  }
  
  Object.defineProperty(ArrayPart.prototype,'size',{ get: function(){
    return this.data.byteLength;
  }});
  
  ArrayPart.prototype.slice = function(start,end){
    return new ArrayPart(this.data.subarray(start,end));
  };
  
  ArrayPart.prototype.getBuffer = function(){
    return new Yielded(new Buffer(this.data));
  };
  
  ArrayPart.prototype.getArray = function(){
    return new Yielded(this.data);
  };
  
}

  // ArrayBuffer

{
  
  function ArrayBufferPart(data){
    this.data = data;
  }
  
  Object.defineProperty(ArrayBufferPart.prototype,'size',{ get: function(){
    return this.data.byteLength;
  }});
  
  ArrayBufferPart.prototype.slice = function(start,end){
    return new ArrayBufferPart(this.data.slice(start,end));
  };
  
  ArrayBufferPart.prototype.getBuffer = function(){
    return new Yielded(new Buffer(new Uint8Array(this.data)));
  };
  
  ArrayBufferPart.prototype.getArray = function(){
    return new Yielded(new Uint8Array(this.data));
  };
  
}

  // Blob

{
  
  function BlobPart(data){
    this.data = data;
  }
  
  Object.defineProperty(BlobPart.prototype,'size',{ get: function(){
    return this.data.size;
  }});
  
  BlobPart.prototype.slice = function(start,end){
    return new BlobPart(this.data.slice(start,end));
  };
  
  function onLoadBuffer(){
    this.yd.value = new Buffer(new Uint8Array(this.result));
  }
  
  BlobPart.prototype.getBuffer = function(){
    var yd = new Yielded(),
        fr = new FileReader();
    
    fr.yd = yd;
    fr.onloadend = onLoadBuffer;
    fr.readAsArrayBuffer(this.data);
    
    return yd;
  };
  
  function onLoadArray(){
    this.yd.value = new Uint8Array(this.result);
  }
  
  BlobPart.prototype.getArray = function(){
    var yd = new Yielded(),
        fr = new FileReader();
    
    fr.yd = yd;
    fr.onloadend = onLoadArray;
    fr.readAsArrayBuffer(this.data);
    
    return yd;
  };
  
}

// Read

function getParts(buff,size){
  var ret = [],
      part,
      sz;
  
  buff.size -= size;
  
  while(size > 0 && (part = buff.parts.shift())){
    
    if((sz = part.size) <= size){
      size -= sz;
      ret.push(part);
    }else{
      ret.push(part.slice(0,size));
      buff.parts.unshift(part.slice(size,part.size));
      size = 0;
    }
    
  }
  
  return ret;
}

function* prepare(buff,size,type){
  var i = 0,sz = 0,
      part,
      blobPart,
      typePart,
      to;
  
  while(size > 0){
    if(buff.parts[i].constructor == BlobPart && buff.parts[i].size > size){
      part = buff.parts.splice(i,1)[0];
      to = Math.min(Math.max(size,10e3),part.size);
      
      typePart = part.slice(0,to);
      blobPart = part.slice(to,part.size);
      
      if(type == Buffer) typePart = yield typePart.getBuffer();
      else typePart = yield typePart.getArray();
      
      typePart = new Part(typePart);
      
      buff.parts.splice(i,0,typePart,blobPart);
    }
    
    size -= buff.parts[i].size;
    i++;
  }
}

function ready(buff,size){
  if(size <= buff.size) return new Yielded(true);
  
  buff.readySize = size;
  return buff.readyYd = new Yielded();
}

function* read(buff,type,size){
  var ret,
      parts,
      part,
      offset,
      i;
  
  this.locked = true;
  
  yield ready(buff,size);
  if(Blob && type != Blob) yield walk(prepare,[buff,size,type]);
  parts = getParts(buff,size);
  
  switch(type){
    case Buffer:
      for(i = 0;i < parts.length;i++) parts[i] = yield parts[i].getBuffer();
      ret = Buffer.concat(parts);
      break;
    
    case Uint8Array:
      ret = new Uint8Array(size);
      offset = 0;
      
      for(i = 0;i < parts.length;i++){
        part = yield parts[i].getArray();
        ret.set(part,offset);
        offset += part.length;
      }
      
      break;
    
    case Blob:
      for(i = 0;i < parts.length;i++) parts[i] = parts[i].data;
      ret = new Blob(parts);
      break;
  }
  
  this.locked = false;
  
  return ret;
}

// Object

InternalBuffer = module.exports = function(){
  this.readyYd = null;
  this.readySize = 0;
  
  this.locked = false;
  this.size = 0;
  this.parts = [];
};

InternalBuffer.prototype.write = function(data){
  var part = new Part(data),
      yd,size;
  
  this.size += part.size;
  this.parts.push(part);
  
  if(this.readyYd && this.readySize <= this.size){
    yd = this.readyYd;
    size = this.readySize;
    this.readyYd = null;
    this.readySize = 0;
    
    yd.value = null;
  }
};

InternalBuffer.prototype.read = function(){
  var size,type;
  
  if(this.locked) throw new Error('Only one read operation at a time');
  
  if(arguments.length == 1){ // read(type);
    size = this.size;
    type = arguments[0];
  }else{ // read(size,type);
    size = arguments[0];
    type = arguments[1];
  }
  
  return walk(read,[this,type,size]);
};

