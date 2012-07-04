var _=require('underscore'),
_s=require('underscore.string'),
URLUtils=require('URLUtils'),
s3db=require('s3db');

function init(s3,uri)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	this.uri=URLUtils.add_ending_slash(URLUtils.get_s3_path(uri));
}
module.exports=init;

init.prototype.get=function(key,ok_func,error_func){
	if(!key || !_.isString(key)) return null;
	this.s3.get(this.uri+key,'buffer',function(error,response){
		if(error){
			if(error_func && _.isFunction(error_func)) {
				error_func(error);
				return;
			}
			return;
		}
		console.log(response);//---need more work
	});
};

init.prototype.put=function(key,obj){
	
};

init.prototype.del=function(key){
	
};

