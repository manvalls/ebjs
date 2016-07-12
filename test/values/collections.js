var t = require('u-test'),
    assert = require('assert');

module.exports = function(ebjs){

  function transform(data){
    return ebjs.unpack(ebjs.pack(data).value).value;
  }

  t('Map',function(){
    var m1 = new Map(),
        m2,i;

    for(i = 0;i < 100;i++) m1.set(Math.random(),Math.random());
    m2 = transform(m1);
    assert.deepEqual(Array.from(m1),Array.from(m2));

  });

  t('Set',function(){
    var s1 = new Set(),
        s2,i;

    for(i = 0;i < 100;i++) s1.add(Math.random());
    s2 = transform(s1);
    assert.deepEqual(Array.from(s1),Array.from(s2));

  });

};
