var nextTick = require('vz.next-tick'),
    Property = require('vz.property'),
    resolve = require('vz.resolve'),
    Stepper = require('vz.stepper'),
    
		com = require('./common.js'),
    
    currentReadOp = new Property(),
    currentBytes = new Property(),
    currentBlobReadOp = new Property(), // browser line
    currentBlobSize = new Property(), // browser line
    onBytes, // browser line
    onBytesTarget = new Property(), // browser line
    
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
    
    brPool = new Property(),
    brFlags = new Property(),
    
    Buffer = global.Buffer, // nodejs line
    Blob = global.Blob, // browser line
    
    ReadBuffer;

if(Buffer){ // nodejs block
  
  ReadBuffer = function(data,allowBlobs,sync){
    var buff = com.toBuffer(data,true);
    
    brPool.set(this,[]);
    brFlags.set(this,[]);
    com.resolvers.set(this,[]);
    
    if(buff) pool.set(this,buff);
    else{
      pool.set(this,new Buffer(0));
      thisArg.set(data,this);
      if(data.read && data.on) data.on('data',onData);
      else if(sync) data.upTo(Infinity).inPlace().take(onData);
      else data.upTo(Infinity).take(onData);
    }
  };
  
}else{ // browser block
  
  ReadBuffer = function(data,allowBlobs,sync){
    var arr = com.toArray(data);
    
    brPool.set(this,[]);
    brFlags.set(this,[]);
    com.resolvers.set(this,[]);
    
    if(arr){
      pool.set(this,arr);
      return;
    }
    
    pool.set(this,new Uint8Array(0));
    
    if(data instanceof Blob){
      blobPool.set(this,data);
      return;
    }
    
    if(allowBlobs) blobPool.set(this,new Blob());
    if(sync) data.upTo(Infinity).inPlace().take(onData,this);
    else data.upTo(Infinity).take(onData,this);
  };
  
}

ReadBuffer.prototype = new Stepper();
ReadBuffer.prototype.constructor = ReadBuffer;

if(Buffer){ // nodejs block
  
  onData = function(data){
    var that = thisArg.get(this),
        p = pool.get(that),
        cro = currentReadOp.get(that),
        n = currentBytes.get(that),
        ret;
    
    data = com.toBuffer(data,true);
    pool.set(that,p = Buffer.concat([p,data]));
    
    if(cro && p.length >= n){
      currentReadOp.set(that,undefined);
      currentBytes.set(that,undefined);
      
      ret = p.slice(0,n);
      pool.set(that,p.slice(n));
      cro.resolve(ret);
    }
  };
  
  readBytes = function(that,n){
    var ret,
        p = pool.get(that);
    
    if(currentReadOp.get(that)) throw new Error('Only one read operation at a time');
    
    this.blob = false;
    
    if(p.length < n){
      currentBytes.set(that,n);
      currentReadOp.set(that,this);
      return;
    }
    
    ret = p.slice(0,n);
    pool.set(that,p.slice(n));
    this.resolve(ret);
  };
  
}else{ // browser block
  
  onData = function(data){
    var arr = com.toArray(data),
        bp = blobPool.get(this),
        p = pool.get(this),
        n = currentBytes.get(this),
        op = currentReadOp.get(this),
        bn,
        bop,
        size,
        ret,
        bret,
        newPool;
    
    if(!bp){
      
      newPool = new Uint8Array(p.length + arr.length);
      newPool.set(p);
      newPool.set(arr,p.length);
      
    }else{
      size = bp.size;
      bp = new Blob([bp,arr || data]);
      
      bn = currentBlobSize.get(this);
      bop = currentBlobReadOp.get(this);
      
      if(size == p.length && arr){
        newPool = new Uint8Array(p.length + arr.length);
        newPool.set(p);
        newPool.set(arr,p.length);
        
        if(n > size && bp.size >= n){
          ret = newPool.subarray(0,n);
          newPool = newPool.subarray(n);
          bp = bp.slice(n);
        }
        
        if(bn > size && bp.size >= bn){
          bret = bp.slice(0,n);
          newPool = newPool.subarray(n);
          bp = bp.slice(n);
        }
        
        pool.set(this,newPool);
        blobPool.set(this,bp);
        
        if(ret) op.resolve(ret);
        if(bret) bop.resolve(bret);
      }else{
        
        if(n > size && bp.size >= n) bpToPool(this,n);
        
        if(bn > size && bp.size >= bn){
          bret = bp.slice(0,n);
          pool.set(this,p.subarray(n));
          bp = bp.slice(n);
        }
        
        blobPool.set(this,bp);
        
        if(bret) bop.resolve(bret);
      }
    }
    
  };
  
  onFRLoad = function(){
    var view = new Uint8Array(this.result),
        that = this.that,
        p = pool.get(that),
        bp = blobPool.get(that),
        n = currentBytes.get(that),
        op = currentReadOp.get(that),
        bytes = new Uint8Array(view.length + p.length);
    
    bytes.set(p);
    bytes.set(view,p.length);
    
    pool.set(that,bytes.subarray(n));
    blobPool.set(that,bp.slice(n));
    
    currentBytes.set(that,undefined);
    currentReadOp.set(that,undefined);
    
    op.resolve(bytes.subarray(0,n));
  };
  
  bpToPool = function(that,n){
    var p = pool.get(that),
        bp = blobPool.get(that),
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
        p = pool.get(that),
        bp = blobPool.get(that);
    
    if(currentReadOp.get(that) || currentBlobReadOp.get(that))
    throw new Error('Only one read operation at a time');
    
    this.blob = false;
    
    if(p.length < n){
      if(bp && bp.size >=  n) bpToPool(that,n);
      
      currentBytes.set(that,n);
      currentReadOp.set(that,this);
      return;
    }
    
    ret = p.subarray(0,n);
    
    pool.set(that,p.subarray(n));
    if(bp) blobPool.set(that,bp.slice(n));
    
    this.resolve(ret);
  };
  
  onBytes = function(bytes){
    onBytesTarget.get(this).resolve(new Blob([bytes]));
  };
  
  readBlob = function(that,n){
    var ret,
        p = pool.get(that),
        bp = blobPool.get(that);
    
    if(currentReadOp.get(that) || currentBlobReadOp.get(that))
    throw new Error('Only one read operation at a time');
    
    if(!bp){
      onBytesTarget.set(that,this);
      ret = that.read(n,onBytes);
      if(ret != resolve.deferred) onBytes.call(that,ret);
      return;
    }
    
    if(bp.size >= n){
      ret = bp.slice(0,n);
      blobPool.set(that,bp.slice(n));
      pool.set(that,p.subarray(n));
      this.resolve(ret);
      return;
    }
    
    currentBlobReadOp.set(that,this);
    currentBlobSize.set(that,n);
  };
  
  Object.defineProperty(ReadBuffer.prototype,'readBlob',{value: function(n,callback){
    return resolve(readBlob,[this,n],callback,this);
  }});
  
}

