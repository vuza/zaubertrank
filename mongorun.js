const express = require('express');

const app = express();

const PORT = process.env.PORT || 4001;

const bodyParser = require('body-parser') //need that to get the info out of http requests

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) // only looks at requests where the Content-Type header matches the type optio


//helper functions & classes
const mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://seeebert:bussibaby2018@ds247191.mlab.com:47191/zaubertrank";
const databaseName = "zaubertrank"

// creating the 2 collections

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    const dbo = db.db(databaseName);
    dbo.createCollection("collectDB", function(err, res) {
        if (err) throw err;
        console.log("Collection collectDB created!");
        db.close();
      });
  });

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    const dbo = db.db(databaseName);
    dbo.createCollection("unlockDB", function(err, res) {
      if (err) throw err;
      console.log("Collection unlockDB created!");
      db.close();
    });
  });
// Objects of unlockDB and collectDB will have the following form
  // [{objID: 123, sourceID: 321, unlockBoolean: true}]
// [{userID: 123, sources: [{sourceID: 321, objCount: 2}, {sourceID: 123, objCount: 3}]]]



class UnlockClass {  //creates objects for the unlockDB
    constructor(objID, sourceID, unlockBoolean) {
      this.objID = objID;
      this.sourceID = sourceID
      this.unlockBoolean = unlockBoolean;
    }
  }


/*
3 URLs are necessary for the requests. /rfid, /qr, /collect
*/


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
             ;
            }) 
  })

//check boolean in unlockDB via /qr (user phone) and update collectDB (user phone)
//req syntax:  http POST localhost:4001/qr userID=2 objID=3

app.post('/qr', (req, res, next) => {

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(databaseName)
        var foundObj = []
            dbo.collection("unlockDB").findOne(
                { objID : req.body.objID },
                function(err, results) {
                if (err) throw err;
                console.log(results);
                foundObj = results;
                
                if (foundObj) { // is object in database?
                    if (foundObj.unlockBoolean) { // object activated?
                        
                        var userObj = []
                        dbo.collection("collectDB").findOne(
                          { userID : req.body.userID, "sources.sourceID" : foundObj.sourceID },
                          function(err, results) {
                          if (err) throw err;
                          userObj = results;

                          if (userObj) {
                            dbo.collection("collectDB").update( // increment object count
                              { userID : req.body.userID, "sources.sourceID" : foundObj.sourceID },
                              { $inc : { "sources.$.objCount" : 1 }},
                              function(err, result) {
                                  if (err) throw err;
                                  console.log("objCount incremented");
                                  dbo.collection("unlockDB").update( // set boolean to fals after scan was successful
                                    { objID : req.body.objID },
                                    { $set: { unlockBoolean : false}},
                                    function(err, res) {
                                        if (err) throw err;
                                        console.log("Boolean set to false");
                                        db.close();
                                       
                                        });
                          })} 
                          else {
                            dbo.collection("collectDB").update( //create user if needed. Otherwise does nothing
                              { userID : req.body.userID },
                              { $setOnInsert : { userID : req.body.userID, sources : [] } },
                              {upsert : true},
                              function(err, res) {
                                  if (err) throw err;
                                  console.log("Checking if UserID has to be added");
                                  dbo.collection("collectDB").update( // created object for that sourceID if not in DB. Otherwise does nothing
                                    { userID : req.body.userID},
                                    { $push : { sources : {sourceID : foundObj.sourceID, objCount : 1} } },
                                    {upsert : true},
                                    function(err, result) {
                                        if (err) throw err;
                                        console.log("Source added");
                                        dbo.collection("unlockDB").update( // set boolean to fals after scan was successful
                                            { objID : req.body.objID },
                                            { $set: { unlockBoolean : false}},
                                            function(err, res) {
                                                if (err) throw err;
                                                console.log("Boolean set to false");
                                                db.close();
                                                    
                                                    });
                                       
                                      });
                                });
                              }
                          })
                          

                          
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
    }); 
    }
    )
})

//user can check his objcounts in collectDB
//req syntax:  http POST localhost:4001/collect userID=2

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