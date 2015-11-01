var t = require('u-test'),
    assert = require('assert');

module.exports = function(ebjs){

  function transform(data){
    return ebjs.unpack(ebjs.pack(data).value).value;
  }

  function testValues(values){

    for(v of values){
      assert.deepEqual(transform(v),v);
      if(typeof v == 'number') assert.deepEqual(transform(-v),-v);
    }

  }

  t('Number',function(){
    testValues([0,1,100,200,250,300,400,500,5e3,70e3,2e10,Math.random(),Date.now(),1e15,Infinity,1e90]);
    assert(isNaN(transform(NaN)));
  });

  t('Boolean',function(){
    testValues([true,false]);
  });

  t('String',function(){
    testValues(['Hi!','ñandú','😀 😁 😂 😃 😄 😅 😆 😇 😈 👿 😉 😊 ☺️ 😋 😌 😍 😎 😏 😐 😑 😒 😓 😔 😕 😖 😗 😘 😙 😚 😛 😜 😝 😞 😟 😠 😡 😢 😣 😤 😥 😦 😧 😨 😩 😪 😫 😬 😭 😮 😯 😰 😱 😲 😳 😴 😵 😶 😷 🙁 🙂 😸 😹 😺 😻 😼 😽 😾 😿 🙀 👣','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat purus vitae dui mollis pulvinar. Donec elementum odio vitae lectus malesuada, eu fringilla ipsum efficitur. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam a rhoncus quam, a fringilla tellus. Fusce in velit a est venenatis faucibus. Duis vitae libero quis purus ornare blandit sed eu quam. Sed a porta nibh. Pellentesque a euismod risus, sit amet laoreet turpis. Phasellus vitae vestibulum elit. Quisque ut condimentum libero. Phasellus tincidunt sapien a justo hendrerit, a blandit nisl volutpat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Curabitur maximus diam eu lorem mollis condimentum.Donec cursus convallis odio at finibus. Phasellus a congue sem. Pellentesque sit amet lacus lorem. Suspendisse potenti. Nullam facilisis tempor enim id placerat. Aliquam erat volutpat. Suspendisse potenti. Sed vel justo vel dolor vulputate tempus non nec turpis. Maecenas hendrerit rutrum ex, in cursus augue dictum id. Praesent scelerisque urna ut justo volutpat mattis quis vel nibh. Donec tempor finibus tortor, nec bibendum neque lacinia vel. Nunc ultricies lectus lacus, at ultricies nulla condimentum nec. Maecenas cursus nibh vitae tristique consectetur. Nam id neque sagittis, mollis justo id, facilisis risus. Quisque vestibulum ex vitae ex tempus iaculis. Vestibulum volutpat hendrerit nisi non porttitor.Donec at arcu orci. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis interdum ligula ligula, ut vestibulum tellus ultricies ac. Nulla tempus ornare suscipit. Integer elementum et neque non luctus. Aliquam sed augue lobortis, facilisis ligula sed, tristique orci. Phasellus at volutpat augue, in accumsan lorem. Etiam nisi ipsum, pretium a dictum ac, suscipit vel velit. Curabitur sollicitudin sollicitudin eros, non placerat massa ultricies sit amet. Fusce quis convallis risus, sit amet dictum nulla. Etiam posuere non sem in convallis. Fusce sit amet diam euismod, ultrices ipsum eget, gravida tellus.Nullam vitae tincidunt metus. Maecenas sed neque tellus. Pellentesque augue diam, vestibulum eu diam nec, pellentesque aliquam nisl. Nullam commodo cursus orci a tempor. Proin finibus dictum metus quis blandit. Phasellus hendrerit metus non orci gravida blandit. Praesent consectetur consectetur molestie.Ut vel ante elit. Vivamus finibus hendrerit ornare. Maecenas pulvinar pretium tincidunt. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi ante ex, fermentum id euismod ultrices, molestie quis urna. Fusce augue orci, congue id neque at, egestas accumsan nisl. Donec condimentum sed metus sed aliquet. Mauris quis metus et odio dapibus aliquet sed ut orci. Nulla ornare consectetur egestas. Cras commodo nulla hendrerit ipsum congue, in mattis nulla mattis. Aliquam vulputate malesuada ex eget tempor. Duis tristique sem dolor, nec mollis neque commodo in. Quisque diam urna, sagittis nec sagittis id, finibus sed orci. Donec pharetra at risus at interdum. In semper eget urna eu imperdiet.Mauris ultricies arcu nulla. Curabitur ut massa dolor. Nunc at tortor sed dolor tincidunt sodales. Nulla ut nisl nec justo rutrum ultricies a varius magna. Sed massa ligula, placerat eget tempor vel, porta a justo. Suspendisse potenti. Cras in ultrices velit. Aliquam erat volutpat. Phasellus volutpat metus libero. Sed dictum pellentesque dolor, laoreet ultrices odio imperdiet a. Nam in venenatis urna, imperdiet tincidunt lectus. Nullam id hendrerit risus.Ut bibendum eros arcu, sit amet convallis mauris tempus at. Donec a urna id tortor faucibus ullamcorper vel varius neque. Duis hendrerit sem est, eu blandit nisi ornare vitae. Duis ac vulputate lorem. Phasellus sapien est, eleifend ac elementum vel, scelerisque vitae leo. Proin efficitur porta iaculis. Pellentesque non auctor quam, eget suscipit lorem. Donec ac convallis eros. Suspendisse potenti nullam.']);
  });

  t('Object',function(){
    var obj = {},
        result,t1,t2;

    obj.selfref = obj;
    result = transform(obj);
    assert.equal(result.selfref,result);

    t1 = {};
    t2 = {};
    t1.t2 = t2;
    t2.t1 = t1;

    obj = {
      t1: t1,
      t2: t2
    };

    result = transform(obj);
    assert.equal(result.t2.t1,result.t1);
    assert.equal(result.t1.t2,result.t2);

    testValues([{foo: 'bar'},{foo: {bar: 'bar',bez: 'bez',n: 5,arr: [1,2,3]}}]);
  });

  t('Array',function(){
    var arr = [],
        result;

    arr.push(arr);
    result = transform(arr);
    assert.equal(result[0],result);

    testValues([1,2,3],[{foo: 'bar'},null,'null',undefined,NaN],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
  });

  t('null',function(){
    testValues([null]);
  });

  t('undefined',function(){
    testValues([undefined]);
  });

};
