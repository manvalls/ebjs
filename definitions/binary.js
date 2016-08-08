var _ArrayBuffer = require('./binary/ArrayBuffer.js'),
    _TypedArray = require('./binary/TypedArray.js'),
    _Buffer = require('./binary/Buffer.js'),
    _Blob = require('./binary/Blob.js'),
    _File = require('./binary/File.js'),
    _FileList = require('./binary/FileList.js'),
    _RBlob = require('./binary/RBlob.js');

module.exports = function(ebjs){
  _ArrayBuffer(ebjs);
  _TypedArray(ebjs);
  _Buffer(ebjs);
  _Blob(ebjs);
  _File(ebjs);
  _FileList(ebjs);
  _RBlob(ebjs);
};
