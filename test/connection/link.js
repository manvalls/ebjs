var linkConn = require('../../connection/link.js'),
    Connection = require('../../connection.js'),
    walk = require('y-walk'),
    t = require('u-test'),
    assert = require('assert'),
    wait = require('y-timers/wait'),
    pipe,getSubSubPair,getSubPair,getPair;

// Utils

pipe = walk.wrap(function*(packer,unpacker){
  var data;

  while(true){
    data = yield packer.read(1e3);
    yield wait(100);
    unpacker.write(data);
  }

});

getPair = walk.wrap(function(constraints){
  var c1 = new Connection(),
      c2 = new Connection(),
      l1 = linkConn(c1,constraints ? {constraints} : null),
      l2 = linkConn(c2,constraints ? {constraints} : null);

  c1.once('detached',detach,c2);
  c2.once('detached',detach,c1);

  pipe(l1.packer,l2.unpacker);
  pipe(l2.packer,l1.unpacker);

  return [c1,c2];
});

getSubPair = walk.wrap(function*(constraints){
  var conns = yield getPair(constraints),
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

getSubSubPair = walk.wrap(function*(constraints){
  var conns = yield getSubPair(constraints),
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

function detach(e,d,c){
  c.detach();
}

// Factories

function sendTest(getConns){
  return function*(){
    var conns = yield getConns(),
        c1 = conns[0],
        c2 = conns[1],
        msg;

    c1.open();
    c2.open();

    msg = c2.until('message');
    c1.send('foo');
    assert.strictEqual(yield msg,'foo');

    msg = c1.until('message');
    c2.send({foo: 'bar'});
    assert.deepEqual(yield msg,{foo: 'bar'});
  };
}

function detachTest(getConns){
  return function*(){
    var conns = yield getConns(),
        c1 = conns[0],
        c2 = conns[1],
        msg;

    c1.open();
    c2.open();

    assert(!c1.is('detached'));
    assert(!c2.is('detached'));
    c1.detach();
    yield wait(200);
    assert(c1.is('detached'));
    assert(c2.is('detached'));

    conns = yield getConns();
    c1 = conns[0];
    c2 = conns[1];

    assert(!c1.is('detached'));
    assert(!c2.is('detached'));
    c2.detach();
    yield wait(200);
    assert(c1.is('detached'));
    assert(c2.is('detached'));
  };
}

function detachParentTest(getConns){
  return function*(){
    var conns = yield getConns(),
        c1 = conns[0],
        c2 = conns[1],
        p1 = conns[2],
        p2 = conns[3];

    c1.open();
    c2.open();

    p1.detach();
    yield wait(500);

    assert(c1.is('detached'));
    assert(c2.is('detached'));
    assert(p1.is('detached'));
    assert(p2.is('detached'));
  };
}

function constraintsTest(getConns,level){
  return function(){

    t('Bytes',function*(){
      var conns = yield getConns({bytes: 100}),
          c1 = conns[0],
          c2 = conns[1],
          msg;

      c1.open();
      c2.open();

      msg = c2.until('message');
      c1.send(new ArrayBuffer(50));
      assert.strictEqual((yield msg).byteLength,50);

      c1.send(new ArrayBuffer(10e3));
      yield wait(500);
      assert(c1.is('detached'));
      assert(c2.is('detached'));
    });

    t('Connections',function*(){
      var conns = yield getConns({connections: 1 + level}),
          c1 = conns[0],
          c2 = conns[1],
          conn;

      c1.open();
      c2.open();

      conn = new Connection();
      conn.detach();
      c1.send(conn);
      c2.send(conn);
      for(conn of (
        yield [
          c1.until('message'),
          c2.until('message')
        ]
      )) assert(conn.is('detached'));

      c1.send(new Connection());
      conn = yield c2.until('message');
      assert(conn.isNot('detached'));

      c2.send(new Connection());
      conn = yield c1.until('message');
      assert(conn.is('detached'));
    });

  };
}

// Tests

t('link',function(){

  t('Basic send and receive',sendTest(getPair));

  t('Basic detaching',detachTest(getPair));

  t('Subconnection',function(){

    t('Basic send and receive',sendTest(getSubPair));

    t('Basic detaching',detachTest(getSubPair));

    t('Parent connection detaching',detachParentTest(getSubPair));

    t('Constraints',constraintsTest(getSubPair,1));

    t('Subconnection',function(){

      t('Basic send and receive',sendTest(getSubSubPair));

      t('Basic detaching',detachTest(getSubSubPair));

      t('Parent connection detaching',detachParentTest(getSubSubPair));

      t('Constraints',constraintsTest(getSubSubPair,2));

    });

  });

});
