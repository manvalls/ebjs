[![NPM](https://nodei.co/npm/ebjs.png?downloads=true)](https://nodei.co/npm/ebjs/)

This package uses or may use at some point in the future ECMAScript 6 features. Use it on a compatible environment or transpile it with Traceur, Closure Compiler, es6-transpiler or equivalent. Please note that some of these have flaws and bugs, test your code carefully until you find a suitable tool for your task.

When cloning this repository, put the folder inside another named "node_modules" in order to avoid potential errors related to npm's dependency handling, and then run `npm install` on it.

No piece of software is ever completed, feel free to contribute and be humble.

# Extensible binary javascript serialization

## Description

This package is a tool which helps you define how your data is stored and transmitted based on javascript constructors. **It itself does not contain any definitions**. In order to use it you must at least define the *Number* type, you may get started by including basic definitions from [ebjs.basic](https://www.npmjs.org/package/ebjs.basic "ebjs.basic").

## Packing and unpacking

Once you've included definitions for the types you want, you can simply use *ebjs.pack* and *ebjs.unpack*:

```javascript
var ebjs = require('ebjs'),
    walk = require('vz.walk');

require('ebjs.basic');

walk(function*(){
  var buffer = yield ebjs.pack({foo: 'bar'});
  data = yield ebjs.unpack(buffer);
  
  console.log(data); // {foo: 'bar'}
});
```

## Defining new types

Types are identified by an unsigned integer called *label*. Every type you define has an associated label, either declared by you or implicitly assigned by the library. You may use any label you want for your definitions, but for interoperability's sake labels from 0 to 100 are to be considered reserved. Its intended usage is as follows, and will be updated when new ones are assigned:

- \[0\] Circular references
- \[1-10\] *basic* group ([ebjs.basic](https://www.npmjs.org/package/ebjs.basic "ebjs.basic"))

When defining a new type you may omit the label, but it's highly discouraged, and if you do, make sure to include all labeled definitions before the unlabeled ones, as unlabeled definitions will be assigned the next free label. Also, you must specify a packer generator and an unpacker generator. Consider the following type:

```javascript
function Person(name,gender,age){
  this.name = name + '';
  this.gender = gender + '';
  this.age = parseInt(age);
}
```

It could be defined in the following way:

```javascript
var ebjs = require('ebjs');

ebjs.define(Person,200,[String,Number,Number],function*(buffer,person){
  
  yield buffer.pack(String,person.name);
  yield buffer.pack(String,person.gender);
  yield buffer.pack(Number,person.age);
  
},function*(buffer){
  var name,gender,age;
  
  name = yield buffer.unpack(String);
  gender = yield buffer.unpack(String);
  age = yield buffer.unpack(Number);
  
  return new Person(name,gender,age);
});
```

With this definition, when calling *ebjs.pack* on a *Person* object, we will obtain a binary buffer with the label (200) packed as a *Number*, followed by the name packed as a *String* and the gender and the age both packed as a *Number*. The definitions of *String* and *Number* are what determines the actual bytes that are placed in each location. To demonstrate how to write bytes, we'll be defining the *Byte* type:

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

The definition of this type could be:

```javascript
var ebjs = require('ebjs');

ebjs.define(Byte,201,function*(buffer,byte){
  
  yield buffer.write(new Buffer([byte.value]));
  
},function*(buffer){
  
  return new Byte((yield buffer.read(1))[0]);
  
});
```

You can also define things as constants. These definitions look like this:

```javascript
var ebjs = require('ebjs'),
    someAwesomeObject = {};

ebjs.define(someAwesomeObject,202);
```

With this definition, every time a pack operation happens on *someAwesomeObject* it will be packed as the 202 *Number*, and when unpacking, if the 202 label is found, *someAwesomeObject* is returned as the result of the operation.
