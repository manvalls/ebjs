# Extensible binary javascript serialization

[![NPM](https://nodei.co/npm/ebjs.png?downloads=true)](https://nodei.co/npm/ebjs/)

No piece of software is ever completed, feel free to contribute and be humble

## Description

This package is a tool which helps you define how your data is stored and transmitted based on javascript constructors. **It itself does not contain any definitions**. In order to use it you must at least define the *Number* type, you may get started by including basic definitions from [ebjs.basic](https://www.npmjs.org/package/ebjs.basic "ebjs.basic").

## Packing and unpacking

Once you've included definitions for the types you want, you can simply use *ebjs.pack* and *ebjs.unpack*:

```javascript
var ebjs = require('ebjs');
require('ebjs.basic');

ebjs.pack({foo: 'bar'},function(buffer){
  ebjs.unpack(buffer,function(data){
    console.log(data); // {foo: 'bar'}
  });
});
```

## Defining new types

Types are identified by an unsigned integer called *label*. Every type you define has an associated label, either declared by you or implicitly assigned by the library. You may use any label you want for your definitions, but for interoperability's sake labels from 0 to 100 are to be considered reserved. Its intended usage is as follows, and will be updated when new ones are assigned:

- \[0\] Circular references
- \[1-10\] *basic* group ([ebjs.basic](https://www.npmjs.org/package/ebjs.basic "ebjs.basic"))

When defining a new type you may omit the label, but it's highly discouraged, and if you do, make sure to include all labeled definitions before the unlabeled ones, as unlabeled definitions will be assigned the next free label. This being said, there are two different ways of defining a new type: the sync, high level one, and the low level one.

### High level definitions

These definitions are constructed in a synchronous way on top of other ones previously defined. As an example, take the following type:

```javascript
function Person(name,gender,age){
  this.name = name + '';
  this.gender = gender + '';
  this.age = parseInt(age);
}
```

Here, the *Person* type includes three properties: *name*, a *String*; *gender*, either 'male' or 'female', and *age*, a *Number*. We could define it in the following way:

```javascript
var ebjs = require('ebjs');

ebjs.define(Person,200,[String,Number,Number],function packer(person){
  return [
    person.name,
    person.gender == 'male'?0:1,
    person.age
  ];
},function unpacker(name,gender,age){
  return new Person(name,gender?'female':'male',age);
});
```

With this definition, when calling *ebjs.pack* on a *Person* object, we will obtain a binary buffer with the label (200) packed as a *Number*, followed by the name packed as a *String* and the gender and the age both packed as a *Number*. The definitions of *String* and *Number* are what determines the actual bytes that are placed in each location.

### Low level definitions

If you need to control the exact bytes that are packed, or if you need to pack them in an asynchronous way, high level definitions are not enough. To demonstrate how low level definitions work, we'll be defining the *Byte* type:

```javascript
function Byte(value){
  var n;
  
  this.value =  Math.max(0,
                  Math.min(255,
                    isNaN(n = parseInt(value))?0:n
                  )
                );
  
}
```

For this type, the packer function for the server (nodejs) could look like this:

```javascript
var ebjs = require('ebjs');

function packer(args){
  var res,
      byte = args[0];
  
  res = this.write(new Buffer([byte.value]),onWrite);
  if(res !== ebjs.deferred) this.end();
}

function onWrite(){
  this.end();
}

```

As you can see, the write operation has two arguments: a *Buffer* and a *Function*. **Low level operations can be either synchronous or asynchronous**. If the operation could be completed synchronously, it will return the result of the operation, if not, it will return `ebjs.deferred` and execute the provided *Function* when the operation is completed with the result of the operation. When we've finished packing our object, we must call `this.end();`, so that the pack operation can continue.

Now let's get into the unpacker:

```javascript
var ebjs = require('ebjs');

function unpacker(){
  var res,
      bytes;
  
  bytes = this.read(1,onRead);
  if(bytes !== ebjs.deferred) this.end(bytes[0]);
}

function onRead(bytes){
  this.end(bytes[0]);
}

```

There are a few differences with the packer. The read operation accepts as arguments a *Number* and a *Function*, and returns a *Buffer* with read bytes. The *Number* represents the number of bytes to be read, and the *Function* has the same role as in the packer. When the unpacking is done, the result of it should be passed as an argument to the end call, and we're done. Now, all that's left is to put it all together:

```javascript
var ebjs = require('ebjs');

ebjs.define(Byte,201,packer,unpacker);
```

### Constants

You can also define things as constants. These definitions look like this:

```javascript
var ebjs = require('ebjs'),
    someAwesomeObject = {};

ebjs.define(someAwesomeObject,202);
```

With this definition, every time a pack operation happens on *someAwesomeObject* it will be packed as the 202 *Number*, and when unpacking, if the 202 label is found, *someAwesomeObject* is returned as the result of the operation.

## Reference

*This section is being written, please wait or write it yourself*

