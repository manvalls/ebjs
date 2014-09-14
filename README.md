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
    console.log(data);
  });
});
```

## Defining new types

Types are identified by an unsigned integer called *label*. Every type you define has an associated label, either declared by you or implicitly assigned by the library. You may use any label you want for your definitions, but for interoperability's sake labels from 0 to 100 are to be considered reserved. Its intended usage is as follows, and will be updated when new ones are assigned:

- \[0\] Circular references
- \[1-10\] *basic* group ([ebjs.basic](https://www.npmjs.org/package/ebjs.basic "ebjs.basic"))

When defining a new type you may omit the label, but it's highly discouraged, and if you do, make sure to include all labeled definitions before the unlabeled ones, as unlabeled definitions will be assigned the next free label. This being said, there are two different ways of defining a new type: the sync, high level one, and the low level one.

### High level definitions

TODO

### Low level definitions

TODO

## Reference

TODO

