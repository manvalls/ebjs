var basic = require('./definitions/basic.js'),
    extra = require('./definitions/extra.js'),
    EbjsInstance = require('./instance.js'),
    ebjs = new EbjsInstance();

basic(ebjs);
extra(ebjs);

/*/ exports /*/

module.exports = ebjs;
