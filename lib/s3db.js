var _  = require('underscore'),
_s = require('underscore.string'),
aws2js = require('aws2js'),
URLUtils = require('url'),
querystring = require('querystring'),
crypto = require('crypto');

exports=module.exports=s3db;

function init(aws_access_key_id,aws_secrect_access_key)
{
	if(!_.isString(aws_access_key_id)) aws_access_key_id='';
	if(!_.isString(aws_secrect_access_key)) aws_secrect_access_key='';
	aws_access_key_id=aws_access_key_id.trim();
	aws_secrect_access_key=aws_secrect_access_key.trim();
	if(aws_access_key_id=='' || aws_secrect_access_key=='') throw new Error('js23 init: missing aws_access_key_id or aws_secrect_access_key parameters.');
	this.aws_access_key_id=aws_access_key_id;
	this.aws_secrect_access_key=aws_secrect_access_key;
	this.s3=aws.load('s3',this.aws_access_key_id,this.aws_secrect_access_key);
}

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


