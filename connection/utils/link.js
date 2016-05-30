var BinaryBuffer = require('binary-buffer'),
    children = require('./children.js'),

    parentData = 'ElKPs-yqyhY',
    parentTransfer = 'R7eiK-VaDBc',
    extBB = 'ERCU4-C8gfJ',
    extTransfer = 'R7jgC-31h7Y',

    IN = 0,
    OUT = 1,

    walk,Detacher,Setter,ebjs,Connection;

/*/ exports /*/

module.exports = linkConn;

/*/ imports /*/

walk = require('y-walk');
Detacher = require('detacher');
Setter = require('y-setter');
ebjs = require('../../main.js');
Connection = require('../../connection.js');

// Main

function linkConn(conn,opt){
  var obj = {},
      pbb = new BinaryBuffer(),
      ubb = new BinaryBuffer(),
      packer,unpacker,args;

  opt = opt || {};
  obj.instance = opt.ebjs || ebjs;
  obj.counters = opt.counters || {};
  obj.constraints = opt.constraints || {};
  obj.counters.connections = obj.counters.connections || 0;

  obj.connections = {
    in: new Map(),
    out: new Map()
  };

  obj.collection = new Detacher();
  obj.nextId = 0;

  obj.instance = obj.instance.getChild();
  obj.instance.setPacker(Connection,packerFn,obj);
  obj.instance.setUnpacker(Connection,unpackerFn,obj);

  obj.packer = obj.instance.createPacker(pbb);
  obj.unpacker = obj.instance.createUnpacker(ubb);
  packer = obj.instance.createPacker();
  unpacker = obj.instance.createUnpacker();

  conn[extBB] = pbb;
  conn.transfer(extTransfer,pbb);

  obj.agent = conn.end.lock();
  obj.children = new Setter();
  conn[children] = conn.end[children] = obj.children.getter;
  obj.children.value = 0;

  args = [
    obj.unpacker,
    obj.packer,
    unpacker,
    obj.connections,
    obj.constraints,
    obj.counters,
    obj.instance,
    obj.agent,
    obj.children
  ];

  obj.collection.add(
    obj.agent.on('message',onMessage,packer),
    obj.agent.once('detached',onceDetached,obj.collection,obj.connections.in,obj.connections.out),
    conn.once('open',tryToForward,ubb,obj.collection,obj.unpacker,obj.agent,args),
    conn.once('locked',tryToForward,ubb,obj.collection,obj.unpacker,obj.agent,args),
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
  while(true) yield packer.pack([yield topPacker.read(1e3)]);
}

function onMessage(message,d,packer){
  packer.pack(message);
}

function onceDetached(ev,d,collection,inConns,outConns){
  var conn,i,j;

  collection.detach();
  for(conn of inConns.values()) conn.connection.detach();
  for(conn of outConns.values()) conn.connection.detach();
}

function* tryToForward(e,d,ubb,collection,unpacker,agent,args){

  if(this[parentTransfer]) collection.add(
    walk(forwardToParent,[this[parentTransfer],ubb])
  );
  else if(this[extTransfer]) collection.add(
    walk(forwardToExt,[this[extTransfer],ubb])
  );
  else collection.add(
    walk(processUnpacker,args)
  );

}

function* forwardToParent(parent,bb){

  bb.autoFlush = true;
  while(true) yield parent.packer.pack([
    parent.dir,
    parent.id,
    yield bb.read(1e3)
  ]);

}

function* forwardToExt(ext,bb){
  var yd;

  bb.autoFlush = true;
  while(true){

    yd = ext.write(
      yield bb.read(1e3)
    );

    ext.flush();
    yield yd;

  }

}

function* processUnpacker(  unpacker,
                            packer,
                            topUnpacker,
                            connections,
                            constraints,
                            counters,
                            ebjs,
                            agent,
                            children ){
  var data,map,sub,conn;

  while(true){
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

          connections.in.set(data[0],linkConn(conn,{
            ebjs: ebjs,
            counters: counters,
            constraints: constraints
          }));

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

        sub = map.get(data[1]);
        if(!sub) break;

        delete map[data[1]];
        sub.connection.detach();
        break;

      case 3:

        // Child connection message

        if(data[0] == IN) map = connections.in;
        else if(data[0] == OUT) map = connections.out;
        else break;

        sub = map.get(data[1]);
        if(!sub) break;

        if(sub.connection.end){
          sub.connection.end.once('open',unpackOrForward,sub,data[2],constraints);
          sub.connection.end.once('locked',unpackOrForward,sub,data[2],constraints);
        }

        break;

    }
  }

}

function unpackOrForward(e,d,sub,data,constraints){

  if(sub.connection.end[parentData]) sub.connection.end[parentData].packer.pack([
    sub.connection.end[parentData].dir,
    sub.connection.end[parentData].id,
    data
  ]);
  else if(sub.connection.end[extBB]){
    sub.connection.end[extBB].write(data);
    sub.connection.end[extBB].flush();
  }else{
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
  this.connections.out.set(id,conn);

  data.end[parentData] = {
    packer: this.packer,
    dir: IN,
    id: id
  };

  data.end.transfer(parentTransfer,data.end[parentData]);
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

  conn = this.connections.in.get(id);
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
  if(dir == IN) conns.out.delete(id);
  else conns.in.delete(id);
  counters.connections--;
  children.value--;
  packer.pack([dir,id]);
}

function* processSubPacker(packer,subpacker,dir,id){
  while(true) yield packer.pack([dir,id,yield subpacker.read(1e3)]);
}
