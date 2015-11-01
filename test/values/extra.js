var t = require('u-test'),
    assert = require('assert');

module.exports = function(ebjs){

  function transform(data){
    return ebjs.unpack(ebjs.pack(data).value).value;
  }

  function testValues(values){

    for(v of values){
      assert.deepEqual(transform(v),v);
      if(typeof v == 'number') assert.deepEqual(transform(-v),-v);
    }

  }

  function testErrors(errors){
    var result;

    for(e of errors){
      result = transform(e);
      assert.strictEqual(result.constructor,e.constructor);
      assert.strictEqual(result.message,e.message);
      assert.strictEqual(result.name,e.name);
    }

  }

  t('Date',function(){
    testValues([new Date(),new Date(0),new Date(-5),new Date(50),new Date(-4e10)]);
  });

  t('RegExp',function(){
    testValues([/foo/i,/foo/m,/bar/,/bar?/g,/foo\/bar/gi]);
  });

  t('Error',function(){
    testErrors([new Error('asd'),new SyntaxError('foo'),new TypeError('bar')]);
  });

};
