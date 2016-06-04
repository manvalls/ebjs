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

  write(){
    return this[bb].write(...arguments);
  }

  pack(data,label){
    this[refc]++;
    return walk(packIt,[data,label,this[ebjs],this[refc],this[refs],this]);
  }

}

function* packIt(data,lab,ebjs,refc,refs,buffer){
  var packer,pd;

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
    pd = data;

    while(true){
      lab = pd[label];
      packer = ebjs.getPacker(lab);
      if(packer) break;
      pd = Object.getPrototypeOf(pd);
    }

    yield buffer.pack(lab,NUMBER);
  }

  packer = packer || ebjs.getPacker(lab);
  if(!packer) throw new TypeError('Unsupported label ' + lab);
  yield walk(packer[0],[buffer,data],packer[1]);
}

/*/ exports /*/

module.exports = WriteBuffer;
