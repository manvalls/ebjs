var t = require('u-test'),
    assert = require('assert'),
    Resolver = require('y-resolver'),
    Setter = require('y-setter'),
    Emitter = require('y-emitter'),
    label = require('../../label.js'),
    utils = require('../connection/utils.js'),
    wait = require('y-timers/wait'),
    Lock = require('y-lock');

module.exports = function(ebjs){

  t('Yielded',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        yd,res,res2,error;

    c1.open();
    c2.open();

    c1.send(Resolver.accept('foo'));
    yd = yield c2.until('message');
    assert(yd.done);
    assert.strictEqual(yield yd,'foo');

    res = new Resolver();
    c2.send(res.yielded);
    yd = yield c1.until('message');
    assert(!yd.done);
    res.accept('bar');
    assert.strictEqual(yield yd,'bar');

    c2.send(Resolver.reject('foo',true));
    yd = yield c1.until('message');
    assert(yd.done);

    error = null;
    try{ yield yd; }
    catch(e){ error = e; }
    assert.strictEqual(error,'foo');

    res = new Resolver();
    c2.send(res.yielded);
    yd = yield c1.until('message');
    assert(!yd.done);

    res.reject('bar',true);
    error = null;
    try{ yield yd; }
    catch(e){ error = e; }
    assert.strictEqual(error,'bar');

    res = new Resolver();
    c2.send(res.yielded);
    yd = yield c1.until('message');
    res.accept(wait(1000));
    yd = yield yd;
    yield yd;
  });

  t('Resolver',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        res,rr,error1,error2;

    c1.open();
    c2.open();

    res = new Resolver();
    c1.send(res);
    rr = yield c2.until('message');
    rr.accept('foo');
    assert.strictEqual(yield rr.yielded,yield res.yielded);
    assert.strictEqual(yield rr.yielded,'foo');

    res = new Resolver();
    c1.send(res);
    rr = yield c2.until('message');
    res.accept('bar');
    rr.accept('foo');
    assert.strictEqual(yield rr.yielded,yield res.yielded);
    assert.strictEqual(yield rr.yielded,'bar');

    res = new Resolver();
    c1.send(res);
    rr = yield c2.until('message');
    rr.reject('foo',true);

    error1 = error2 = null;
    try{ yield rr.yielded; }
    catch(e){ error1 = e; }
    try{ yield res.yielded; }
    catch(e){ error2 = e; }

    assert.strictEqual(error1,error2);
    assert.strictEqual(error1,'foo');

    res = new Resolver();
    c1.send(res);
    rr = yield c2.until('message');
    res.reject('bar',true);
    rr.reject('foo',true);

    error1 = error2 = null;
    try{ yield rr.yielded; }
    catch(e){ error1 = e; }
    try{ yield res.yielded; }
    catch(e){ error2 = e; }

    assert.strictEqual(error1,error2);
    assert.strictEqual(error1,'bar');
  });

  t('HybridYielded',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        h1 = new Resolver.Hybrid(),
        h2;

    c1.open();
    c2.open();

    c1.send(h1);
    h2 = yield c2.until('message');

    h2.accept('foo');
    assert.strictEqual(yield h1,yield h2);
    assert.strictEqual(yield h1,'foo');

  });

  t('Getter',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        setter = new Setter(),
        getter;

    c1.open();
    c2.open();

    c1.send(setter.getter);
    getter = yield c2.until('message');
    assert.strictEqual(getter.value,undefined);

    setter.value = 'foo';
    try{ assert.strictEqual(getter.value,'foo'); }
    catch(e){
      yield getter.touched();
      assert.strictEqual(getter.value,'foo');
    }

    setter.value = 'foo bar';
    try{ assert.strictEqual(getter.value,'foo bar'); }
    catch(e){
      yield getter.touched();
      assert.strictEqual(getter.value,'foo bar');
    }

    setter.freeze();
    yield getter.frozen();

    setter = new Setter();
    c1.send(setter.getter);
    getter = yield c2.until('message');

    c1.detach();
    yield getter.frozen();
  });

  t('Setter',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        setter1 = new Setter(5),
        setter2,i;

    c1.open();
    c2.open();

    c1.send(setter1);
    setter2 = yield c2.until('message');
    assert.strictEqual(setter2.value,setter1.value);

    setter1.value = 'foo';
    yield setter2.getter.is('foo');

    setter2.value = 'bar';
    yield [
      setter1.getter.is('bar'),
      setter2.getter.is('bar')
    ];

    setter2.value = 'barr';
    yield [
      setter1.getter.is('barr'),
      setter2.getter.is('barr')
    ];

    for(i = 0;i < 100;i++) setter2.value = i;
    yield [
      setter1.getter.is(i - 1),
      setter2.getter.is(i - 1)
    ];

    c1.detach();
    yield setter2.getter.frozen();

    conns = yield utils.getPair();
    c1 = conns[0];
    c2 = conns[1];
    c1.open();
    c2.open();

    c2.send(setter2);
    setter2 = yield c1.until('message');

    for(i = 0;i < 100;i++) setter2.value = i;
    yield [
      setter1.getter.is(i - 1),
      setter2.getter.is(i - 1)
    ];

    setter2.freeze();
    yield setter1.getter.frozen();
  });

  t('HybridGetter',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        h1 = new Setter.Hybrid(),
        h2;

    c1.open();
    c2.open();

    c1.send(h1);
    h2 = yield c2.until('message');

    h1.value = 'foo';
    yield [
      h2.is('foo'),
      h1.is('foo')
    ];

    h1.value = 'bar';
    yield [
      h2.is('bar'),
      h1.is('bar')
    ];

    h1.freeze();
    yield [
      h1.frozen(),
      h2.frozen()
    ];

  });

  t('Target',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        emitter = new Emitter(),
        target1 = emitter.target,
        target2,yd;

    c1.open();
    c2.open();

    c1.send(target1);
    target2 = yield c2.until('message');

    emitter.set('ready');
    yield target2.until('ready');

    emitter.queue('event','foo');
    assert.strictEqual(yield target2.until('event'),'foo');
    emitter.unset('ready');
    yield target2.untilNot('ready');

    c1.detach();
  });

  t('Emitter',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        emitter1 = new Emitter(),
        emitter2,yd;

    c1.open();
    c2.open();

    c1.send(emitter1);
    emitter2 = yield c2.until('message');

    emitter1.set('ready');
    yield emitter2.target.until('ready');

    emitter2.queue('event','foo');
    assert.strictEqual(yield emitter1.target.until('event'),'foo');
    emitter2.unset('ready');
    yield emitter1.target.untilNot('ready');
    yield emitter2.target.untilNot('ready');

    c1.detach();
  });

  t('HybridTarget',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        h1 = new Emitter.Hybrid(),
        h2,yd;

    c1.open();
    c2.open();

    c1.send(h1);
    h2 = yield c2.until('message');

    h1.set('ready');
    yield h1.until('ready');
    h2.unset('ready');

    yield h1.untilNot('ready');
    yield h2.untilNot('ready');

    h2.set('ready');
    yield h2.until('ready');
    h1.unset('ready');

    yield h1.untilNot('ready');
    yield h2.untilNot('ready');

    h1.set('ready');
    yield h2.until('ready');
    h1.unset('ready');

    yield h1.untilNot('ready');
    yield h2.untilNot('ready');

    h2.set('ready');
    yield h1.until('ready');
    yield h2.until('ready');
    h2.unset('ready');

    yield h1.untilNot('ready');
    yield h2.untilNot('ready');

    yd = h2.until('foo');
    h1.queue('foo','bar');
    assert.strictEqual(yield yd,'bar');

    yd = h1.until('foo');
    h1.queue('foo','bar');
    assert.strictEqual(yield yd,'bar');

    yd = h2.until('foo');
    h2.queue('foo','bar');
    assert.strictEqual(yield yd,'bar');

    yd = h1.until('foo');
    h2.queue('foo','bar');
    assert.strictEqual(yield yd,'bar');
  });

  t('Lock',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        lock1 = new Lock(),
        lock2;

    c1.open();
    c2.open();

    c1.send(lock1);
    lock2 = yield c2.until('message');

    yield lock2.take();
    lock2.give(2);
    yield lock2.take(2);
    lock1.give();
    yield lock2.take();
    lock2.give();
    yield lock1.take();
  });

};
