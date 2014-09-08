
var com = require('./common.js');

module.exports = function(constructor,label,types,packer,unpacker){
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
	
  if(packer?com.label.of(constructor).get():com.uLabel.of(constructor).get())
  throw 'Already defined';
  
	if(label != null){
		if(com.classes[label]) throw 'Label in use';
		
		com.classes[label] = constructor;
		com.types[label] = types;
		com.packers[label] = packer;
		com.unpackers[label] = unpacker;
		
		return packer?com.label.of(constructor).set(label):com.uLabel.of(constructor).set(label);
	}
	
	com.classes.push(constructor);
	com.types.push(types);
	com.packers.push(packer);
	com.unpackers.push(unpacker);
	
	return packer?com.label.of(constructor).set(com.classes.length - 1):com.uLabel.of(constructor).set(com.classes.length - 1);
}

