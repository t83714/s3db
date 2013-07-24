var _=require('underscore'),
URLUtils=require('./URLUtils'),
s3db=require('./s3db'),
Q=require('q'),
crypto=require('crypto');

exports=module.exports=init;

function init(s3,uri,endpoint_prefix)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	var info=URLUtils.parse_s3_uri(uri);
	if(!info) throw new Error('init@ObjectDB@s3db: Invalid S3 URI: '+uri);
	if(!endpoint_prefix) s3.setBucket(info['bucket']);
	else s3.setBucket(info['bucket']+'.'+endpoint_prefix);
	this.prefix=URLUtils.remove_leading_slash(URLUtils.add_ending_slash(info['path']));
	this.path=URLUtils.add_ending_slash(info['path']);
	
	this.next_marker='';
	this.is_truncated=false;
	this.limit=0;
	this.delimiter='';
	
	this.bind_methods();
}

init.prototype.bind_methods=function(){
	this.reset=_.bind(this.reset,this);
	this.get=_.bind(this.get,this);
	this.put=_.bind(this.put,this);
	this.del=_.bind(this.del,this);
	this.del_all=_.bind(this.del_all,this);
	this.on_list=_.bind(this.on_list,this);
};

init.prototype.default_limit=1000;
init.prototype.default_delimiter='/';

init.prototype.reset=function(){
	var deferred = Q.defer();
	this.next_marker='';
	this.is_truncated=false;
	this.limit=0;
	this.delimiter='';
	deferred.resolve(true);
	return deferred.promise;
};

