/**/ 'use strict' /**/

const BACK_REFERENCE = 0,
      NUMBER = 1;

var walk = require('y-walk'),
    label = require('../label.js'),
    bb = Symbol(),
    ebjs = Symbol(),
    refs = Symbol(),
    refc = Symbol();

class WriteBuffer{

  constructor(binaryBuffer,ebjsInstance){
    this[bb] = binaryBuffer;
    this[ebjs] = ebjsInstance;
    this[refs] = new WeakMap();
    this[refc] = -1;
  }

  write(array){
    return this[bb].write(array);
  }

  pack(data,label){
    this[refc]++;
    return walk(packIt,[data,label,this[ebjs],this[refc],this[refs],this]);
  }

}

function* packIt(data,lab,ebjs,refc,refs,buffer){
  var packer;

  if(!lab){
    lab = ebjs.getLabel(data);

    if(lab){
      yield buffer.pack(lab,NUMBER);
      return;
    }

    if(refs.has(data)){
      yield buffer.pack(BACK_REFERENCE,NUMBER);
      yield buffer.pack(refs.get(data),NUMBER);
      return;
    }

    try{ refs.set(data,refc); }catch(e){ }
    lab = data[label];
    yield buffer.pack(lab,NUMBER);
  }

  packer = ebjs.getPacker(lab);
  yield walk(packer[0],[buffer,data],packer[1]);
}

/*/ exports /*/

module.exports = WriteBuffer;
