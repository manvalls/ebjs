/**/ 'use strict' /**/

var BinaryBuffer = require('binary-buffer'),
    Lock = require('y-lock'),
    walk = require('y-walk'),
    WriteBuffer = require('./buffers/write.js'),

    lock = Symbol(),
    wb = Symbol(),
    bb = Symbol();

class Packer{

  constructor(ebjs){
    this[lock] = new Lock();
    this[bb] = new BinaryBuffer();
    this[wb] = new WriteBuffer(this[bb],ebjs);
  }

  read(buffer){
    return this[bb].read(buffer);
  }

  pack(data){
    return walk(packIt,[data,this[wb],this[lock],this[bb]]);
  }

  get timesFlushed(){
    return this[bb].timesFlushed;
  }

}

function* packIt(data,wb,lock,bb){
  yield lock.take();
  yield wb.pack(data);
  lock.give();
  bb.flush();
}

/*/ exports /*/

module.exports = Packer;
