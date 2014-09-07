
var com = require('./common.js'),
    
    resolve = require('vz.resolve'),
    nextTick = require('vz.next-tick'),
    Property = require('vz.property'),
    Stepper = require('vz.stepper'),
    
    Buffer = global.Buffer,
    Blob = global.Blob,
    
    buffer = new Property(),
    
    type = new Property(),
    callback = new Property(),
    thisArg = new Property(),
    target = new Property(),
    
    pack,
    onEnd,
    
    onFRLoad;

function WriteBuffer(){
  com.resolvers.of(this).set([]);
  buffer.of(this).set([]);
}

WriteBuffer.prototype = new Stepper();
WriteBuffer.prototype.constructor = WriteBuffer;

pack = function(args,v){
  var proto,constructor,type,elem;
  
  switch(this.step){
    
    case 'start':
      
      constructor = args[0];
      v.data = args[1];
      
      if(args.length == 1){
        v.data = constructor;
        
        v.i = com.label.of(v.data).get();
        if(v.i != null && com.packers[v.i] == null){
          if(this.pack(Number,v.i,this.goTo('end',pack,v)) != resolve.deferred) this.end();
          return;
        }
        
        constructor = v.data.constructor;
        
        while((v.i = com.label.of(constructor).get()) == null){
          proto = Object.getPrototypeOf(constructor.prototype);
          if(!proto) throw new TypeError('Unsupported type "' + v.data.constructor.name + '"');
          constructor = proto.constructor;
        }
        
        if(this.pack(Number,v.i,this.goTo('pack',pack,v)) == resolve.deferred) return;
      }else if((v.i = com.label.of(constructor).get()) == null) throw new TypeError('Unsupported type "' + constructor.name + '"');
      
    case 'pack':
      
      if(com.types[v.i]){
        v.arr = com.packers[v.i].call(this,v.data);
        v.types = com.types[v.i].slice();
      }else if(com.packers[v.i]) return this.goTo('start',com.packers[v.i])(v.data);
    
    case 'pack-type':
      
      while(type = v.types.shift()){
        elem = v.arr.shift();
        if(this.pack(type,elem,this.goTo('pack-type',pack,v)) == resolve.deferred) return;
      }
      
    case 'end':
      this.end();
    
  }
  
};

Object.defineProperty(WriteBuffer.prototype,'pack',{value: function(constructor,data,callback){
  var args;
  
  if(!callback){
    args = [constructor];
    callback = data;
  }else args = [constructor,data];
  
  return resolve(com.resFunction,[callback,this.goTo('start',pack),args,this],com.resCallback);
}});

if(Blob) Object.defineProperty(WriteBuffer.prototype,'write',{value: function(data,callback){
  buffer.of(this).get().push(data);
}});
else Object.defineProperty(WriteBuffer.prototype,'write',{value: function(data,callback){
  var buff = com.toBuffer(data);
  
  if(buff) buffer.of(this).get().push(buff);
}});

Object.defineProperty(WriteBuffer.prototype,'end',{value: function(){
  com.resolvers.of(this).get().pop().resolve();
}});

if(Blob){
  
  onFRLoad = function onFRLoad(){
    var data = this.result,i;
    
    if(this.base64){
      i = data.indexOf('base64,');
      
      if(i == -1) data = data.substring(5);
      else data = data.substring(i + 7);
    }
    
    this.cb.call(this.that,data);
  };
  
  onEnd = function(){
    var fr,cb,t,that,res;
    
    cb = callback.of(this).get();
    t = type.of(this).get();
    that = thisArg.of(this).get();
    
    if(t) t = t.toLowerCase();
    
    switch(t){
      case 'base64':
        fr = new FileReader();
        fr.base64 = true;
      case 'dataurl':
        fr = fr || new FileReader();
        
        fr.onload = onFRLoad;
        fr.cb = cb;
        fr.that = that;
        fr.readAsDataURL(new Blob(buffer.of(this).value));
        break;
      case 'arraybuffer': {
        fr = new FileReader();
        
        fr.onload = onFRLoad;
        fr.cb = cb;
        fr.that = that;
        fr.readAsArrayBuffer(new Blob(buffer.of(this).value));
      } break;
      default:
        nextTick(cb,[new Blob(buffer.of(this).value)],that);
    }
    
  };
  
}else onEnd = function(){
  var fr,cb,t,that,buff,result;

  cb = callback.of(this).get();
  t = type.of(this).get();
  that = thisArg.of(this).get();
  
  if(t) t = t.toLowerCase();
  
  buff = Buffer.concat(buffer.of(this).value);
  
  switch(t){
    case 'base64': {
      result = buff.toString('base64');
      } break;
    case 'dataurl': {
      result = 'data:;base64,' + buff.toString('base64');
      } break;
    case 'arraybuffer': {
      result = (new Uint8Array(buff)).buffer;
    } break;
    default: {
      result = buff;
    } break;
  }
  
  nextTick(cb,[result],that);
};

module.exports = function(data,cb,that,t,tar){
  var b = new WriteBuffer(),res;
  
  if(typeof that == 'string'){
    tar = t;
    t = that;
    that = window;
  }
  
  type.of(b).set(t);
  callback.of(b).set(cb);
  thisArg.of(b).set(that);
  target.of(b).set(tar);
  
  res = b.pack(data,onEnd);
  if(res != resolve.deferred) onEnd.call(b);
};
