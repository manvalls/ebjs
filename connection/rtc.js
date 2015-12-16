/**/ 'use strict' /**/
var Connection = require('../connection.js'),
    label = require('../label.js'),
    labels = require('../definitions/labels.js'),
    bytes = Symbol(),
    connections = Symbol(),
    rtcConfig = Symbol();

class RTCConnection extends Connection{

  constructor(opt){
    super(opt);

    opt = opt || {};
    this[bytes] = opt.bytes;
    this[connections] = opt.connections;
    this[rtcConfig] = opt.rtcConfig;
  }

  get bytes(){ return this[bytes]; }
  get connections(){ return this[connections]; }
  get rtcConfig(){ return this[rtcConfig]; }

  get [label](){ return labels.RTCConnection; }

}

/*/ exports /*/

module.exports = RTCConnection;
