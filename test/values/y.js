var t = require('u-test'),
    assert = require('assert'),
    Resolver = require('y-resolver'),
    Setter = require('y-setter'),
    label = require('../../label.js'),
    utils = require('../connection/utils.js'),
    wait = require('y-timers/wait');

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

    c2.send(Resolver.reject('foo'));
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

    res.reject('bar');
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
    rr.reject('foo');

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
    res.reject('bar');
    rr.reject('foo');

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
  });

  t('Setter',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        setter1 = new Setter(5),
        setter2;

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

    setter2.freeze();
    yield setter1.getter.frozen();
  });

};
