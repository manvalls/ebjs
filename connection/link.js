var walk = require('y-walk'),
    Collection = require('detacher/collection'),

    ebjs = require('../main.js'),
    Connection = require('../connection.js'),
    parentData = 'ElKPs-yqyhY',

    IN = 0,
    OUT = 1;

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

  obj.agent = conn.end.lock();

  obj.collection.add(
    obj.agent.on('message',onMessage,obj.packer),
    obj.agent.once('detached',onceDetached,obj.collection,obj.connections.in,obj.connections.out),
    walk(processUnpacker,[obj.unpacker,obj.packer,obj.agent,obj.connections,obj.constraints])
  );

  return {
    connection: conn,
    collection: obj.collection,
    packer: obj.packer,
    unpacker: obj.unpacker
  };
}

// Listeners

function onMessage(message,d,packer){
  packer.pack([message]);
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

function* processUnpacker(unpacker,packer,conn,connections,constraints){
  var data,map,sub;

  while(true){
    data = yield unpacker.unpack();
    if(data instanceof Array) switch(data.length){

      case 1:

        // Simple message

        conn.send(data[0]);
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

  if(data.is('detached')){
    yield buffer.pack(-1,Number);
    return;
  }

  yield buffer.pack(id,Number);
  this.nextId = (this.nextId + 1) % 1e15;

  this.connections.out[id] = conn = linkConn(data.end,{
    ebjs: this.instance,
    counters: this.counters,
    constraints: this.constraints
  });

  data.end[parentData] = {
    packer: this.packer,
    dir: IN,
    id: id
  };

  walk(processSubPacker,[this.packer,conn.packer,IN,id]);
  data.once('detached',remove,this.packer,this.counters,this.connections,IN,id);

  this.counters.connections++;
  if(this.constraints.connections && this.counters.connections > this.constraints.connections)
    data.detach();

}

function* unpackerFn(buffer,ref){
  var id = yield buffer.unpack(Number),
      data = new Connection(),
      conn;

  if(id == -1){
    data.detach();
    return data;
  }

  this.connections.in[id] = conn = linkConn(data,{
    ebjs: this.instance,
    counters: this.counters,
    constraints: this.constraints
  });

  data[parentData] = {
    packer: this.packer,
    dir: OUT,
    id: id
  };

  walk(processSubPacker,[this.packer,conn.packer,OUT,id]);
  data.once('detached',remove,this.packer,this.counters,this.connections,OUT,id);

  this.counters.connections++;
  if(this.constraints.connections && this.counters.connections > this.constraints.connections)
    data.detach();

  return data;
}

// Subconnection listeners

function remove(e,d,packer,counters,conns,dir,id){
  if(dir == IN) delete conns.out[id];
  else delete conns.in[id];
  counters.connections--;
  packer.pack([dir,id]);
}

function* processSubPacker(packer,subpacker,dir,id){
  var buff = new Uint8Array(1e3);
  while(true) yield packer.pack([dir,id,yield subpacker.read(buff)]);
}

/*/ exports /*/

module.exports = linkConn;
