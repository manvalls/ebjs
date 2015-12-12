/**/ 'use strict' /**/
var Connection = require('../connection.js'),
    label = require('../label.js'),
    labels = require('../definitions/labels.js'),
    bytes = Symbol(),
    connections = Symbol(),
    RTCConfig = Symbol();

class RTCConnection extends Connection{

  constructor(opt){
    super(opt);

    opt = opt || {};
    this[bytes] = opt.bytes;
    this[connections] = opt.connections;
    this[RTCConfig] = opt.RTCConfig;
  }

  get bytes(){ return this[bytes]; }
  get connections(){ return this[connections]; }
  get RTCConfig(){ return this[RTCConfig]; }

  get [label](){ return labels.RTCConnection; }

}

/*/ exports /*/

module.exports = RTCConnection;
