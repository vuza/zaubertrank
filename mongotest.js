const express = require('express');

const app = express();

const PORT = process.env.PORT || 4001;

const bodyParser = require('body-parser') //need that to get the info out of http requests

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) // only looks at requests where the Content-Type header matches the type optio


//helper functions & classes
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://seeebert:bussibaby2018@ds247191.mlab.com:47191/zaubertrank";
const databaseName = "zaubertrank"

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(databaseName);
    dbo.createCollection("collectDB", function(err, res) {
        if (err) throw err;
        console.log("Collection collectDB created!");
        db.close();
      });
  });

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(databaseName);
    dbo.createCollection("unlockDB", function(err, res) {
      if (err) throw err;
      console.log("Collection unlockDB created!");
      db.close();
    });
  });

class UnlockClass {  //creates objects for the unlockDB
    constructor(objID, sourceID, unlockBoolean) {
      this.objID = objID;
      this.sourceID = sourceID
      this.unlockBoolean = unlockBoolean;
    }
  }

  /*class CollectClass { //creates objects for the collectDB
    constructor(userID, sourceID, sourceName) {
      this.objID = objID;
      this.sourceID = sourceID;
      this.sourceName = sourceName;
    }
  }
*/
// 2 arrays to handle the database:

// [{objID: 123, sourceID: 321, unlockBoolean: true}]


// [{userID: 123, sources: [{sourceID: 321, objCount: 2}, {sourceID: 123, objCount: 3}]]]


/*
3 URLs are necessary for the requests. /rfid, /qr, /collect
*/

app.post('/test', (req, res, next) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(databaseName)
        var foundObj = []
        dbo.collection("unlockDB").find(
            { objID : req.body.objID }
        ).toArray(function(err, results) {
            if (err) throw err;
            console.log(results);
            foundObj = results
            db.close();
        console.log(foundObj);
        res.status(201).send(); //does this have to be withing mongo code? (because async?)
            }) 
  })
})

//send new object to unlockDB via /rfid (for RFID Scanner)
//req syntax:  http POST localhost:4001/rfid objID=3 sourceID=2

  app.post('/rfid', (req, res, next) => {
    const newObj = new UnlockClass(req.body.objID, req.body.sourceID, true) //create the object for unlockDB
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(databaseName)
            var myquery = { objID : req.body.objID }
            var newValue = { $set: newObj}
            dbo.collection("unlockDB").update(
                myquery, newValue, //upserts the object with sourceID, objID and boolean
                // if error is found - only put sourceID and boolean in newObj
                {upsert : true},
                function(err, res) {
                    if (err) throw err;
                    console.log("1 document updated");
                    db.close();
                  });
            dbo.collection("unlockDB").find( {} ).toArray( function(err, results) {
                    if (err) throw err;
                    console.log(results);
                    res.status(201).send(results)
                    db.close();
                  } )
             ; //does this have to be withing mongo code? (because async?)
            }) 
  })

//check boolean in unlockDB via /qr (user phone) and update collectDB (user phone)
//req syntax:  http POST localhost:4001/qr userID=2 objID=3

app.post('/qr', (req, res, next) => {

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(databaseName)
            dbo.collection("unlockDB").findOne(
                { objID : req.body.objID },
                function(err, results) {
                if (err) throw err;
                console.log(results);
                foundObj = results;
                
        if (foundObj) {
            if (foundObj.unlockBoolean) {
                    dbo.collection("collectDB").update(
                        { userID : req.body.userID },
                        { $setOnInsert : { userID : req.body.userID, sources : [] } },
                        {upsert : true},
                        function(err, res) {
                            if (err) throw err;
                            console.log("Checking if UserID has to be added");
                            db.close();
                          });
                     
                     dbo.collection("collectDB").update(
                        { userID : req.body.userID,  "sources.sourceID" : { $ne: foundObj.sourceID}},
                        { $push : { sources : {sourceID : foundObj.sourceID, objCount : 0} } },
                        {upsert : true},
                        function(err, result) {
                            if (err) throw err;
                            console.log("Checking if source needs to be added");
                            db.close();
                          });
                     
                     dbo.collection("collectDB").update(
                        { userID : req.body.userID, "sources.sourceID" : foundObj.sourceID },
                        { $inc : { "sources.$.objCount" : 1 }},
                        function(err, result) {
                            if (err) throw err;
                            console.log("objCount incremented");
                            db.close();
                          });
                     
     
                
                dbo.collection("unlockDB").update(
                    { objID : req.body.objID },
                    { $set: { unlockBoolean : false}},
                    function(err, res) {
                        if (err) throw err;
                        console.log("Boolean set to false");
                        db.close();
                      });
                
                // sets unlock boolean back to false
                res.status(201).send(true);
                // sends true if scan was sucessful
            }
            else {
                res.status(200).send(false);
                // sends false is boolean was set to false
            }
        }
        else {
            res.status(404).send();
        }
        db.close();
    }); 
    }
    )
})

//user can check his objcounts in collectDB
//req syntax:  http GET localhost:4001/collect userID=2

app.post('/collect', (req, res, next) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(databaseName)
        dbo.collection("collectDB").findOne( 
            { userID : req.body.userID },
      
      function(err, result) {
        if (err) throw err;
        if (result) {
            res.status(200).send(result.sources);
            console.log(result)
        }
        else {
           
            res.status(404).send('User not found');
            console.log("No valid userID")
    }
        db.close();
      }
    )
    })
})


//enable listening on PORT

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
