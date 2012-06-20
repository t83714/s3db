var _=require('underscore'),
_s=require('underscore.string'),
s3db=require('s3db');

exports=module.exports=init;

function init(s3,uri)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	this.uri=uri;
}

init.prototype.get=function(key){
	
};

init.prototype.put=function(key,obj){
	
};

init.prototype.del=function(key){
	
};

