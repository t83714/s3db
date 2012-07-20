var _=require('underscore'),
URLUtils=require('./URLUtils'),
s3db=require('./s3db');

exports=module.exports=init;

function init(s3,uri,endpoint_prefix)
{
	if(!s3 || !uri) throw new Error('init@ObjectDB@s3db: s3 and uri parameters cannot be empty');
	this.s3=s3;
	var info=URLUtils.parse_s3_uri(uri);
	if(!info) throw new Error('init@ObjectDB@s3db: Invalid S3 URI: '+uri);
	if(!endpoint_prefix) s3.setBucket(info['bucket']);
	else s3.setBucket(info['bucket']+'.'+endpoint_prefix);
	this.prefix=URLUtils.add_leading_slash(URLUtils.add_ending_slash(info['path']));
	this.path=URLUtils.add_ending_slash(info['path']);
	
	this.next_marker='';
	this.is_truncated=false;
	this.limit=0;
	this.delimiter='';
}

init.prototype.default_limit=1000;
init.prototype.default_delimiter='/';

init.prototype.reset=function(){
	this.next_marker='';
	this.is_truncated=false;
	this.limit=0;
	this.delimiter='';
};

init.prototype.get=function(ok_func,error_func,limit,marker){
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
			}catch(e){
				if(error_func && _.isFunction(error_func)) error_func(e);
			}
		},this));	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
	}
	
};

init.prototype.put=function(key,ok_func,error_func){
	try{
		if(!key) throw new Error('Empty Key');
		var keys;
		if(_.isArray(key)) {
			if(!key.length) throw new Error('Empty Key Array');
			keys=key;
		}else if(_.isString(key)) {
			keys=[key];
		}else throw new Error('Unknow `key` parameter type');
		
		function complete_func(){
			if(ok_func && _.isFunction(ok_func)) ok_func();
		}
		
		var data=new Buffer('1','utf-8');
		var create_func=_.bind(function(){
			try{
				if(!keys.length) {
					complete_func();
					return;
				}
				var tmp_key=keys.pop();
				this.s3.putBuffer(this.path+key,data,'private',{
					'Content-Type':'application/json'
				},function(error,response){
					try{
						if(error) throw error;
						create_func();
					}catch(e){
						if(error_func && _.isFunction(error_func)) error_func(e);
					}
				});
			}catch(e){
				if(error_func && _.isFunction(error_func)) error_func(e);
			}
		},this);
	
	}catch(e){
		if(error_func && _.isFunction(error_func)) error_func(e);
	}
};

init.prototype.del=function(key){
	//---key could be string or array
};

init.prototype.del_all=function(key){
	//---key could be string or array
};

init.prototype.on_list=function(key){
	
};

