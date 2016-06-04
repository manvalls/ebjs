/**/ 'use strict' /**/
var Connection = require('../connection.js'),
    label = require('../label.js'),
    labels = require('../definitions/labels.js'),
    bytes = Symbol(),
    connections = Symbol(),
    chunkSize = Symbol(),
    rtcConfig = Symbol();

class RTCConnection extends Connection{

  constructor(opt){
    super(opt);

    opt = opt || {};
    this[bytes] = opt.bytes;
    this[connections] = opt.connections;
    this[chunkSize] = opt.chunkSize;
    this[rtcConfig] = opt.rtcConfig;

    if(this[bytes]) this[chunkSize] = Math.min(
      this[chunkSize] || Infinity,
      this[bytes]
    );

    this[chunkSize] = this[chunkSize] || 15e3;

  }

  get bytes(){ return this[bytes]; }
  get connections(){ return this[connections]; }
  get chunkSize(){ return this[chunkSize]; }
  get rtcConfig(){ return this[rtcConfig]; }

  get [label](){ return labels.RTCConnection; }

}

/*/ exports /*/

module.exports = RTCConnection;
