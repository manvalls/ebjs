var browser = require('u-test/browser');

require('./client.js');
require('./server.js');
browser(`${__dirname}/client.js`);
