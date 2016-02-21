var t = require('u-test'),
    assert = require('assert'),
    stream = require('stream'),
    net = require('net'),
    Cb = require('y-callback'),
    St = require('../../connection/stream.js');

t('Stream implementation',function(){

  t('PassThrough',function*(){
    var stream1 = new stream.PassThrough(),
        stream2 = new stream.PassThrough(),
        conn1 = St({
          write: stream1,
          read: stream2
        }),
        conn2 = St({
          write: stream2,
          read: stream1
        }),
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

  t('TCP',function*(){
    var server = net.createServer(),
        socket1,socket2,conn1,conn2,cb,yd;

    server.listen(0,cb = Cb());
    yield cb;

    server.once('connection',cb = Cb());
    socket1 = net.connect(server.address().port);
    socket2 = (yield cb)[0];

    conn1 = St(socket1);
    conn2 = St(socket2);
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

    server.close();
  });

});
