/**/ 'use strict' /**/

var BinaryBuffer = require('binary-buffer'),
    Lock = require('y-lock'),
    walk = require('y-walk'),
    ReadBuffer = require('./buffers/read.js'),

    lock = Symbol(),
    rb = Symbol(),
    bb = Symbol();

class Unpacker{

  constructor(ebjs){
    this[lock] = new Lock();
    this[bb] = new BinaryBuffer();
    this[rb] = new ReadBuffer(this[bb],ebjs);
  }

  write(buffer){
    return this[bb].write(buffer);
  }

  unpack(){
    return walk(unpackIt,[this[rb],this[lock]]);
  }

  get timesFlushed(){
    return this[bb].timesFlushed;
  }

}

function* unpackIt(rb,lock){
  var data;

  yield lock.take();
  data = yield rb.unpack();
  lock.give();

  return data;
}

/*/ exports /*/

module.exports = Unpacker;
