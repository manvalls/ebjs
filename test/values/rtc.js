var t = require('u-test'),
    assert = require('assert'),
    label = require('../../label.js'),
    labels = require('../../definitions/labels.js'),
    utils = require('../connection/utils.js'),
    rtcUtils = require('../../definitions/rtc/utils.js'),
    Connection = require('../../connection.js');

module.exports = function(ebjs){

  if(global.AudioContext) t('MediaStream - normal',function*(){

    t('No config',function*(){
      var pair = yield utils.getPair(),
          ctx = new AudioContext(),
          osc = ctx.createOscillator(),
          st = ctx.createMediaStreamDestination(),
          stream;

      osc.connect(st);
      pair[0].open();
      pair[1].open();

      pair[0].send(st.stream);
      stream = yield pair[1].until('message');
      assert.strictEqual(stream.getTracks().length,1);
    });

    t('rtcConfig present',function*(){
      var pair = yield utils.getPair(),
          ctx = new AudioContext(),
          osc = ctx.createOscillator(),
          st = ctx.createMediaStreamDestination(),
          stream;

      osc.connect(st);
      pair[0].open();
      pair[1].open();

      st.stream.rtcConfig = {iceServers: []};
      pair[0].send(st.stream);
      stream = yield pair[1].until('message');
      assert.strictEqual(stream.getTracks().length,1);
      assert.deepEqual(stream.rtcConfig,st.stream.rtcConfig);
    });

  });

  if(!rtcUtils.MediaStream) t('MediaStream - bridge',function*(){

    t('No config',function*(){
      var stream = {
            connection: new Connection(),
            [label]: labels.MediaStream
          },
          conns = yield utils.getPair(),
          msg;

      conns[0].open();
      conns[1].open();

      conns[0].send(stream);
      msg = yield conns[1].until('message');

      msg.connection.open();
      stream.connection.end.open();
      msg.connection.send('foo');
      assert.strictEqual(yield stream.connection.end.until('message'),'foo');
    });

    t('rtcConfig present',function*(){
      var stream = {
            connection: new Connection(),
            rtcConfig: {iceServers: []},
            [label]: labels.MediaStream
          },
          conns = yield utils.getPair(),
          msg;

      conns[0].open();
      conns[1].open();

      conns[0].send(stream);
      msg = yield conns[1].until('message');

      msg.connection.open();
      stream.connection.end.open();
      msg.connection.send('foo');
      assert.strictEqual(yield stream.connection.end.until('message'),'foo');
      assert.deepEqual(stream.rtcConfig,msg.rtcConfig);
    });

  });

};
