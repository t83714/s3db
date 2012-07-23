var _=require('underscore'),
URLUtils=require('./URLUtils'),
s3db=require('./s3db'),
Q=require('q');

function init(s3,uri,endpoint_prefix)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	var info=URLUtils.parse_s3_uri(uri);
	if(!info) throw new Error('init@ObjectDB@s3db: Invalid S3 URI: '+uri);
	if(!endpoint_prefix) s3.setBucket(info['bucket']);
	else s3.setBucket(info['bucket']+'.'+endpoint_prefix);
	this.path=URLUtils.add_ending_slash(info['path']);
}
module.exports=init;

init.prototype.get=function(key,ok_func,error_func){
	var deferred = Q.defer();
	try{
		if(!key || !_.isString(key)) throw new Error('Invalid or empty Key');
		this.s3.get(this.path+key,'buffer',function(error,response){
			try{
				if(error) throw error;
				if(!response.buffer || !Buffer.isBuffer(response.buffer)) throw new Error('Empty or invalid Buffer Object Returned');
				var data=response.buffer.toString('utf-8');
				data=JSON.parse(data);
				if(ok_func && _.isFunction(ok_func)) ok_func(data,response['headers']);
				deferred.resolve(data);
			}catch(e){
				e.key=key;
				if(error_func && _.isFunction(error_func)) error_func(e);
				deferred.reject(e);
			}
		});	
	}catch(e){
		e.key=key;
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

init.prototype.put=function(key,obj,ok_func,error_func){
	var deferred = Q.defer();
	try{
		if(!key || !_.isString(key) || !obj) throw new Error('Invalid or empty Key Or empty data');
		obj=new Buffer(JSON.stringify(obj),'utf-8');
		this.s3.putBuffer(this.path+key,obj,'private',{
			'Content-Type':'application/json'
		},function(error,response){
			try{
				if(error) throw error;
				if(ok_func && _.isFunction(ok_func)) ok_func(response);
				deferred.resolve(response);
			}catch(e){
				e.key=key;
				if(error_func && _.isFunction(error_func)) error_func(e);
				deferred.reject(e);
			}
		});	
	}catch(e){
		e.key=key;
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

init.prototype.del=function(key,ok_func,error_func){
	var deferred = Q.defer();
	try{
		if(!key || !_.isString(key)) throw new Error('Invalid or empty Key');
		this.s3.del(this.path+key,function(error,response){
			try{
				if(error) throw error;
				if(ok_func && _.isFunction(ok_func)) ok_func(response);
				deferred.resolve(response);
			}catch(e){
				e.key=key;
				if(error_func && _.isFunction(error_func)) error_func(e);
				deferred.reject(e);
			}
		});	
	}catch(e){
		e.key=key;
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

init.prototype.is_set=function(key,yes_func,no_func,error_func){
	var deferred = Q.defer();
	try{
		if(!key || !_.isString(key)) throw new Error('Empty & invalid Key');
						
		this.s3.head(this.path+key,_.bind(function(error,response){
			if(error) {
				if(error['code'] && error['code']=='404') {
					if(no_func && _.isFunction(no_func)) no_func();
					deferred.resolve(false);
					return;	
				}
				error.key=key;
				if(error_func && _.isFunction(error_func)) error_func(error);
				deferred.reject(error);
				return;
			}
			if(yes_func && _.isFunction(yes_func)) yes_func();
			deferred.resolve(true);	
		},this));		
	}catch(e){
		e.key=key;
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

