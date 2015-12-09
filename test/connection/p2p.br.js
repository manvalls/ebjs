var t = require('u-test'),
    assert = require('assert'),
    wait = require('y-timers/wait'),
    p2p = require('../../connection/p2p.js'),
    utils = require('./utils.js');

t('WebRTC implementation',function*(){
  var conns = yield utils.getPair(),
      c1 = p2p(conns[0]),
      c2 = p2p(conns[1]);

  c1.open();
  c2.open();

  c1.send('foo');
  assert.strictEqual(yield c2.until('message'),'foo');

  yield wait(500);
  c1.send('bar');
  assert.strictEqual(yield c2.until('message'),'bar');

  c2.send({foo: 'bar'});
  assert.deepEqual(yield c1.until('message'),{foo: 'bar'});
  c2.detach();
  yield c1.until('detached');
});
