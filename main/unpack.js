var nextTick = require('vz.next-tick'),
    Property = require('vz.property'),
    resolve = require('vz.resolve'),
    Stepper = require('vz.stepper'),
    
		com = require('./common.js'),
    
    currentReadOp = new Property(),
    currentBytes = new Property(),
    
    pool = new Property(),
    blobPool = new Property(),
    
    thisArg = new Property(),
    
    finalCb = new Property(),
    finalCbThis = new Property(),
    
    readBytes,
    onData,
    onDataWrapper,
    onEnd,
    unpack,
    toArrayBuffer,
    
    Buffer = global.Buffer,
    Blob = global.Blob,
    
    ReadBuffer;

if(Buffer) onData = function(data){
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
else{
  
  toArrayBuffer = function(){
    
  };
  
  onData = function(){
    
  };
  
}

if(Buffer) ReadBuffer = function(data){
  var buff = com.toBuffer(data,true);
  
  com.resolvers.of(this).set([]);
  
  if(buff) pool.of(this).set(buff);
  else{
    pool.of(this).set(new Buffer(0));
    thisArg.of(data).value = this;
    if(data.read && data.on) data.on('data',onData);
    else if(data.take) data.upTo(Infinity).take(onData);
  }
};

ReadBuffer.prototype = new Stepper();
ReadBuffer.prototype.constructor = ReadBuffer;

if(Buffer) readBytes = function(that,n){
  var ret,
      p = pool.of(that).get();
  
  if(p.length < n){
    currentBytes.of(that).set(n);
    currentReadOp.of(that).set(this);
    return;
  }
  
  ret = p.slice(0,n);
  pool.of(that).set(p.slice(n));
  this.resolve(ret);
};
else readBytes = function(that,n){
  var ret,
      p = pool.of(that).get();
  
  if(p.length < n){
    currentBytes.of(that).set(n);
    currentReadOp.of(that).set(this);
    return;
  }
  
  ret = p.subarray(0,n);
  pool.of(that).set(p.subarray(n));
  this.resolve(ret);
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

/*

  if(typeof data == 'string'){
		var i = data.indexOf('base64,');
		
		if(i != -1) data = data.substring(i + 7);
		
		data = atob(data);
		
		var view = new Uint8Array(data.length);
		
		for(i = 0;i < data.length;i++){
			view[i] = data.charCodeAt(i);
		}
		
		data = view.buffer;
		
	}
