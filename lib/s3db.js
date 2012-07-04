var _=require('underscore'),
_s=require('underscore.string'),
aws2js=require('aws2js'),
URLUtils=require('url'),
querystring=require('querystring'),
crypto=require('crypto');

var ObjectDB=require('ObjectDB'),
KeyList=require('KeyList');

function init(aws_access_key_id,aws_secrect_access_key,endpoint_prefix)
{
	if(!_.isString(aws_access_key_id)) aws_access_key_id='';
	if(!_.isString(aws_secrect_access_key)) aws_secrect_access_key='';
	aws_access_key_id=aws_access_key_id.trim();
	aws_secrect_access_key=aws_secrect_access_key.trim();
	if(aws_access_key_id=='' || aws_secrect_access_key=='') throw new Error('s3db init: missing aws_access_key_id or aws_secrect_access_key parameters.');
	this.aws_access_key_id=aws_access_key_id;
	this.aws_secrect_access_key=aws_secrect_access_key;
	this.s3=aws.load('s3',this.aws_access_key_id,this.aws_secrect_access_key);
	if(endpoint_prefix && _.isString(endpoint_prefix)) this.s3.setEndPoint(endpoint_prefix);
}

module.exports=init;

init.prototype.open=function(module,uri){
	switch(module)
	{
		case 'ObjectDB' : return new ObjectDB(this.s3,uri);
		case 'KeyList' : return new KeyList(this.s3,uri);
	}
	throw new Error('Unknow s3db module:'+module);
};

function parse_url(url)
{
	if(!_.isString(url)) url='';
	url=url.trim();
	if(!url) return {"bucket":"","key":""};
	url=url.replace(' ','%20');
	var info=URLUtils.parse(url);
	var bucket=info['hostname']?info['hostname']:'';
	var key=[info['pathname'],info['search']].join('');
	//key.replace('%20',' ');
	return {'bucket':bucket,'key':key};
}

function is_success_status(status)
{
	if(status >= 200 && status < 300) return true;
	else false;
}


