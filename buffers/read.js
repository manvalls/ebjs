/**/ 'use strict' /**/

const BACK_REFERENCE = 0,
      NUMBER = 1;

var walk = require('y-walk'),
    bb = Symbol(),
    rb = Symbol(),
    ebjs = Symbol(),
    refs = Symbol(),
    refc = Symbol();

class ReadBuffer{

  constructor(binaryBuffer,ebjsInstance){
    this[bb] = binaryBuffer;
    this[ebjs] = ebjsInstance;
    this[refs] = new Map();
    this[refc] = -1;
  }

  read(array){
    return this[bb].read(array);
  }

  unpack(label){
    this[refc]++;
    return walk(unpackIt,[label,this[ebjs],new Reference(this[refs],this[refc]),this[refs],this]);
  }

}

class Reference{

  constructor(map,ref){
    this[refs] = map;
    this[refc] = ref;
  }

  set(ref){
    this[refs].set(this[refc],ref);
    return ref;
  }

}

function* unpackIt(label,ebjs,ref,refs,buffer){
  var unpacker;

  if(!label){
    label = yield buffer.unpack(NUMBER);
    if(label === BACK_REFERENCE) return refs.get(yield buffer.unpack(NUMBER));
    if(ebjs.hasConstant(label)) return ebjs.getConstant(label);
  }

  unpacker = ebjs.getUnpacker(label);
  return ref.set(yield walk(unpacker[0],[buffer,ref],unpacker[1]));
}

/*/ exports /*/

module.exports = ReadBuffer;
