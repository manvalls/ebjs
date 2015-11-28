var t = require('u-test'),
    assert = require('assert'),
    Connection = require('../connection'),
    label = require('../label.js');

t('Connection - ' + (global.navigator ? 'browser' : 'node.js'),function*(){
  var conn = new Connection(),
      msg;

  t('Send and receive message',function(){

    t('to end',function(){
      assert.strictEqual(conn[label],8);
      conn.send('foo');
      conn.end.on('message',function(m){
        msg = m;
      });
      assert.strictEqual(msg,'foo');
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
          wrong;

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
    });

  });

  t('"send" event',function(){

    t('Silent',function(){
      var conn = new Connection(),
          msg = null;

      conn.once('send',function(m){
        msg = m;
      });

      conn.send('foo',true);
      assert.strictEqual(msg,null);
    });

    t('Not silent',function*(){
      var conn = new Connection(),
          msg = null;

      conn.once('send',function(m){
        msg = m;
      });

      conn.send('foo');
      assert.strictEqual(msg,'foo');
    });

  });

  require('./connection/link.js');

});
