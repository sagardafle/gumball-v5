
/**

Mighty Gumball, Inc.
Version 5.0

- Refactored Previous REST Client Approach to Transaction Based REST API
- (i.e. instead of the Scaffolded REST API based on Domain Object Annotation) 
- Handlebars Page Templates
- Client State Validation using HMAC Key-Based Hash

NodeJS-Enabled Standing Gumball
Model# M102988
Serial# 1234998871109

**/
var data = '';
var endpoint = "ec2-54-82-240-2.compute-1.amazonaws.com:27017" ;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://ec2-54-82-240-2.compute-1.amazonaws.com:27017,ec2-54-174-128-21.compute-1.amazonaws.com:27017,ec2-54-172-180-67.compute-1.amazonaws.com:27017/test?w=0&readPreference=nearest";

// added in v3: handlebars
// https://www.npmjs.org/package/express3-handlebars
// npm install express3-handlebars

// added in v2: crypto
// crypto functions:  http://nodejs.org/api/crypto.html


var crypto = require('crypto');
var fs = require('fs');
var express = require('express');
var Client = require('node-rest-client').Client;

var app = express();
app.use(express.bodyParser());
app.use("/images", express.static(__dirname + '/images'));
handlebars  = require('express3-handlebars');
hbs = handlebars.create();
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


var secretKey = "kwRg54x2Go9iEdl49jFENRM12Mp711QI" ;

var get_hash = function( state, ts ) {

    // http://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key
    text = state + "|" + ts + "|" + secretKey ;
    hmac = crypto.createHmac("sha256", secretKey);
    hmac.setEncoding('base64');
    hmac.write(text);
    hmac.end() ;
    hash = hmac.read();
    //console.log( "HASH: " + hash )
    return hash ;

}


var error = function( req, res, msg, ts ) {

    var result = new Object() ;
    state = "error" ;
    hash = get_hash ( state, ts ) ;

    result.msg = msg ;
    result.ts = ts ;
    result.hash = hash ;
    result.state = state ;

    res.render('gumball', {
        state: result.state,
        ts: result.ts,
        hash: result.hash,
        message: result.msg
    });

}


var page = function( req, res, state, ts ) {
  MongoClient.connect(url, function(err, db) {
    db.collection('gumball', function(err, collection) {
        collection.find( {serialNumber: '1234998871109'}).toArray( function(err, results) {

                var data = results[0] ;
               /* var rec_id = data._id ;
                console.log( "fetched rec id: " + rec_id ) ;*/
                var result = new Object() ;
                hash = get_hash ( state, ts ) ;
                console.log( state ) ;

                console.log(data);
                count = data.countGumballs
                console.log( "count = " + count ) ;
                var msg =   "\n\nMighty Gumball, Inc.\n\nNodeJS-Enabled Standing Gumball\nModel# " + 
                            data.modelNumber + "\n" +
                            "Serial# " + data.serialNumber + "\n" +
                            "\n" + state +"\n\n" ;
                result.msg = msg ;
                result.ts = ts ;
                result.hash = hash ;
                result.state = state ;

                res.render('gumball', {
                    state: result.state,
                    ts: result.ts,
                    hash: result.hash,
                    message: result.msg
                });

        } ) ;
	});
    } ) ;


}


var order = function( req, res, state, ts ) {

    var client = new Client();
            var count = 0;
            client.post( endpoint, 
                function(data, response_raw) {
                    id = data.id ;
                    status = data.orderstatus ;
                    console.log( "order id: " + id ) ;
                    console.log( "order status: " + status ) ;
                    status_msg = "order id: " + id + " order status: " + status ;
                    page( req, res, state, ts, status_msg ) ;
            });
}


var handle_post = function (req, res, next) {

    console.log( "Post: " + "Action: " +  req.body.event + " State: " + req.body.state + "\n" ) ;
    var hash1 = "" + req.body.hash ;
    var state = "" + req.body.state ;
    var action = "" + req.body.event ;
    var ts = parseInt(req.body.ts) ;
    var now = new Date().getTime() ;
    var diff = ((now - ts)/1000) ;
    hash2 = get_hash ( state, ts ) ;
    console.log( "DIFF:  " +  diff ) ;
    console.log( "HASH1: " + hash1 ) ;
    console.log( "HASH2: " + hash2 ) ;

    if ( diff > 120 || hash1 != hash2 ) {
        error( req, res, "*** SESSION INVALID ***", ts ) ;
    }
    else if ( action == "Insert Quarter" ) {
        if ( state == "no-coin" )
            page( req, res, "has-coin", ts ) ;
        else
            page( req, res, state, ts ) ;
            
    }
    else if ( action == "Turn Crank" ) {
        if ( state == "has-coin" ) {
            hash = get_hash ( "no-coin", ts ) ;
            order(req, res, "no-coin", ts ) ;
        }
        else
            page( req, res, state, ts ) ;
    }  
  
}

var handle_get = function (req, res, next) {
    console.log( "Get: ..." ) ;
    ts = new Date().getTime()
    console.log( ts )
    state = "no-coin" ;
    page( req, res, state, ts ) ;
    
}


/*  Handlebars Test using Home template 

app.get('/', function (req, res, next) {
    res.render('home', {
        showTitle: true,
        helpers: {
            foo: function () { return 'foo!'; },
            bar: function () { return 'bar!'; }
        }
    });
});

*/

app.get('/', handle_get ) ;
app.post('/', handle_post ) ;


console.log( "Server running on Port 5000..." ) ;

//app.listen(8080);
 app.listen(process.env.PORT || 5000);


/**

Mighty Gumball, Inc.

NodeJS-Enabled Standing Gumball
Model# M102988
Serial# 1234998871109

-- MongoDB (Mongo Labs) Connection

Host:   ds043220.mongolab.com
Port:   43220
Login:  user
Passwd: pwd

Host:   localhost
Port:   27017

-- Add Mongodb Admin User

use admin
db.addUser('cmpe281', 'cmpe281');

-- Gumball MongoDB Collection (Create Document)

db.gumball.insert(
{ 
  id: 1,
  countGumballs: 8,
  modelNumber: 'M102988',
  serialNumber: '1234998871109' 
}
) ;

UPDATE 
db.gumball.update({modelNumber:"M102988"},{$set:{modelNumber:"M102998"}})


-- Gumball MongoDB Collection - Find Gumball Document

db.gumball.find( { id: 1 } ) ;

**/


