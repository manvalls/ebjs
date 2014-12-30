var com = require('./main/common.js');

module.exports = function(){
  var data = arguments[0],
      info = com.info.default(data,{data: data}),
      i = 0,
      label;
  
  switch(arguments.length){
    case 2: // define(obj,label);
      label = arguments[1];
      if(com.labels[label]) throw 'Label in use';
    case 1: // define(obj);
      if(info.constant) throw 'Already defined';
      
      if(!label) label = com.nextLabel++;
      com.labels[label] = info;
      
      info.constant = label;
      
      break;
    
    case 4: // define(obj,label,packer,unpacker);
      label = arguments[1];
      if(com.labels[label]) throw 'Label in use';
      i++;
    case 3: // define(obj,packer,unpacker);
      if(info.label) throw 'Already defined';
      
      if(!label) label = com.nextLabel++;
      com.labels[label] = info;
      
      info.label = label;
      info.packer = arguments[i + 1];
      info.unpacker = arguments[i + 2];
      
      break;
  }
  
  return label;
};

