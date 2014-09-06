
var com = require('./common.js');

module.exports = function(constructor,label,types,packer,unpacker){
	if(com.label.of(constructor).value != null) throw 'Already defined';
  
	if(typeof label != 'number'){
		unpacker = packer;
		packer = types;
		types = label;
		label = undefined;
	}
	
	if(types && !unpacker){
		unpacker = packer;
		packer = types;
		types = undefined;
	}
	
	if(label != null){
		var backup;
		
		if(com.classes[label]) backup = [
      com.classes[label],
      com.types[label],
      com.packers[label],
      com.unpackers[label]
    ];
		
		com.classes[label] = constructor;
		com.types[label] = types;
		com.packers[label] = packer;
		com.unpackers[label] = unpacker;
		
		if(backup){
			com.label.of(backup[0]).value = com.classes.length;
      
			com.classes.push(backup[0]);
			com.types.push(backup[1]);
			com.packers.push(backup[2]);
			com.unpackers.push(backup[3]);
		}
		
		return com.label.of(constructor).value = label;
	}
	
	com.classes.push(constructor);
	com.types.push(types);
	com.packers.push(packer);
	com.unpackers.push(unpacker);
	
	return com.label.of(constructor).value = com.classes.length - 1;
}