Object.defineProperty(ReadBuffer.prototype,'read',{value: function(n,callback){
  return resolve(readBytes,[this,n],callback,this);
}});


unpack = function(args,v){
  var constructor,type;
  
  switch(this.step){
    
    case 'start':
      
      constructor = args[0];
      
      if(!args.length){
        v.setFlag = true;
        v.i = this.unpack(Number,this.goTo('unpack',unpack,v));
        if(v.i == resolve.deferred) return;
      }else v.i = com.label.get(constructor);
    
    case 'unpack':
      
      if(v.i == resolve.deferred) v.i = args[0];
      
      if(v.i == 0){
        brFlags.get(this).push(false);
        v.brTag = this.unpack(Number,this.goTo('br-tag',unpack,v));
        if(v.brTag == resolve.deferred) return;
        return this.end(brPool.get(this)[v.brTag]);
      }else if(v.setFlag) brFlags.get(this).push(true);
      else brFlags.get(this).push(false);
      
      if(!com.unpackers[v.i]){
        this.end(com.classes[v.i]);
        return;
      }
      
      if(!com.types[v.i]) return this.goTo('start',com.unpackers[v.i])();
      
      v.arr = [];
      v.types = com.types[v.i].slice();
    
    case 'unpack-type':
      
      if(v.elem == resolve.deferred) v.arr.push(args[0]);
      
      while(type = v.types.shift()){
        v.elem = this.unpack(type,this.goTo('unpack-type',unpack,v));
        if(v.elem == resolve.deferred) return;
        v.arr.push(v.elem);
      }
      
      this.end(com.unpackers[v.i].apply(this,v.arr));
      break;
      
    case 'br-tag':
      this.end(brPool.get(this)[args[0]]);
  }
  
};


Object.defineProperty(ReadBuffer.prototype,'unpack',{value: function(constructor,callback){
  var args,flags;
  
  if(!callback){
    flags = brFlags.get(this);
    if(flags[flags.length - 1] === true) throw new Error('To use generic chained unpack calls you must call ReadBuffer.start first');
    args = [];
    callback = constructor;
  }else args = [constructor];
  
  return resolve(com.resFunction,[callback,this.goTo('start',unpack),args,this],com.resCallback);
}});

Object.defineProperty(ReadBuffer.prototype,'start',{value: function(data){
  if(brFlags.get(this).pop()) brPool.get(this).push(data);
  brFlags.get(this).push(false);
}});

Object.defineProperty(ReadBuffer.prototype,'end',{value: function(data){
  if(brFlags.get(this).pop()) brPool.get(this).push(data);
  com.resolvers.get(this).pop().resolve(data);
}});

onEnd = function(data){
  var cb = finalCb.get(this),
      that = finalCbThis.get(this);
  
  cb.call(that,data);
};

module.exports = function(buff,callback,options){
  options = options || {};
  
  var b = new ReadBuffer(buff,options.allowBlobs,options.sync),
      elem;
  
  finalCb.set(b,callback);
  finalCbThis.set(b,options.thisArg || b);
  
  elem = b.unpack(onEnd);
  if(elem != resolve.deferred){
    if(options.sync) onEnd.call(b,elem);
    else nextTick(onEnd,[elem],b);
  }
};

module.exports.maxRAM = 1e3;

