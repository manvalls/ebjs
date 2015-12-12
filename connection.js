/**/ 'use strict' /**/
var Target = require('y-emitter').Target,
    walk = require('y-walk'),
    label = require('./label.js'),
    emitter = Symbol(),
    end = Symbol(),
    agent = Symbol(),

    child = false;

class Connection extends Target{

  constructor(){
    super(emitter);

    if(!child){
      child = true;
      this[end] = new this.constructor(...arguments);
      this[end][end] = this;
      child = false;
    }

  }

  send(message){
    if(!this[end]) throw new Error('Cannot send a message through a detached connection');
    if(!this.is('open')) throw new Error('Cannot send a message through a non-open connection');
    walk(giveMsg,[this[end][emitter],this[end],message]);
    walk(giveLM,[this[end],message]);
  }

  open(){
    if(!this[end]) throw new Error('Cannot open a detached connection');
    if(this.is('locked')) throw new Error('Cannot open a locked connection');
    if(this.is('open')) throw new Error('Connection already open');
    this[emitter].set('open');
  }

  lock(lf,lt){
    if(!this[end]) throw new Error('Cannot lock a detached connection');
    if(this.is('open')) throw new Error('Cannot lock an open connection');
    if(this.is('locked')) throw new Error('Connection already locked');

    this[agent] = new Agent(this[end]);
    this[emitter].set('locked');

    return this[agent];
  }

  detach(){
    var e = this[end];

    if(!e) return;
    this[end][end] = null;
    this[end] = null;

    this[emitter].unset('open');
    this[emitter].unset('locked');

    e[emitter].unset('open');
    e[emitter].unset('locked');

    this[emitter].set('detached');
    if(this[agent]) this[agent][emitter].set('detached');
    if(e[agent]) e[agent][emitter].set('detached');
    e[emitter].set('detached');
  }

  get end(){ return this[end]; }
  get [label](){ return 8; }

}

class Agent extends Target{

  constructor(e){
    super(emitter);
    this[end] = e;
  }

  send(message){
    if(!this[end][end]) throw new Error('The underlying connection is detached');
    walk(giveMsg,[this[end][emitter],this[end],message]);
    walk(giveLM,[this[end],message]);
  }

}

// utils

function* giveMsg(emitter,target,message){
  yield target.until('open');
  yield target.until('message').listeners.gt(0);
  emitter.give('message',message);
}

function* giveLM(target,message){
  yield target.until('locked');
  yield target[agent].until('message').listeners.gt(0);
  target[agent][emitter].give('message',message);
}

/*/ exports /*/

module.exports = Connection;
