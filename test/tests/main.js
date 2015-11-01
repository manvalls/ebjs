var ebjs = require('../../main.js'),
    t = require('u-test'),
    assert = require('assert'),
    s = Symbol(),
    child;

if(global.navigator) delete global.Buffer;

t(global.navigator ? 'browser' : 'node.js',function(){
  require('./basic.js')(ebjs);
  require('./extra.js')(ebjs);

  child = ebjs.getChild();
  child.setConstant(4e3,NaN);
  child.setConstant(5e3,s);
  assert.strictEqual(child.unpack(child.pack(s).value).value,s);

  require('./basic.js')(child);
  require('./extra.js')(child);
});
