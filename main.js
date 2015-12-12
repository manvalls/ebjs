var basic = require('./definitions/basic.js'),
    extra = require('./definitions/extra.js'),
    binary = require('./definitions/binary.js'),
    rtc = require('./definitions/rtc.js'),
    EbjsInstance = require('./instance.js'),
    ebjs = new EbjsInstance();

basic(ebjs);
extra(ebjs);
binary(ebjs);
rtc(ebjs);

/*/ exports /*/

module.exports = ebjs;
