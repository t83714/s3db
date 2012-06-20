var _=require('underscore'),
_s=require('underscore.string'),
s3db=require('s3db');

exports=module.exports=init;

var default_limit=1000;

function init(s3,uri)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	this.uri=uri;
	this.maker='';
	this.is_truncated=false;
}

init.prototype.get=function(limit,marker){
	var default_return_obj={
		is_truncated:false,
		marker:null,
		data:[]	
	};
	//--- return [] or null
};

init.prototype.put=function(key){
	//---key could be string or array
};

init.prototype.del=function(key){
	//---key could be string or array
};

init.prototype.del_all=function(key){
	//---key could be string or array
};

init.prototype.on_list=function(key){
	
};

