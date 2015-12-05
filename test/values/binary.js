var t = require('u-test'),
    assert = require('assert'),
    walk = require('y-walk'),
    Resolver = require('y-resolver'),
    label = require('../../label.js'),
    labels = require('../../definitions/labels.js');

function read(blob){
  var fr = new FileReader(),
      res = new Resolver();

  fr.onload = function(){
    res.accept(this.result);
  };

  fr.readAsText(blob);
  return res.yielded;
}

module.exports = function(ebjs){
  var transform = walk.wrap(function*(data){
    return yield ebjs.unpack(yield ebjs.pack(data));
  });

  t('ArrayBuffer',function*(){
    var ab = yield transform(new ArrayBuffer(5));

    assert.strictEqual(ab.byteLength,5);
    ab = yield transform({
      [label]: labels.ArrayBuffer
    });

    assert.strictEqual(ab.byteLength,0);
  });

  t('TypedArray',function*(){
    var ui8 = new Uint8Array([1,2,3]),
        result = yield transform(ui8);

    assert.deepEqual(result,[1,2,3]);
    assert.strictEqual(ui8.constructor,result.constructor);

    result = yield transform({
      [label]: labels.Uint8Array
    });

    assert.deepEqual(result,[]);
    assert.strictEqual(ui8.constructor,result.constructor);
  });

  if(global.Buffer) t('Buffer',function*(){
    var buff = new global.Buffer([1,2,3]),
        result = yield transform(buff);

    assert.deepEqual(result,[1,2,3]);
    assert.strictEqual(buff.constructor,buff.constructor);

    result = yield transform({
      [label]: labels.Buffer
    });

    assert.deepEqual(result,[]);
    assert.strictEqual(buff.constructor,buff.constructor);
  });

  else t('Buffer',function*(){
    var result = yield ebjs.unpack(new Uint8Array([ 31, 3, 1, 2, 3 ]));
    assert.deepEqual(result,[1,2,3]);
    assert.deepEqual(yield transform({[label]: labels.Buffer}),{[label]: labels.Buffer});
  });

  if(global.Blob) t('Blob',function*(){
    var result = yield transform({[label]: labels.Blob});

    assert.strictEqual(result.constructor,Blob);
    assert.strictEqual(yield read(result),'');
  });

  if(global.File) t('File',function*(){
    var file = new File(['foo bar'],'filename',{type: 'type',lastModified: 42}),
        result = yield transform(file);

    assert.strictEqual(result.type,'type');
    assert.strictEqual(result.name,'filename');
    assert.strictEqual(result.lastModified,42);
    assert.strictEqual(yield read(result),'foo bar');

    file = new File([],'filename',{type: 'type',lastModified: 74});
    if(file.close) file.close();
    else file.isClosed = true;

    result = yield transform(file);
    assert.strictEqual(result.type,'type');
    assert.strictEqual(result.name,'filename');
    assert.strictEqual(result.lastModified,74);
    assert.strictEqual(result.isClosed,true);

    result = yield transform({[label]: labels.File});
    assert.strictEqual(result.constructor,File);
    assert.strictEqual(result.type,'');
    assert.strictEqual(result.name,'');
  });

  else if(global.Buffer) t('File',function*(){
    var result = yield ebjs.unpack(new Uint8Array(
      [33,8,102,105,108,101,110,97,109,101,42,4,116,121,112,101,0,7,102,111,111,32,98,97,114]
    ));

    assert.strictEqual(result.type,'type');
    assert.strictEqual(result.name,'filename');
    assert.strictEqual(result.lastModified,42);
    assert.strictEqual(result.toString(),'foo bar');

    result = yield ebjs.unpack(new Uint8Array(
      [33,8,102,105,108,101,110,97,109,101,74,4,116,121,112,101,1]
    ));

    assert.strictEqual(result.type,'type');
    assert.strictEqual(result.name,'filename');
    assert.strictEqual(result.lastModified,74);
    assert.strictEqual(result.isClosed,true);
  });

  if(global.FileList) t('FileList',function*(){
    var fl = Object.create(FileList.prototype,{length: {value: 2}}),
        result;

    fl[0] = new File(['foo'],'');
    fl[1] = new File(['bar'],'');

    result = yield transform(fl);
    assert.strictEqual(result.length,2);
    assert.strictEqual(yield read(result[0]),'foo');
    assert.strictEqual(yield read(result[1]),'bar');

    result = yield transform({[label]: labels.FileList});
    assert.strictEqual(result.length,0);
  });

  else if(global.Buffer)t('FileList',function*(){
    var result = yield ebjs.unpack(new Uint8Array(
      [34,2,0,248,0,208,155,181,215,15,117,66,0,0,3,102,111,111,0,248,0,208,155,181,215,15,117,66,0,0,3,98,97,114]
    ));

    assert.strictEqual(result.length,2);
    assert.strictEqual(result[0].toString(),'foo');
    assert.strictEqual(result[1].toString(),'bar');
  });

};
