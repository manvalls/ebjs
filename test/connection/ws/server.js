var WsS = require('../../../connection/server/ws.js'),
    t = require('u-test'),
    assert = require('assert'),
    http = require('http'),
    walk = require('y-walk');

t('WebSocket server implementation',function*(){
  var server = http.createServer().listen(8888),
      wss = WsS(server),
      n = 6,
      arr = [],
      ws;

  function* test(ws){
    var msg;

    ws.open();

    ws.send('question');
    msg = yield ws.until('message');

    if(msg == 'detachme') return ws.detach();
    if(msg == 'bytes') return ws.send(new ArrayBuffer(10e3));

    assert.strictEqual(msg,'answer');
    msg = yield ws.until('message');
    assert.strictEqual(msg,':)');

    ws.send({foo: 'bar'});
    msg = yield ws.until('message');
    assert.deepEqual(msg,{bar: 'foo'});

    yield ws.until('detached');
  }

  while(n--){
    ws = yield wss.until('connection');
    arr.push(
      walk(test,[ws])
    );
  }

  yield arr;
  server.close();
});
