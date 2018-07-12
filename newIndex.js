const express = require('express');

const app = express();

const PORT = process.env.PORT || 4001;

const bodyParser = require('body-parser') //need that to get the info out of http requests

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) // only looks at requests where the Content-Type header matches the type optio


// const { getElementById, getIndexById, updateElement, seedElements, createElement } = require('./utils');

//helper functions & classes


function getIndexByValue(myArray, myProp, myValue) {
    for(let i = 0; i < myArray.length; i += 1) {
        if(myArray[i][myProp] === myValue) {
            return i;
        }
    }
    return -1;
} 

class UnlockClass {  //creates objects for the unlockDB
    constructor(objID, sourceID, unlockBoolean) {
      this.objID = objID;
      this.sourceID = sourceID;
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
const unlockDB = []; //RFID sends PUT/POST here, iPhone sends PUT for boolean here

// [{userID: 123, sources: [{sourceID: 321, objCount: 2}, {sourceID: 123, objCount: 3}]
const collectDB = []; //iPhone gets results from collected points here

/*
3 URLs are necessary for the requests. /rfid, /qr, /collect
*/

  

//send new object to unlockDB via /rfid (for RFID Scanner)
//req syntax:  http POST localhost:4001/rfid objID=3 sourceID=2

  app.post('/rfid', (req, res, next) => {
    const unlockIndex = getIndexByValue(unlockDB, 'objID', req.body.objID); //gets index in DB of req objID
    const newObj = new UnlockClass(req.body.objID, req.body.sourceID, true) //create the object for unlockDB
      if (unlockIndex !== -1 ) {
        unlockDB[unlockIndex] = newObj //update obj if exists
      } else {
        unlockDB.push(newObj); //add obj if not exists
      }
      res.status(201).send(unlockDB);
      console.log(unlockDB);
  })

//check boolean in unlockDB via /qr (user phone)
//req syntax:  http POST localhost:4001/qr objID=3

app.post('/qr', (req, res, next) => {
    const unlockIndex = getIndexByValue(unlockDB, 'objID', req.body.objID); //find Index of object in unlockDB array
    if (unlockDB[unlockIndex]) { //do i need the first if?
        if (unlockDB[unlockIndex].unlockBoolean) {
            res.status(201).send(true);
            unlockDB[unlockIndex].unlockBoolean = false;
        }
        else {
            res.status(201).send(false);
            console.log('Not available)')
        }
    }
    else {res.status(201).send(false);
    }
    console.log(unlockDB);
})

//update collectDB via /collect (user phone)
// http POST localhost:4001/qr userID=3 objID=5

app.post('/collect', (req, res, next) => {
    const collectIndex = getIndexByValue(collectDB, 'userID', req.body.userID); //find Index of user in collectDB array
    const unlockIndex = getIndexByValue(unlockDB, 'objID', req.body.objID); //find Index of object in unlockDB array
    const reqSource = unlockDB[unlockIndex].sourceID //need that to assign obj to right source in collectDB


    if (collectIndex !== -1) { //if user already exists
        const sourceIDIndex = getIndexByValue(collectDB[collectIndex].sources, 'sourceID', reqSource);
        if (sourceIDIndex !== -1) {//if sourceID already exists for this user
            collectDB[collectIndex].sources[sourceIDIndex].objCount++; //add +1 for this sourceID
            res.status(201).send();
        }
        else {
            const newSource = {sourceID: reqSource, objCount: 1};
            collectDB[collectIndex].sources.push(newSource);
            res.status(201).send();
        } 

    }
    else {
        const newSource = {sourceID: reqSource, objCount: 1};
        collectDB.push({userID: req.body.userID, sources: [newSource]});
        res.status(201).send();
    }
    console.log(collectDB)
})


//enable listening on PORT

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
/*

  app.post('/expressions', (req, res, next) => {
    const receivedExpression = createElement('expressions', req.query);
    if (receivedExpression) {
      expressions.push(receivedExpression);
      res.status(201).send(receivedExpression);
    } else {
      res.status(400).send();
    }
  });

  app.delete('/expressions/:id', (req, res, next) => {
    const expressionIndex = getIndexById(req.params.id, expressions);
    if (expressionIndex !== -1) {
      expressions.splice(expressionIndex, 1);
      res.status(204).send();
    } else {
      res.status(404).send();
    }
  });

  */