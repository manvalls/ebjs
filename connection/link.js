var parentData = 'ElKPs-yqyhY',
    children = require('./children.js'),

    IN = 0,
    OUT = 1,
    sync = [ 101, 98, 106, 115, 47, 99, 111, 110, 110, 101, 99, 116, 105, 111, 110 ],

    walk,Collection,Setter,ebjs,Connection;

/*/ exports /*/

module.exports = linkConn;

/*/ imports /*/

walk = require('y-walk');
Collection = require('detacher/collection');
Setter = require('y-setter');
ebjs = require('../main.js');
Connection = require('../connection.js');

// Main

function linkConn(conn,opt){
  var obj = {},
      packer,unpacker;

  opt = opt || {};
  obj.instance = opt.ebjs || ebjs;
  obj.counters = opt.counters || {};
  obj.constraints = opt.constraints || {};
  obj.counters.connections = obj.counters.connections || 0;

  obj.connections = {in: {}, out: {}};
  obj.collection = new Collection();
  obj.nextId = 0;

  obj.instance = obj.instance.getChild();
  obj.instance.setPacker(Connection,packerFn,obj);
  obj.instance.setUnpacker(Connection,unpackerFn,obj);

  obj.packer = obj.instance.createPacker();
  obj.unpacker = obj.instance.createUnpacker();
  packer = obj.instance.createPacker();
  unpacker = obj.instance.createUnpacker();
  obj.packer.sync(sync);

  obj.agent = conn.end.lock();
  obj.children = new Setter();
  conn[children] = conn.end[children] = obj.children.getter;
  obj.children.value = 0;

  obj.collection.add(
    obj.agent.on('message',onMessage,packer),
    obj.agent.once('detached',onceDetached,obj.collection,obj.connections.in,obj.connections.out),
    walk(processUnpacker,[
      obj.unpacker,
      obj.packer,
      unpacker,
      obj.connections,
      obj.constraints,
      obj.counters,
      obj.instance,
      obj.agent,
      obj.children
    ]),
    walk(processTopUnpacker,[unpacker,obj.agent]),
    walk(processTopPacker,[packer,obj.packer])
  );

  return {
    connection: conn,
    collection: obj.collection,
    packer: obj.packer,
    unpacker: obj.unpacker
  };
}

// Listeners

function* processTopUnpacker(topUnpacker,agent){
  while(true) agent.send(yield topUnpacker.unpack());
}

function* processTopPacker(topPacker,packer){
  var buff = new Uint8Array(1e3);
  while(true) yield packer.pack([yield topPacker.read(buff)]);
}

function onMessage(message,d,packer){
  packer.pack(message);
}

function onceDetached(ev,d,collection,inConns,outConns){
  var keys,i,j;

  collection.detach();

  keys = Object.keys(inConns);
  for(j = 0;j < keys.length;j++){
    i = keys[j];
    inConns[i].connection.detach();
  }

  keys = Object.keys(outConns);
  for(j = 0;j < keys.length;j++){
    i = keys[j];
    outConns[i].connection.detach();
  }

}

function* processUnpacker(
    unpacker,
    packer,
    topUnpacker,
    connections,
    constraints,
    counters,
    ebjs,
    agent,
    children
  ){
  var data,map,sub,conn;

  if(!(yield unpacker.sync(sync))) agent.detach();
  else while(true){
    data = yield unpacker.unpack();
    if(data instanceof Array) switch(data.length){

      case 1:

        // Simple message

        if(data[0] instanceof Uint8Array){

          topUnpacker.write(data[0]);
          if(constraints.bytes && topUnpacker.bytesSinceFlushed > constraints.bytes) agent.detach();

        // Subconnection init

        }else if(typeof data[0] == 'number'){

          conn = new Connection();
          conn.once('detached',remove,packer,counters,connections,children,OUT,data[0]);

          connections.in[data[0]] = linkConn(conn,{
            ebjs: ebjs,
            counters: counters,
            constraints: constraints
          });

          conn[parentData] = {
            packer: packer,
            dir: OUT,
            id: data[0]
          };

          children.value++;
          counters.connections++;
          if(constraints.connections && counters.connections > constraints.connections)
            conn.detach();

        }

        break;

      case 2:

        // Detach child connection

        if(data[0] == IN) map = connections.in;
        else if(data[0] == OUT) map = connections.out;
        else break;

        sub = map[data[1]];
        if(!sub) break;

        delete map[data[1]];
        sub.connection.detach();
        break;

      case 3:

        // Child connection message

        if(data[0] == IN) map = connections.in;
        else if(data[0] == OUT) map = connections.out;
        else break;

        sub = map[data[1]];
        if(!sub) break;

        sub.connection.end.once('open',unpackOrForward,sub,data[2],constraints);
        sub.connection.end.once('locked',unpackOrForward,sub,data[2],constraints);
        break;

    }
  }

}

function unpackOrForward(e,d,sub,data,constraints){

  if(sub.connection.end[parentData])
    sub.connection.end[parentData].packer.pack([
      sub.connection[parentData].dir,
      sub.connection[parentData].id,
      data
    ]);
  else{
    sub.unpacker.write(data);
    if(constraints.bytes && sub.unpacker.bytesSinceFlushed > constraints.bytes)
      sub.connection.detach();
  }

}

// Connection definition

function* packerFn(buffer,data){
  var id = this.nextId,
      conn;

  try{

    if(data.is('detached')){
      yield buffer.pack(-1,Number);
      return;
    }

    conn = linkConn(data.end,{
      ebjs: this.instance,
      counters: this.counters,
      constraints: this.constraints
    });

  }catch(e){
    yield buffer.pack(-1,Number);
    return;
  }

  this.packer.pack([id]);
  yield buffer.pack(id,Number);
  this.nextId = (this.nextId + 1) % 1e15;
  this.connections.out[id] = conn;

  data.end[parentData] = {
    packer: this.packer,
    dir: IN,
    id: id
  };

  data.once('detached',remove,this.packer,this.counters,this.connections,this.children,IN,id);
  conn.collection.add(
    walk(processSubPacker,[this.packer,conn.packer,IN,id])
  );

  this.children.value++;
  this.counters.connections++;
  if(this.constraints.connections && this.counters.connections > this.constraints.connections)
    data.detach();

}

function* unpackerFn(buffer,ref){
  var id = yield buffer.unpack(Number),
      conn;

  conn = this.connections.in[id];
  if(id == -1 || !conn){
    conn = new Connection();
    conn.detach();
    return conn;
  }

  conn.collection.add(
    walk(processSubPacker,[this.packer,conn.packer,OUT,id])
  );

  return conn.connection;
}

// Subconnection listeners

function remove(e,d,packer,counters,conns,children,dir,id){
  var result;
  if(dir == IN) result = delete conns.out[id];
  else result = delete conns.in[id];
  counters.connections--;
  children.value--;
  packer.pack([dir,id]);
}

function* processSubPacker(packer,subpacker,dir,id){
  var buff = new Uint8Array(1e3);
  while(true) yield packer.pack([dir,id,yield subpacker.read(buff)]);
}
