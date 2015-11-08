var _ArrayBuffer = require('./binary/ArrayBuffer.js'),
    _TypedArray = require('./binary/TypedArray.js'),
    _Buffer = require('./binary/Buffer.js'),
    _Blob = require('./binary/Blob.js'),
    _File = require('./binary/File.js');

module.exports = function(ebjs){
  _ArrayBuffer(ebjs);
  _TypedArray(ebjs);
  _Buffer(ebjs);
  _Blob(ebjs);
  _File(ebjs);
};
