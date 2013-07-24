## About

A node.js module allows you easily maintain simple data structure on Amazon S3 service (Use [aws2js](https://github.com/SaltwaterC/aws2js) for S3 access):

1. KeyList

Maintains a list of string keys. You can:

* Add a key / keys into the list
* Fetch a list of keys on list
* Delete a key / keys / all keys from list
* Tell whether a key is / keys are on list

2. ObjectDB

Maintains a key value store. You can:

* Store a value / object under a string key
* Get the value / object of a string key
* Delete a key
* Tell whether a key exists

## Installation

Either manually clone this repository into your node_modules directory, or the recommended method:

> npm install aws2js

## Getting Started

### Initailization

```javascript
var s3db=require('s3db'); //--- load s3db module
var db=new s3db('your aws_access key id','your aws secrect access key');
```

### KeyList

```javascript
var kl=db.open('KeyList','s3://mybucket.com/path_to_my_key_list/my_key_list'); //--Open a keylist

//--- fetch keys on list
kl.get(function(keys){ //--- callback will be called when operation completed without error.
	console.log(keys); //-- first 100 keys
	if(kl.is_truncated==true){ //--- if not all keys return in one request (default fetch only first 1000 keys), then continue to fetch the rest keys on the list.
		kl.get(function(keys){
			console.log(keys); //-- next 1000 keys
		},function(error){
			console.log(error);
		});
	}
},function(error){ //--- callback will be called when error occurs
	console.log(error);
});

//--- delete all keys on list

kl.del_all(function(){  //--- callback will be called when operation completed without error.
	console.log('Operation completed'); //-- next 1000 keys
},function(error){
	console.log(error);
});

```

### ObjectDB

```javascript
var odb=db.open('ObjectDB','s3://mybucket.com/path_to_obejct_db/my_object_db'); //--Open a ObjectDB

//--- store an object / hash under key 'mykey'
var obj={a:1,b:2};

odb.put('mykey',obj,function(){  //--- callback will be called when operation completed without error. 
	console.log('Operation completed');
	
	//-- get value under key 'mykey'
	odb.get('mykey',function(obj){  //--- callback will be called when operation completed without error. 
		console.log(obj); //--- will print out: {a:1,b:2}
	},function(e){	//--- callback will be called when error occurs
		console.log(e);
	});
	
},function(e){	//--- callback will be called when error occurs
	console.log(e);
});

```

## `Promise` Interface Support

Along with callback style API, `Promise` stlyle asynchronous programming pattern is also support (Based on JavaScript Library [Q](https://github.com/kriskowal/q/)).


```javascript

kl.get() //---get full key list
.then(kl.del) //-- del all key returned by kl.get()
.then(kl.get) //-- fetch key list again
.then(function(r){
	console.log(obj); //--- will print out: []
})fail(function(error){
	console.log(error); //--- print out error during the whole process
});

```

```javascript
//---Load underscore library for function bind
var _=require('underscore');

//--- store an object / hash under key 'mykey'
var obj={a:1,b:2};

odb.put('mykey',obj).then(_.partial(odb.get,
								 'mykey' //--- paramter for get method
)).then(function(obj){
	console.log(obj); //--- will print out: {a:1,b:2}
}).fail(function(error){
	console.log(error); //--- print out error during the whole process
});

```

## API Reference

### s3db

##### Method init(aws_access_key_id,aws_secrect_access_key,endpoint_prefix)

endpoint_prefix: default to ''. Example: 's3-us-west-1' The endpoint list is available [here](http://docs.amazonwebservices.com/general/latest/gr/index.html?rande.html#s3_region).

##### Method open(module,uri)
module: availble values: 'KeyList', 'ObjectDB'

### KeyList

##### Method get(ok_func,error_func,limit,marker)
ok_func: callback. Will be called if operation completed withour error. Optional if use `Promise` API.
ok_func: callback. Will be called if error occurs. Optional if use `Promise` API.
limit: Max. number of keys to fetch. Optional, default to 1000. A value larger than 1000 will be ignored.
marker: Fetch the keys from the marker. For pagination purpose. Optional.

##### Method reset()
Reset internal marker so that get method will return result form the first key rather then where the result is truncated during last method get call.

##### Method put(key,ok_func,error_func)
key: Can be a string key or an array of keys that should be put on list

##### Method del(key,ok_func,error_func)
key: Can be a string key or an array of keys that should be deleted from list

##### Method del_all(ok_func,error_func)

##### Method on_list(key,yes_func,no_func,error_func)
key: Can be a string key or an array of keys
yes_func: callback will be called if all keys are on list


### ObjectDB

##### Method get(key,ok_func,error_func)
key: String. key of the value / object

##### Method put(key,obj,ok_func,error_func)
key: String. key of the value / object
obj: Object. The object should be store under the key.

##### Method del(key,ok_func,error_func)
key: String. key of the value / object

##### Method is_set(key,yes_func,no_func,error_func)
key: String. key of the value / object
yes_func: callback will be called if the key exists


