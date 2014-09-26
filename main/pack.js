
var com = require('./common.js'),
    
    resolve = require('vz.resolve'),
    nextTick = require('vz.next-tick'),
    Property = require('vz.property'),
    Stepper = require('vz.stepper'),
    
    Buffer = global.Buffer,
    Blob = global.Blob,
    
    buffer = new Property(),
    
    giverCB = new Property(),
    giverThat = new Property(),
    
    options = new Property(),
    callback = new Property(),
    
    brTagProp = new Property(),
    nextBrTag = new Property(),
    
    pack,
    onEnd,
    toData,
    giver,
    
    onFRLoad;

function WriteBuffer(){
  com.resolvers.set(this,[]);
  buffer.set(this,[]);
  nextBrTag.set(this,0);
  brTagProp.set(this,new Property());
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
        
        v.i = com.uLabel.get(v.data);
        if(v.i != null){
          if(this.pack(Number,v.i,this.goTo('end',pack,v)) !== resolve.deferred) this.end();
          return;
        }
        
        v.brTag = brTagProp.get(this).get(v.data);
        
        if(v.brTag != null){
          if(this.pack(Number,0,this.goTo('br-tag',pack,v)) === resolve.deferred) return;
          if(this.pack(Number,v.brTag,this.goTo('end',pack,v)) === resolve.deferred) return;
          return this.end();
        }else brTagProp.get(this).set(v.data,nextBrTag.of(this).value++);
        
        constructor = v.data.constructor;
        
        while((v.i = com.label.get(constructor)) == null){
          proto = Object.getPrototypeOf(constructor.prototype);
          if(!proto) throw new TypeError('Unsupported type "' + v.data.constructor.name + '"');
          constructor = proto.constructor;
        }
        
        if(this.pack(Number,v.i,this.goTo('pack',pack,v)) === resolve.deferred) return;
      }else if((v.i = com.label.get(constructor)) == null) throw new TypeError('Unsupported type "' + constructor.name + '"');
      
    case 'pack':
      
      if(com.types[v.i]){
        v.arr = com.packers[v.i].call(this,v.data);
        v.types = com.types[v.i].slice();
      }else if(com.packers[v.i]) return this.goTo('start',com.packers[v.i])(v.data);
    
    case 'pack-type':
      
      while(type = v.types.shift()){
        elem = v.arr.shift();
        if(this.pack(type,elem,this.goTo('pack-type',pack,v)) === resolve.deferred) return;
      }
      
    case 'end':
      this.end();
      break;
    
    case 'br-tag':
      if(this.pack(Number,v.brTag,this.goTo('end',pack,v)) === resolve.deferred) return;
      return this.end();
    
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

if(Blob){
  
  giver = function(data){
    this.give(data);
    giverCB.get(this).call(giverThat.get(this));
  };
  
  Object.defineProperty(WriteBuffer.prototype,'write',{value: function(data,callback){
    var trg = options.get(this).target;
    
    if(trg && trg.give){
      giverCB.set(trg,callback);
      giverThat.set(trg,this);
      toData(data instanceof Blob?data:new Blob([data]),type.get(this),giver,trg);
      return resolve.deferred;
    }else buffer.get(this).push(data);
  }});
  
}else Object.defineProperty(WriteBuffer.prototype,'write',{value: function(data,callback){
  var buff = com.toBuffer(data),
      opt = options.get(this),
      trg = opt.target;
  
  if(buff){
    if(trg){
      if(trg.write) trg.write(toData(buff,opt.type));
      else trg.give(toData(buff,opt.type));
    }else buffer.get(this).push(buff);
  }
}});

Object.defineProperty(WriteBuffer.prototype,'end',{value: function(){
  com.resolvers.get(this).pop().resolve();
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
  
  toData = function(data,type,callback,that,sync){
    var fr;
    
    type = type || '';
    
    switch(type.toLowerCase()){
      case 'base64':
        fr = new FileReader();
        fr.base64 = true;
      case 'dataurl':
        fr = fr || new FileReader();
        
        fr.onload = onFRLoad;
        fr.cb = callback;
        fr.that = that;
        fr.readAsDataURL(data);
        break;
      case 'arraybuffer': {
        fr = new FileReader();
        
        fr.onload = onFRLoad;
        fr.cb = callback;
        fr.that = that;
        fr.readAsArrayBuffer(data);
      } break;
      default:
        if(sync) callback.call(that,data);
        else nextTick(callback,[data],that);
    }
    
  };
  
  onEnd = function(){
    var cb,t,that,trg,opt;
    
    opt = options.get(this);
    cb = callback.get(this);
    t = opt.type;
    that = opt.thisArg;
    trg = opt.target;
    
    if(trg) cb.call(that,trg);
    else toData(new Blob(buffer.get(this)),t,cb,that);
  };
  
}else{
  
  toData = function(buff,type){
    type = type || '';
    
    switch(type.toLowerCase()){
      case 'base64': return buff.toString('base64');
      case 'dataurl': return 'data:;base64,' + buff.toString('base64');
      case 'arraybuffer': return (new Uint8Array(buff)).buffer;
      default: return buff;
    }
    
  };
  
  onEnd = function(){
    var cb,t,that,trg,buff,opt;
    
    opt = options.get(this);
    cb = callback.get(this);
    t = opt.type;
    that = opt.thisArg;
    trg = opt.target;
    
    if(trg) cb.call(that,trg);
    else cb.call(that,toData(Buffer.concat(buffer.get(this)),t));
  };
  
}

module.exports = function(data,cb,opt){
  var b = new WriteBuffer(),res;
  
  opt = opt || {};
  
  options.set(b,opt);
  callback.set(b,cb);
  
  res = b.pack(data,onEnd);
  if(res !== resolve.deferred){
    if(opt.sync) onEnd.call(b);
    else nextTick(onEnd,[],b);
  }
};

