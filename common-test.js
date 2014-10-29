var test = require('vz.test'),
    walk = require('vz.walk'),
    Yarr = require('vz.yarr'),
    
    ebjs = require('./main'),
    assert = require('assert');

module.exports = function(array,deep){
  return walk(function*(){
    
    if(global.Buffer) yield test('Buffer',function*(){
      var data,result;
      
      for(var i = 0;i < array.length;i++){
        data = yield ebjs.pack(array[i],Buffer);
        result = yield ebjs.unpack(data);
        
        if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
        else if(deep) assert.deepEqual(result,array[i]);
        else assert.equal(result,array[i]);
      }
      
    });
    
    yield test('Uint8Array',function*(){
      var data,result;
      
      for(var i = 0;i < array.length;i++){
        data = yield ebjs.pack(array[i],Uint8Array);
        result = yield ebjs.unpack(data);
        
        if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
        else if(deep) assert.deepEqual(result,array[i]);
        else assert.equal(result,array[i]);
      }
      
    });
    
    if(global.Blob) yield test('Blob',function*(){
      var data,result;
      
      for(var i = 0;i < array.length;i++){
        data = yield ebjs.pack(array[i],Blob);
        result = yield ebjs.unpack(data);
        
        if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
        else if(deep) assert.deepEqual(result,array[i]);
        else assert.equal(result,array[i]);
      }
      
    });
    
    yield test('Yarr',function*(){
      
      if(global.Buffer) yield test('Buffer',function*(){
        var data = new Yarr(),result,yd;
        
        for(var i = 0;i < array.length;i++){
          yd = ebjs.pack(array[i],Buffer,data);
          result = yield ebjs.unpack(data);
          yield yd;
          
          if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
          else if(deep) assert.deepEqual(result,array[i]);
          else assert.equal(result,array[i]);
        }
        
      });
      
      yield test('Uint8Array',function*(){
        var data = new Yarr(),result,yd;
        
        for(var i = 0;i < array.length;i++){
          yd = ebjs.pack(array[i],Uint8Array,data);
          result = yield ebjs.unpack(data);
          yield yd;
          
          if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
          else if(deep) assert.deepEqual(result,array[i]);
          else assert.equal(result,array[i]);
        }
        
      });
      
      if(global.Blob) yield test('Blob',function*(){
        var data = new Yarr(),result,yd;
        
        for(var i = 0;i < array.length;i++){
          yd = ebjs.pack(array[i],Blob,data);
          result = yield ebjs.unpack(data);
          yield yd;
          
          if(isNaN(array[i])) assert(isNaN(result),'isNaN(' + result + ')');
          else if(deep) assert.deepEqual(result,array[i]);
          else assert.equal(result,array[i]);
        }
        
      });
      
    });
    
  });
};
