var ebjs = require('../../main.js'),
    t = require('u-test'),
    assert = require('assert'),
    s = Symbol(),
    child,desc;

desc = 'Values - ';
if(global.navigator) desc += 'browser';
else if(global.Buffer) desc += 'node.js with buffers';
else desc += 'node.js without buffers';

t(desc,function(){
  require('./basic.js')(ebjs);
  require('./extra.js')(ebjs);
  require('./binary.js')(ebjs);
  require('./rtc.js')(ebjs);
  require('./y.js')(ebjs);

  child = ebjs.getChild();
  child.setConstant(4e3,NaN);
  child.setConstant(5e3,s);
  assert.strictEqual(child.unpack(child.pack(s).value).value,s);

  t('Child',function(){
    require('./basic.js')(child);
  });
});
