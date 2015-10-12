# Extensible Binary JavaScript Serialization [![Build Status][travis-img]][travis-url] [![Coverage Status][cover-img]][cover-url]

`ebjs` is an extensible and configurable serialization format with support for nearly as many different data types as numbers can be represented in JavaScript. It produces less bytes than JSON and can also serialize circular references.

## Basic pack / unpack

```javascript
var ebjs = require('ebjs');

ebjs.pack( {foo: 'bar'} ).
  then( buffer => ebjs.unpack(buffer) ).
  then( data => console.log(data) /* { foo: 'bar' } */ );
```

Unlike most serialization libraries, `ebjs` works asynchronously, which means you can serialize almost everything, whether it can be accessed synchronously or not: both `ebjs.pack(data)` and `ebjs.unpack(buffer)` return a promise.

`ebjs.pack(data)` resolves to either a `Buffer` or an `Uint8Array` with serialized data. An internal buffer of 1kB will be used unless you specify your own one as the second argument of the call, again, either a `Buffer` or an `Uint8Array`. Use `ebjs.unpack(buffer)` to get back the original data.

## Adding new types

Each data type is assigned a *label*, a number which will be packed into the resulting binary stream. This number will thus identify the data type and should be unique in your whole application. You can use any number you like - except for zero - but be warned that the first thousand labels should be considered reserved and will be assigned inside [definitions/labels.js](definitions/labels.js).

That being said, there are two kinds of definitions. The firsts and easiest ones are constants:

```
var someSymbol = Symbol();

ebjs.setConstant(1001,someSymbol);
```

That's it, you can now transmit `someSymbol`. Isn't it cool? Next we'll take a look at *packers* and *unpackers*. Suppose you want to serialize the following class:

```javascript
var label = require('ebjs/label');

class Person{

  constructor(name,birthdate,gender){
    this.name = name;
    this.birthdate = new Date(birthdate);
    this.isWoman = gender == 'woman';
  }

  get [label](){ return 1005; }
}
```

Here we have a `String`, a `Date` and a `Boolean`. Let's define it:

```javascript
var ebjs = require('ebjs');

ebjs.setPacker(Person,function*(buffer,data){
  yield buffer.pack(data.name, String);
  yield buffer.pack(data.birthdate, Date);
  yield buffer.pack(data.isWoman, Boolean);
});

ebjs.setUnpacker(Person,function*(buffer){
  var name = yield buffer.unpack(String),
      birthdate = yield buffer.unpack(Date),
      isWoman = yield buffer.unpack(Boolean);

  return new Person(name,birthdate,isWoman ? 'woman' : 'man');
});
```

That's it! Now you can transmit `Person` instances. You can see more examples under the [definitions](definitions) folder.

[travis-img]: https://travis-ci.org/manvalls/ebjs.svg?branch=master
[travis-url]: https://travis-ci.org/manvalls/ebjs
[cover-img]: https://coveralls.io/repos/manvalls/ebjs/badge.svg?branch=master&service=github
[cover-url]: https://coveralls.io/github/manvalls/ebjs?branch=master
