# Extensible Binary JavaScript Serialization
[![Build Status][ci-img]][ci-url] [![Coverage Status][cover-img]][cover-url]

`ebjs` is an extensible and configurable serialization format with support for nearly as many different data types as numbers can be represented in JavaScript. It produces less bytes than JSON and can also serialize circular references.

## Overview

### Basic pack / unpack

```javascript
var ebjs = require('ebjs');

ebjs.pack( {foo: 'bar'} ).
  then( buffer => ebjs.unpack(buffer) ).
  then( data => console.log(data) /* { foo: 'bar' } */ );
```

Unlike most serialization libraries, `ebjs` works asynchronously, which means you can serialize almost everything, whether it can be accessed synchronously or not: both `ebjs.pack(data)` and `ebjs.unpack(buffer)` return a promise.

`ebjs.pack(data)` resolves to either a `Buffer` or an `Uint8Array` with serialized data. An internal buffer of 1kB will be used unless you specify your own one as the second argument of the call, again, either a `Buffer` or an `Uint8Array`. Use `ebjs.unpack(buffer)` to get back the original data.

### Adding new types

Each data type is assigned a *label*, a number which will be packed into the resulting binary stream. This number will thus identify the data type and should be unique in your whole application. You can use any number you like - except for zero.

A non-normative list of common labels can be found inside [definitions/labels.js](definitions/labels.js). You may want to take a look at it in order to avoid collisions with other libraries. If you want your own data type in that list feel free to file an issue and we'll discuss the label.

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

## Connections

`ebjs` was designed to be able to serialize anything, and that includes media streams, promises and the like. These types of data need a link between one point and the other in order to transparently transmit messages on the fly, and that's where `ebjs` connections are used.

We'll use a full example to show how connections work. What we've implemented here is an audio chat roulette service: each client establishes a call with a stranger with every page load. First let's set up a WebSocket server:

```javascript
var http = require('http'),
    getServer = require('ebjs/connection/server/ws'),
    Connection = require('ebjs/connection'),
    server = getServer(http.createServer().listen(8080));

server.walk(function*(){
  var client1,client2,conn;

  while(true){

    client1 = yield this.until('connection');
    client2 = yield this.until('connection');

    client1.open();
    client2.open();

    conn = new Connection();
    client1.send(conn);
    client2.send(conn.end);

  }

});
```

As you can see, you can send connections over connections. What this server does is establishing a connection between two consecutive clients. Now let's take a look at the clients:

```javascript
var getClient = require('ebjs/connection/ws'),
    client = getClient('ws://localhost:8888/');

client.open();
client.walk(function*(){
  var peer = yield this.until('message');

  peer.open();

  // Send the stream

  peer.send(
    navigator.mediaDevices.getUserMedia({audio: true})
  );

  // Receive the stream

  (yield peer.until('message')).then(function(stream){
    var audio = new Audio();

    audio.src = URL.createObjectURL(stream);
    audio.play();
  });

});
```

Did you see what we've done here? Each client sends to the other, using the connection sent from the server, a promise that will be resolved to the audio stream of the microphone. Internally `ebjs` uses WebRTC and some subconnection magic to link both peers and achieve above shown level of abstraction.

[ci-img]: https://circleci.com/gh/manvalls/ebjs.svg?style=shield
[ci-url]: https://circleci.com/gh/manvalls/ebjs
[cover-img]: https://coveralls.io/repos/manvalls/ebjs/badge.svg?branch=master&service=github
[cover-url]: https://coveralls.io/github/manvalls/ebjs?branch=master
