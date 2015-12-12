var t = require('u-test'),
    assert = require('assert'),
    wait = require('y-timers/wait'),
    RTCConnection = require('../../connection/rtc.js'),
    utils = require('./utils.js');

t('WebRTC implementation - ' + (global.process ? 'node.js' : 'browser'),function*(){
  var conns = yield utils.getPair(),
      c1 = new RTCConnection(),
      n = 500,
      c2;

  conns[0].open();
  conns[1].open();

  conns[0].send(c1.end);
  c2 = yield conns[1].until('message');

  c1.open();
  c2.open();

  while(n--){
    if(Math.random() < 0.5){
      c1.send(n);
      assert.strictEqual(yield c2.until('message'),n);
    }else{
      c2.send(n);
      assert.strictEqual(yield c1.until('message'),n);
    }
  }

  c2.send({foo: 'bar'});
  assert.deepEqual(yield c1.until('message'),{foo: 'bar'});
  c2.detach();
  yield c1.until('detached');
});
