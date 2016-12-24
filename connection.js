/**/ 'use strict' /**/
var Target = require('y-emitter').Target,
    walk = require('y-walk'),
    label = require('./label.js'),
    emitter = Symbol(),
    end = Symbol(),
    agent = Symbol(),
    transfer = 'zsSfN-9jbQe',
    pipedFrom = 'zsW5X-3e3QQ',
    isConn = '2PTw6-VLbq2',

    child = false;

class Connection extends Target{

  constructor(){
    super(emitter);
    this[transfer] = new Map();

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
    this[emitter].set('open');
  }

  lock(){
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

    if(this[agent]) this[agent][emitter].set('detached');
    if(e[agent]) e[agent][emitter].set('detached');
    this[emitter].set('detached');
    e[emitter].set('detached');
  }

  transfer(key,value){
    if(this[pipedFrom]){
      this[pipedFrom][key] = value;
      if(this[pipedFrom].end) this[pipedFrom].end.transfer(key,value);
    }else this[transfer].set(key,value);
  }

  bind(connection){
    var src,dest,entry;

    for(entry of connection[transfer].entries()){
      this[entry[0]] = entry[1];
      this.end.transfer(entry[0],entry[1]);
    }

    connection[transfer].clear();
    connection[pipedFrom] = this;

    for(entry of this[transfer].entries()){
      connection[entry[0]] = entry[1];
      connection.end.transfer(entry[0],entry[1]);
    }

    this[transfer].clear();
    this[pipedFrom] = connection;

    src = this.lock();
    dest = connection.lock();
    src.on('message',pipeMsg,dest);
    src.once('detached',pipeDtc,dest);
    dest.on('message',pipeMsg,src);
    dest.once('detached',pipeDtc,src);
  }

  static is(conn){
    return conn && conn[isConn];
  }

  get end(){ return this[end]; }
  get [label](){ return 8; }
  get [isConn](){ return true; }

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

  detach(){
    if(this[end]) this[end].detach();
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

function pipeMsg(msg,d,dest){
  dest.send(msg);
}

function pipeDtc(e,d,dest){
  dest.detach();
}

/*/ exports /*/

module.exports = Connection;
