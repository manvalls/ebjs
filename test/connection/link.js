var utils = require('./utils.js'),
    Connection = require('../../connection.js'),
    t = require('u-test'),
    assert = require('assert'),
    wait = require('y-timers/wait');

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
    yield wait(600);
    assert(c1.is('detached'));
    assert(c2.is('detached'));

    conns = yield getConns();
    c1 = conns[0];
    c2 = conns[1];

    assert(!c1.is('detached'));
    assert(!c2.is('detached'));
    c2.detach();
    yield wait(600);
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
    yield wait(600);

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
      yield wait(1000);
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

      conn = new Connection();
      conn.lock();
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

  t('Basic send and receive',sendTest(utils.getPair));

  t('Basic detaching',detachTest(utils.getPair));

  t('Subconnection',function(){

    t('Basic send and receive',sendTest(utils.getSubPair));

    t('Basic detaching',detachTest(utils.getSubPair));

    t('Parent connection detaching',detachParentTest(utils.getSubPair));

    t('Constraints',constraintsTest(utils.getSubPair,1));

    t('Subconnection',function(){

      t('Basic send and receive',sendTest(utils.getSubSubPair));

      t('Basic detaching',detachTest(utils.getSubSubPair));

      t('Parent connection detaching',detachParentTest(utils.getSubSubPair));

      t('Constraints',constraintsTest(utils.getSubSubPair,2));

    });

  });

  t('Bridge',function(){

    t('Basic send and receive',sendTest(utils.getBridge));

    t('Basic detaching',detachTest(utils.getBridge));

    t('Parent connection detaching',detachParentTest(utils.getBridge));

    t('Constraints',constraintsTest(utils.getBridge,1));

    t('Subconnection',function(){

      t('Basic send and receive',sendTest(utils.getSubconnectionBridge));

      t('Basic detaching',detachTest(utils.getSubconnectionBridge));

      t('Parent connection detaching',detachParentTest(utils.getSubconnectionBridge));

      t('Constraints',constraintsTest(utils.getSubconnectionBridge,2));

    });

    t('Subbridge',function(){

      t('Basic send and receive',sendTest(utils.getSubBridge));

      t('Basic detaching',detachTest(utils.getSubBridge));

      t('Parent connection detaching',detachParentTest(utils.getSubBridge));

      t('Constraints',constraintsTest(utils.getSubBridge,2));

    });

  });

});
