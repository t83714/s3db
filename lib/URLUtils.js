var _=require('underscore'),
URLUtils=require('url'),
querystring=require('querystring');

exports.get_s3_path=function(url)
{
	if(!url) return '';
	var info=URLUtils.parse(url,false,true);
	
	if(!info['pathname']) var path='/';
	else var path=info['pathname'];
	
	if(info['hostname']) path='/'+info['hostname']+path;
	if(info['query']) path+='?'+info['query'];
	//console.log(info);
	return path;
};
exports.add_ending_slash=function(path)
{
	if(!path || !_.isString(path)) return '/';
	path=path.trim();
	if(path=='/') return '/';
	if(path.substr(path.length-1)=='/') return path;
	return path+'/';
};
//console.log(' ssss ');
//console.log(exports.add_ending_slash(exports.get_s3_path('s3://xyz.ht.com/sss')));
