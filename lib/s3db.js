var _=require('underscore'),
aws2js=require('aws2js'),
URLUtils=require('url'),
querystring=require('querystring'),
crypto=require('crypto');

var ObjectDB=require('./ObjectDB'),
KeyList=require('./KeyList');

function init(aws_access_key_id,aws_secrect_access_key,endpoint_prefix)
{
	if(!_.isString(aws_access_key_id)) aws_access_key_id='';
	if(!_.isString(aws_secrect_access_key)) aws_secrect_access_key='';
	aws_access_key_id=aws_access_key_id.trim();
	aws_secrect_access_key=aws_secrect_access_key.trim();
	if(aws_access_key_id=='' || aws_secrect_access_key=='') throw new Error('s3db init: missing aws_access_key_id or aws_secrect_access_key parameters.');
	this.aws_access_key_id=aws_access_key_id;
	this.aws_secrect_access_key=aws_secrect_access_key;
	this.s3=aws2js.load('s3',this.aws_access_key_id,this.aws_secrect_access_key);
	if(endpoint_prefix && _.isString(endpoint_prefix)) this.endpoint_prefix=endpoint_prefix;
	else this.endpoint_prefix=null;
}

module.exports=init;

init.prototype.open=function(module,uri){
	switch(module)
	{
		case 'ObjectDB' : return new ObjectDB(this.s3,uri,this.endpoint_prefix);
		case 'KeyList' : return new KeyList(this.s3,uri,this.endpoint_prefix);
	}
	throw new Error('Unknow s3db module:'+module);
};