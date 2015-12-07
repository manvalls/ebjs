var Ws = require('../../../connection/ws.js'),
    t = require('u-test'),
    assert = require('assert');

t('WebSocket implementation - ' + (global.process ? 'node.js' : 'browser'),function(){

  t('Close from client',function*(){
    var ws = Ws('ws://localhost:8888/'),
        msg;

    ws.open();

    msg = yield ws.until('message');
    assert.strictEqual(msg,'question');
    ws.send('answer');
    ws.send(':)');
    ws.detach();
  });

  t('Close from server',function*(){
    var ws = Ws('ws://localhost:8888/');

    ws.open();
    ws.send('detachme');
    yield ws.until('detached');
  });

  t('Close from server due to constraint violation',function*(){
    var ws = Ws('ws://localhost:8888/',{bytes: 1e3});

    ws.open();
    ws.send('bytes');
    yield ws.until('detached');
  });

});
