var ab = new ArrayBuffer(8),

    ui8 = new Uint8Array(ab),
    ui16 = new Uint16Array(ab),
    ui32 = new Uint32Array(ab),

    i8 = new Int8Array(ab),
    i16 = new Int16Array(ab),
    i32 = new Int32Array(ab),

    f32 = new Float32Array(ab),
    f64 = new Float64Array(ab);

// is

exports.isUi8 = function(n){
  ui8[0] = n;
  return ui8[0] === n;
};

exports.isUi16 = function(n){
  ui16[0] = n;
  return ui16[0] === n;
};

exports.isUi32 = function(n){
  ui32[0] = n;
  return ui32[0] === n;
};



exports.isI8 = function(n){
  i8[0] = n;
  return i8[0] === n;
};

exports.isI16 = function(n){
  i16[0] = n;
  return i16[0] === n;
};

exports.isI32 = function(n){
  i32[0] = n;
  return i32[0] === n;
};



exports.isF32 = function(n){
  f32[0] = n;
  return f32[0] === n || isNaN(f32[0]) && isNaN(n);
};

exports.isF64 = function(n){
  f64[0] = n;
  return f64[0] === n || isNaN(f64[0]) && isNaN(n);
};



// pack

exports.packUi8 = function(n,buffer){
  ui8[0] = n;
  return new Uint8Array(ab.slice(0,1));
};

exports.packUi16 = function(n,buffer){
  ui16[0] = n;
  return new Uint8Array(ab.slice(0,2));
};

exports.packUi32 = function(n,buffer){
  ui32[0] = n;
  return new Uint8Array(ab.slice(0,4));
};



exports.packI8 = function(n,buffer){
  i8[0] = n;
  return new Uint8Array(ab.slice(0,1));
};

exports.packI16 = function(n,buffer){
  i16[0] = n;
  return new Uint8Array(ab.slice(0,2));
};

exports.packI32 = function(n,buffer){
  i32[0] = n;
  return new Uint8Array(ab.slice(0,4));
};



exports.packF32 = function(n,buffer){
  f32[0] = n;
  return new Uint8Array(ab.slice(0,4));
};

exports.packF64 = function(n,buffer){
  f64[0] = n;
  return new Uint8Array(ab.slice(0,8));
};



// unpack

exports.unpackUi8 = function(array){
  ui8.set(array);
  return ui8[0];
};

exports.unpackUi16 = function(array){
  ui8.set(array);
  return ui16[0];
};

exports.unpackUi32 = function(array){
  ui8.set(array);
  return ui32[0];
};



exports.unpackI8 = function(array){
  ui8.set(array);
  return i8[0];
};

exports.unpackI16 = function(array){
  ui8.set(array);
  return i16[0];
};

exports.unpackI32 = function(array){
  ui8.set(array);
  return i32[0];
};



exports.unpackF32 = function(array){
  ui8.set(array);
  return f32[0];
};

exports.unpackF64 = function(array){
  ui8.set(array);
  return f64[0];
};
