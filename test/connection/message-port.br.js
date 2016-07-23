var t = require('u-test'),
    assert = require('assert'),
    Mp = require('../../connection/message-port.js');

t('MessagePort implementation',function*(){
  var channel = new MessageChannel(),
      conn1 = Mp(channel.port1),
      conn2 = Mp(channel.port2),
      yd;

  conn1.open();
  conn2.open();

  yd = conn1.until('message');
  conn2.send('foo');
  assert.strictEqual(yield yd,'foo');

  yd = conn2.until('message');
  conn1.send('foo');
  assert.strictEqual(yield yd,'foo');

  conn1.detach();
  yield conn1.until('detached');
  yield conn2.until('detached');

});
