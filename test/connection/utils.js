var Connection = require('../../connection.js'),
    linkConn = require('../../connection/utils/link.js'),
    walk = require('y-walk'),
    wait = require('y-timers/wait');

exports.pipe = walk.wrap(function*(packer,unpacker){
  var data;

  while(true){
    data = yield packer.read(1e3);
    if(Math.random() > 0.5) yield wait(10);
    unpacker.write(data);
  }

});

exports.getPair = walk.wrap(function(constraints){
  var c1 = new Connection(),
      c2 = new Connection(),
      l1 = linkConn(c1,constraints ? {constraints} : null),
      l2 = linkConn(c2,constraints ? {constraints} : null);

  c1.once('detached',detach,c2);
  c2.once('detached',detach,c1);

  exports.pipe(l1.packer,l2.unpacker);
  exports.pipe(l2.packer,l1.unpacker);

  return [c1,c2];
});

exports.getSubPair = walk.wrap(function*(constraints){
  var conns = yield exports.getPair(constraints),
      c1 = conns[0],
      c2 = conns[1],
      sc1 = new Connection(),
      sc2;

  sc2 = c2.until('message');
  c1.open();
  c2.open();

  c1.send(sc1.end);
  sc2 = yield sc2;

  return [sc1,sc2,c1,c2];
});

exports.getSubSubPair = walk.wrap(function*(constraints){
  var conns = yield exports.getSubPair(constraints),
      c1 = conns[0],
      c2 = conns[1],
      sc1 = new Connection(),
      sc2;

  sc2 = c2.until('message');
  c1.open();
  c2.open();

  c1.send(sc1.end);
  sc2 = yield sc2;

  return [sc1,sc2,c1,c2];
});

exports.getBridge = walk.wrap(function*(constraints){
  var conns1 = yield exports.getPair(constraints),
      conns2 = yield exports.getPair(constraints),
      c11 = conns1[0],
      c12 = conns1[1],
      c21 = conns2[0],
      c22 = conns2[1],
      tempConn = new Connection();

  c11.open();
  c12.open();
  c21.open();
  c22.open();

  c11.send(tempConn);
  c21.send(tempConn.end);

  return [
    yield c12.until('message'),
    yield c22.until('message'),
    c11,
    c12
  ];
});

exports.getSubBridge = walk.wrap(function*(constraints){
  var conns1 = yield exports.getBridge(constraints),
      conns2 = yield exports.getBridge(constraints),
      c11 = conns1[0],
      c12 = conns1[1],
      c21 = conns2[0],
      c22 = conns2[1],
      tempConn = new Connection();

  c11.open();
  c12.open();
  c21.open();
  c22.open();

  c11.send(tempConn);
  c21.send(tempConn.end);

  return [
    yield c12.until('message'),
    yield c22.until('message'),
    c11,
    c12
  ];
});

exports.getSubconnectionBridge = walk.wrap(function*(constraints){
  var conns1 = yield exports.getSubPair(constraints),
      conns2 = yield exports.getSubPair(constraints),
      c11 = conns1[0],
      c12 = conns1[1],
      c21 = conns2[0],
      c22 = conns2[1],
      tempConn = new Connection();

  c11.open();
  c12.open();
  c21.open();
  c22.open();

  c11.send(tempConn);
  c21.send(tempConn.end);

  return [
    yield c12.until('message'),
    yield c22.until('message'),
    c11,
    c12
  ];
});

function detach(e,d,c){
  c.detach();
}
