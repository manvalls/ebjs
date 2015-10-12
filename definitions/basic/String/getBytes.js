if(global.Buffer) module.exports = function(str){
  return new global.Buffer(str,'utf-8');
};
else if(global.TextEncoder) module.exports = function(str){
  return (new TextEncoder('utf-8')).encode(str);
};
else module.exports = function(str){
  var result = [],
      i,code,remaining;

  for(i = 0;i < str.length;i++){
    code = str.charCodeAt(i);

    if(code < 0x80){
      result.push(code);
      continue;
    }

    if(code < 0x800){
      result.push( ((code >> 6) & 0x3f) | 0xc0 );
      remaining = 1;
    }else if(code < 0x10000){
      result.push( ((code >> 12) & 0x1f) | 0xe0 );
      remaining = 2;
    }else if(code < 0x200000){
      result.push( ((code >> 18) & 0x0f) | 0xf0 );
      remaining = 3;
    }else if(code < 0x4000000){
      result.push( ((code >> 24) & 0x07) | 0xf8 );
      remaining = 5;
    }else{
      result.push( ((code >> 30) & 0x03) | 0xfc );
      remaining = 6;
    }

    do result.push( ((code >> ((remaining - 1) * 6)) & 0x7f) | 0x80 );
    while(--remaining);
  }

  return result;
};
