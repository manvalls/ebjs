var EbjsInstance = require('./instance.js'),
    ebjs = new EbjsInstance();

module.exports = ebjs;

require('./definitions/basic.js')(ebjs);
require('./definitions/extra.js')(ebjs);
require('./definitions/binary.js')(ebjs);
require('./definitions/rtc.js')(ebjs);
require('./definitions/y.js')(ebjs);
