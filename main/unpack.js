var nextTick = require('vz.next-tick'),
    Property = require('vz.property'),
    resolve = require('vz.resolve'),
    Stepper = require('vz.stepper'),
    
		com = require('./common.js'),
    
    currentReadOp = new Property(),
    currentBytes = new Property(),
    
    pool = new Property(),
    blobPool = new Property(), // browser line
    bpToPool, // browser line
    onFRLoad, // browser line
    
    thisArg = new Property(),
    
    finalCb = new Property(),
    finalCbThis = new Property(),
    
    readBytes,
    onData,
    onEnd,
    unpack,
    toArray, // browser line
    
    Buffer = global.Buffer, // nodejs line
    Blob = global.Blob, // browser line
    
    ReadBuffer;

if(Buffer){ // nodejs block
  
  ReadBuffer = function(data){
    var buff = com.toBuffer(data,true);
    
    com.resolvers.of(this).set([]);
    
    if(buff) pool.of(this).set(buff);
    else{
      pool.of(this).set(new Buffer(0));
      thisArg.of(data).value = this;
      if(data.read && data.on) data.on('data',onData);
      else data.upTo(Infinity).take(onData);
    }
  };
  
}else{ // browser block
  
  toArray = function(data){
    var view;
    
    switch(data.constructor){
      case String:
        i = data.indexOf('base64,');
        if(i != -1) data = data.substring(i + 7);
        
        data = atob(data);
        view = new Uint8Array(data.length);
        
        for(i = 0;i < data.length;i++){
          view[i] = data.charCodeAt(i);
        }
        
        return view;
      case Uint8Array:
      case Uint8ClampedArray:
        return data;
      case Uint16Array:
      case Uint32Array:
      case Int16Array:
      case Int32Array:
      case Int8Array:
      case Float32Array:
      case Float64Array:
      case DataView:
        data = data.buffer.slice(data.byteOffset,data.length);
      case ArrayBuffer:
        return new Uint8Array(data);
    }
    
  };
  
  ReadBuffer = function(data,allowBlobs){
    var arr = toArray(data);
    
    com.resolvers.of(this).set([]);
    
    if(arr){
      pool.of(this).set(arr);
      return;
    }
    
    pool.of(this).set(new Uint8Array(0));
    
    if(data instanceof Blob){
      blobPool.of(this).set(data);
      return;
    }
    
    if(allowBlobs) blobPool.of(this).set(new Blob());
    data.upTo(Infinity).take(onData,this);
  };
  
}

ReadBuffer.prototype = new Stepper();
ReadBuffer.prototype.constructor = ReadBuffer;

