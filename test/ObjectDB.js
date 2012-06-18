var assert = require('assert');
var s3db=require('../');
s3db.setCredentials(process.env.AWS_ACCEESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY);

var objdb=new s3db.load('ObjectDB',process.env.S3_DB_URI);