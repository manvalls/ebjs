var t = require('u-test'),
    assert = require('assert'),
    Resolver = require('y-resolver'),
    label = require('../../label.js'),
    utils = require('../connection/utils.js');

module.exports = function(ebjs){

  t('Yielded',function*(){
    var conns = yield utils.getPair(),
        c1 = conns[0],
        c2 = conns[1],
        yd,res,error;

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
  });

};