init.prototype.get=function(ok_func,error_func,limit,marker){
	var deferred = Q.defer();
	try{

		var params={};
	
		var delimiter=(this.is_truncated && this.delimiter)?this.delimiter:this.default_delimiter;
		if(delimiter) params['delimiter']=delimiter;
		
		if(this.prefix) params['prefix']=this.prefix;
		
		if(!limit) limit=(this.is_truncated && this.limit) ? this.limit : this.default_limit;
		
		params['max-keys']=limit;
		
		if(!marker && this.is_truncated && this.next_marker) marker=this.next_marker;
		if(marker) params['marker']=marker;
		
		if(_.isEmpty(params)) params=null;
		
		this.s3.get('/',params,'xml',_.bind(function(error,response){
			try{
				if(error) throw error;
				this.is_truncated=response['IsTruncated']=='true'?true:false;
				this.next_marker=(response['NextMarker'] && typeof(response['NextMarker'])=='string')?response['NextMarker']:'';
				this.limit=(response['MaxKeys'] && typeof(response['MaxKeys'])=='string')?response['MaxKeys']:0;
				this.delimiter=(response['Delimiter'] && typeof(response['Delimiter'])=='string')?response['Delimiter']:'';
				var prefix=(response['Prefix'] && typeof(response['Prefix'])=='string')?response['Prefix']:'';
				
				var data=[];
				var key;
				
				if(response['Contents'] && response['Contents']['length'])
				{
					for(var i=0;i<response['Contents']['length'];i++)
					{
						if(!response['Contents'][i] || !response['Contents'][i]['Key'] || typeof(response['Contents'][i]['Key'])!='string') continue;
						key=response['Contents'][i]['Key'];
						if(!prefix) data.push(key);
						else data.push(key.substr(prefix.length));
					}
				}else if(response['Contents'] && response['Contents']['Key'] && typeof(response['Contents']['Key'])=='string'){
					key=response['Contents']['Key'];
					if(!prefix) data.push(key);
					else data.push(key.substr(prefix.length));
				}
				if(ok_func && _.isFunction(ok_func)) ok_func(data,this.is_truncated,this.next_marker,this.limit,this.delimiter);
				deferred.resolve(data);
			}catch(e){
				if(error_func && _.isFunction(error_func)) error_func(e);
				deferred.reject(e);
			}
		},this));	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

init.prototype.put=function(key,ok_func,error_func){
	var main_deferred = Q.defer();
	try{
		if(!key) {
			main_deferred.resolve(true);
			return main_deferred.promise;
		}
		var keys;
		if(_.isArray(key)) {
			if(!key.length) {
				main_deferred.resolve(true);
				return main_deferred.promise;
			}
			keys=key;
		}else if(_.isString(key)) {
			keys=[key];
		}else throw new Error('Unknow `key` parameter type');

		var data=new Buffer('1','utf-8');
		
		var promises=_.map(keys,function(k){
			var deferred = Q.defer();

			this.s3.putBuffer(this.path+k,data,'private',{
				'Content-Type':'application/json'
			},function(error,response){
				if(error) deferred.reject(error);
				else deferred.resolve();	
			});
			return deferred.promise;
		},this);
		
		Q.all(promises).then(function(){
			if(ok_func && _.isFunction(ok_func)) ok_func();
			main_deferred.resolve(true);
		},function(e){
			if(error_func && _.isFunction(error_func)) error_func(e);
			main_deferred.reject(e);
		});
	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
		main_deferred.reject(e);
	}
	return main_deferred.promise;
};

init.prototype.del=function(key,ok_func,error_func){
	var main_deferred = Q.defer();
	try{
		if(!key) {
			main_deferred.resolve(true);
			return main_deferred.promise;
		}
		var keys;
		if(_.isArray(key)) {
			if(!key.length) {
				main_deferred.resolve(true);
				return main_deferred.promise;
			}
			keys=key;
		}else if(_.isString(key)) {
			keys=[key];
		}else throw new Error('Unknow `key` parameter type');
		
		var tasks=[];
		if(keys.length<=this.default_limit) tasks.push(keys);
		else {
			for(var i=0;i<keys.length-this.default_limit;i+=this.default_limit)
				tasks.push(keys.slice(i,i+this.default_limit));
		}
		
		var promises=_.map(tasks,function(k_arr){
			var deferred = Q.defer();
			
			var req='<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>true</Quiet>';
			
			for(var i=0;i<k_arr.length;i++)
				req+='<Object><Key>'+_.escape(this.prefix+k_arr[i])+'</Key></Object>';
			
			req+='</Delete>';
			
			req=new Buffer(req,'utf-8');
			
			var hash=crypto.createHash('md5');
			hash.update(req);
			var md5=hash.digest('base64');
			
			this.s3.post('/?delete',{
				'Content-MD5':md5,
				'Content-Length':req.length
			},req,function(error,response){
				if(error) deferred.reject(error);
				else deferred.resolve();	
			});
			
			return deferred.promise;
		},this);
		
		Q.all(promises).then(function(){
			if(ok_func && _.isFunction(ok_func)) ok_func();
			main_deferred.resolve(true);
		},function(e){
			if(error_func && _.isFunction(error_func)) error_func(e);
			main_deferred.reject(e);
		});
	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
		main_deferred.reject(e);
	}
	return main_deferred.promise;
};

init.prototype.del_all=function(ok_func,error_func){
	var deferred = Q.defer();
	try{
		var get_list_func=_.bind(function(){
			this.get().then(_.bind(this.del,this)).then(_.bind(function(){
				if(!this.is_truncated) {
					if(ok_func && _.isFunction(ok_func)) ok_func();
					deferred.resolve(true);
				}else get_list_func();
			},this)).fail(function(e){
				if(error_func && _.isFunction(error_func)) error_func(e);
				deferred.reject(e);
			});
		},this);
		get_list_func();	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
		deferred.reject(e);
	}
	return deferred.promise;
};

init.prototype.on_list=function(key,yes_func,no_func,error_func){
	var main_deferred = Q.defer();
	try{
		if(!key) throw new Error('Empty Key');
		var keys;
		if(_.isArray(key)) {
			if(!key.length) throw new Error('Empty Key Array');
			keys=key;
		}else if(_.isString(key)) {
			keys=[key];
		}else throw new Error('Unknow `key` parameter type');
		
		key=null;
		
		var promises=_.map(keys,function(k){
			var deferred = Q.defer();
						
			this.s3.head(this.path+k,function(error,response){
				if(error) {
					error.key=k;
					deferred.reject(error);
				}else deferred.resolve();	
			});
			
			return deferred.promise;
		},this);
		
		Q.all(promises).then(function(){
			if(yes_func && _.isFunction(yes_func)) yes_func();
			main_deferred.resolve(true);
		},function(e){
			if(e['code'] && e['code']=='404') {
				if(no_func && _.isFunction(no_func)) no_func(e.key,e);
				main_deferred.resolve(false);
				return;
			}
			if(error_func && _.isFunction(error_func)) error_func(e);
			main_deferred.reject(e);
		});
		
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
		main_deferred.reject(e);
	}
	return main_deferred.promise;
};

