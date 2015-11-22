/**/ 'use strict' /**/
var Target = require('y-emitter').Target,
    walk = require('y-walk'),
    label = require('./label.js'),
    emitter = Symbol(),
    end = Symbol(),

    child = false;

class Connection extends Target{

  constructor(){
    super(emitter);

    if(!child){
      child = true;
      this[end] = new Connection();
      this[end][end] = this;
      child = false;
    }

  }

  send(message){
    if(!this[end]) throw new Error('Cannot send a message through a detached connection');
    return walk(giveMsg,[this[end][emitter],this[end],message]);
  }

  detach(){
    var e = this[end];

    if(!e) return;
    this[end][end] = null;
    this[end] = null;

    this[emitter].set('detached');
    e[emitter].set('detached');
  }

  get end(){ return this[end]; }
  get [label](){ return 8; }

}

// utils

function* giveMsg(emitter,target,message){
  yield target.untilNext('message').listeners.gt(0);
  emitter.give('message',message);
}

/*/ exports /*/

module.exports = Connection;
