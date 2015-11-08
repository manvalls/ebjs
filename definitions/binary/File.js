
if(global.File) module.exports = require('./File/browser.js');
else module.exports = require('./File' + '/node.js')
