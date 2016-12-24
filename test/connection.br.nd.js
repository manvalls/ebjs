var t = require('u-test'),
    assert = require('assert'),
    Connection = require('../connection'),
    label = require('../label.js');

t('Connection - ' + (global.navigator ? 'browser' : 'node.js'),function*(){
  var conn = new Connection(),
      msg;

  assert(Connection.is(conn));
  assert(!Connection.is());
  assert(!Connection.is(5));

  conn.open();
  conn.end.open();

  t('Send and receive message',function(){

    t('to end',function(){
      var error;

      assert.strictEqual(conn[label],8);
      conn.end.on('message',function(m){
        msg = m;
      });

      conn.send('foo');
      assert.strictEqual(msg,'foo');

      try{ conn.end.lock(); }
      catch(e){ error = e; }
      assert(!!error);
    });

    t('from end',function(){

      conn.on('message',function(m){
        msg = m;
      });

      conn.end.send({foo: 'bar'});
      assert.deepEqual(msg,{foo: 'bar'});
    });

  });

  t('Detaching',function(){

    t('to end',function(){
      var conn = new Connection(),
          wrong,error;

      conn.detach();
      conn.detach();

      try{
        conn.send('foo');
        wrong = true;
      }catch(e){}

      assert(!wrong);

      try{
        conn.send('foo');
        wrong = true;
      }catch(e){}

      assert(!wrong);
      conn.detach();

      try{ conn.open(); }
      catch(e){ error = e; }
      assert(!!error);

      error = null;
      try{ conn.lock(); }
      catch(e){ error = e; }
      assert(!!error);
    });

    t('from end',function(){
      var conn = new Connection(),
          wrong;

      conn.end.detach();

      try{
        conn.send('foo');
        wrong = true;
      }catch(e){}

      assert(!wrong);

      try{
        conn.send('foo');
        wrong = true;
      }catch(e){}

      assert(!wrong);
      conn.detach();
    });

  });

  t('connection.lock()',function(){

    t('Receive messages',function(){
      var conn = new Connection(),
          msg,error;

      conn.end.lock().on('message',function(m){
        msg = m;
      });

      conn.open();
      conn.send('foo');
      assert.strictEqual(msg,'foo');

      error = null;
      try{ conn.end.lock(); }
      catch(e){ error = e; }
      assert(!!error);

      error = null;
      try{ conn.end.open(); }
      catch(e){ error = e; }
      assert(!!error);

      error = null;
      try{ conn.end.send('asd'); }
      catch(e){ error = e; }
      assert(!!error);
    });

  });

  t('Send messages',function(){
    var conn = new Connection(),
        sender = conn.lock(),
        msg,error;

    conn.end.on('message',function(m){
      msg = m;
    });

    conn.end.open();
    sender.send('foo');
    assert.strictEqual(msg,'foo');

    conn.end.send('bar');
    sender.detach();

    try{ sender.send('foo'); }
    catch(e){ error = e; }
    assert(!!error);
  });

  t('Bind and transfer',function*(){
    var c1 = new Connection(),
        c2 = new Connection(),
        c3 = new Connection();

    c1.open();
    c2.open();

    c1.end.transfer('foo','bar');
    c2.end.transfer('bar','foo');

    c1.end.bind(c3);
    c3.end.bind(c2.end);

    assert.strictEqual(c3.foo,'bar');
    assert.strictEqual(c3.end.bar,'foo');

    assert.strictEqual(c1.end.bar,'foo');
    assert.strictEqual(c2.end.foo,'bar');

    c1.end.transfer('lorem','ipsum');
    assert.strictEqual(c2.end.lorem,'ipsum');

    c1.send('foo');
    assert.strictEqual(yield c2.until('message'),'foo');
  });

  require('./connection/link.js');

});
