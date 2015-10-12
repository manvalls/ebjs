/**/ 'use strict' /**/

var walk = require('y-walk'),
    Packer = require('./packer.js'),
    Unpacker = require('./unpacker.js'),
    labelProp = require('./label.js'),

    packers = Symbol(),
    unpackers = Symbol(),
    constants = Symbol(),
    labels = Symbol(),
    parent = Symbol();

class EbjsInstance{

  constructor(){
    this[packers] = new Map();
    this[unpackers] = new Map();
    this[constants] = new Map();
    this[labels] = new Map();
  }

  getChild(){
    var child = new EbjsInstance();
    child[parent] = this;
    return child;
  }

  // Pack

  createPacker(){
    return new Packer(this);
  }

  pack(data,buffer){
    buffer = buffer || ( global.Buffer ? new global.Buffer(1e3) : new Uint8Array(1e3) );

    if(global.Buffer && buffer instanceof global.Buffer) return walk(packDataToBuffer,[data,buffer,this]);
    return walk(packDataToArray,[data,buffer,this]);
  }

  // Unpack

  createUnpacker(){
    return new Unpacker(this);
  }

  unpack(buffer){
    return walk(unpackBuffer,[buffer,this]);
  }

  // Getters

  getLabel(constant){
    var l = this[labels];

    if(l.has(constant)) return l.get(constant);

    if(this[parent]){
      l = this[parent][labels];
      if(l.has(constant)) return l.get(constant);
    }

  }

  getConstant(label){
    var c = this[constants];

    if(c.has(label)) return c.get(label);
    if(this[parent]){
      c = this[parent][constants];
      if(c.has(label)) return c.get(label);
    }

  }

  hasConstant(label){
    if(this[constants].has(label)) return true;
    if(this[parent] && this[parent][constants].has(label)) return true;
    return false;
  }

  getPacker(label){
    var p = this[packers];

    if(typeof label != 'number') label = label.prototype[labelProp];
    if(p.has(label)) return p.get(label);

    if(this[parent]){
      p = this[parent][packers];
      if(p.has(label)) return p.get(label);
    }

  }

  getUnpacker(label){
    var u = this[unpackers];

    if(typeof label != 'number') label = label.prototype[labelProp];
    if(u.has(label)) return u.get(label);

    if(this[parent]){
      u = this[parent][unpackers];
      if(u.has(label)) return u.get(label);
    }

  }

  // Setters

  setConstant(label,constant){
    this[labels].set(constant,label);
    this[constants].set(label,constant);
  }

  setPacker(label,packer,thisArg){
    if(typeof label != 'number') label = label.prototype[labelProp];
    this[packers].set(label,[packer,thisArg]);
  }

  setUnpacker(label,unpacker,thisArg){
    if(typeof label != 'number') label = label.prototype[labelProp];
    this[unpackers].set(label,[unpacker,thisArg]);
  }

}

function* unpackBuffer(buffer,ebjs){
  var unpacker = ebjs.createUnpacker();

  unpacker.write(buffer);
  return yield unpacker.unpack();
}

function* packDataToBuffer(data,buffer,ebjs){
  var packer = ebjs.createPacker(),
      result = new global.Buffer(0);

  packer.pack(data);
  while(!packer.timesFlushed) result = global.Buffer.concat([result,( yield packer.read(buffer) )]);
  return result;
}

function* packDataToArray(data,buffer,ebjs){
  var packer = ebjs.createPacker(),
      result = new Uint8Array(0),
      newArr,oldArr;

  packer.pack(data);
  while(!packer.timesFlushed){
    newArr = yield packer.read(buffer);
    oldArr = result;
    result = new Uint8Array(oldArr.length + newArr.length);

    result.set(oldArr);
    result.set(newArr,oldArr.length);
  }

  return result;
}

/*/ exports /*/

module.exports = EbjsInstance;
