var _=require('underscore'),
URLUtils=require('url');

exports.parse_s3_uri=function(uri)
{
	if(!uri || typeof(uri)!='string') return null;
	var info=URLUtils.parse(uri,false,true);
	
	if(!info['pathname']) var path='/';
	else var path=info['pathname'];
	
	if(!info['hostname']) return null;
	if(info['query']) path+='?'+info['query'];
	return {
		'bucket':info['hostname'],
		'path':path
	};
};
exports.add_ending_slash=function(path)
{
	if(!path || !_.isString(path)) return '/';
	path=path.trim();
	if(path=='/') return '/';
	if(path.substr(path.length-1)=='/') return path;
	return path+'/';
};