if(Buffer){ // nodejs block
  
  onData = function(data){
    var that = thisArg.of(this).get(),
        p = pool.of(that).get(),
        cro = currentReadOp.of(that).get(),
        n = currentBytes.of(that).get(),
        ret;
    
    data = com.toBuffer(data,true);
    pool.of(that).set(p = Buffer.concat([p,data]));
    
    if(cro && p.length >= n){
      currentReadOp.of(that).set(undefined);
      currentBytes.of(that).set(undefined);
      
      ret = p.slice(0,n);
      pool.of(that).set(p.slice(n));
      cro.resolve(ret);
    }
  };
  
  readBytes = function(that,n){
    var ret,
        p = pool.of(that).get();
    
    if(currentReadOp.of(that).get()) throw 'Only one read operation at a time';
    
    this.blob = false;
    
    if(p.length < n){
      currentBytes.of(that).set(n);
      currentReadOp.of(that).set(this);
      return;
    }
    
    ret = p.slice(0,n);
    pool.of(that).set(p.slice(n));
    this.resolve(ret);
  };
  
}else{ // browser block
  
  onData = function(data){
    var arr = toArray(data),
        bp = blobPool.of(this).get(),
        p = pool.of(this).get(),
        n = currentBytes.of(that).get(),
        op = currentReadOp.of(that).get(),
        size,
        ret,
        newPool;
    
    if(!bp){
      
      newPool = new Uint8Array(p.length + arr.length);
      newPool.set(p);
      newPool.set(arr,p.length);
      
    }else{
      size = bp.size;
      bp = new Blob([bp,arr]);
      
      if(size == p.length){
        newPool = new Uint8Array(p.length + arr.length);
        newPool.set(p);
        newPool.set(arr,p.length);
        
        if(n > size && bp.size >= n){
          ret = newPool.subarray(0,n);
          newPool = newPool.subarray(n);
          bp = bp.slice(n);
        }
        
        pool.of(this).set(newPool);
        blobPool.of(this).set(bp);
        
        if(ret) op.resolve(ret);
      }else{
        blobPool.of(this).set(bp);
        if(n > size && bp.size >= n) bpToPool(this,n);
      }
    }
    
  };
  
  onFRLoad = function(){
    var view = new Uint8Array(this.result),
        that = this.that,
        p = pool.of(that).get(),
        bp = blobPool.of(that).get(),
        n = currentBytes.of(that).get(),
        op = currentReadOp.of(that).get(),
        bytes = new Uint8Array(view.length + p.length);
    
    bytes.set(p);
    bytes.set(view,p.length);
    
    pool.of(that).set(bytes.slice(n));
    blobPool.of(that).set(bp.slice(n));
    
    currentBytes.of(that).set(undefined);
    currentReadOp.of(that).set(undefined);
    
    op.resolve(bytes.slice(0,n));
  };
  
  bpToPool = function(that,n){
    var p = pool.of(that).get(),
        bp = blobPool.of(that).get(),
        fr = new FileReader(),
        blob;
    
    n = Math.min(Math.max(n,module.exports.maxRAM),bp.size - p.length);
    
    blob = bp.slice(p.length,p.length + n);
    
    fr.that = that;
    fr.onload = onFRLoad;
    fr.readAsArrayBuffer(blob);
  };
  
  readBytes = function(that,n){
    var ret,
        p = pool.of(that).get(),
        bp = blobPool.of(that).get();
    
    if(currentReadOp.of(that).get()) throw 'Only one read operation at a time';
    
    this.blob = false;
    
    if(p.length < n){
      if(bp && bp.size >=  n) bpToPool(that,n);
      
      currentBytes.of(that).set(n);
      currentReadOp.of(that).set(this);
      return;
    }
    
    ret = p.subarray(0,n);
    
    pool.of(that).set(p.subarray(n));
    if(bp) blobPool.of(that).set(bp.slice(n));
    
    this.resolve(ret);
  };
  
}

Object.defineProperty(ReadBuffer.prototype,'readBytes',{value: function(n,callback){
  return resolve(readBytes,[this,n],callback,this);
}});


unpack = function(args,v){
  var constructor,type;
  
  switch(this.step){
    
    case 'start':
      
      constructor = args[0];
      
      if(!args.length){
        v.i = this.unpack(Number,this.goTo('unpack',unpack,v));
        if(v.i == resolve.deferred) return;
      }else v.i = com.label.of(constructor).get();
    
    case 'unpack':
      
      if(v.i == resolve.deferred) v.i = args[0];
      
      if(!com.unpackers[v.i]){
        this.end(com.classes[v.i]);
        return;
      }
      
      if(!com.types[v.i]) return this.goTo('start',com.unpackers[v.i])();
      
      v.arr = [];
      v.types = com.types[v.i].splice();
    
    case 'unpack-type':
      
      if(v.elem == resolve.deferred) v.arr.push(args[0]);
      
      while(type = v.types.shift()){
        v.elem = this.unpack(type,this.goTo('unpack-type',unpack,v));
        if(v.elem == resolve.deferred) return;
        v.arr.push(v.elem);
      }
      
      this.end(com.unpackers[v.i].apply(this,v.arr));
  }
  
};


Object.defineProperty(ReadBuffer.prototype,'unpack',{value: function(constructor,callback){
  var args;
  
  if(!callback){
    args = [];
    callback = constructor;
  }else args = [constructor];
  
  return resolve(com.resFunction,[callback,this.goTo('start',unpack),args,this],com.resCallback);
}});

Object.defineProperty(ReadBuffer.prototype,'end',{value: function(data){
  com.resolvers.of(this).get().pop().resolve(data);
}});

onEnd = function(data){
  var cb = finalCb.of(this).get(),
      that = finalCbThis.of(this).get();
  
  cb.call(that,data);
};

module.exports = function(buff,callback,that){
  var b = new ReadBuffer(buff),
      elem;
  
  finalCb.of(b).set(callback);
  finalCbThis.of(b).set(that || b);
  
  elem = b.unpack(onEnd);
  if(elem != resolve.deferred) nextTick(onEnd,[elem],b);
};

module.exports.maxRAM = 1e3;

