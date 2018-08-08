
const express = require('express');

const app = express();

const PORT = process.env.PORT || 4001;

const bodyParser = require('body-parser') //need that to get the info out of http requests

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true})) // only looks at requests where the Content-Type header matches the type optio


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

  
// 2 arrays to handle the database:

// [{objID: 123, sourceID: 321, unlockBoolean: true}]
const unlockDB = []; //RFID sends PUT/POST here, iPhone sends PUT for boolean here

// [{userID: 123, sources: [{sourceID: 321, objCount: 2}, {sourceID: 123, objCount: 3}]]]
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

//check boolean in unlockDB via /qr (user phone) and update collectDB (user phone)
//req syntax:  http POST localhost:4001/qr userID=2 objID=3

app.post('/qr', (req, res, next) => {
    const unlockIndex = getIndexByValue(unlockDB, 'objID', req.body.objID); //find Index of object in unlockDB array
    if (unlockDB[unlockIndex]) { //do i need the first if?
        if (unlockDB[unlockIndex].unlockBoolean) {
                const collectIndex = getIndexByValue(collectDB, 'userID', req.body.userID); //find Index of user in collectDB array
                const unlockIndex = getIndexByValue(unlockDB, 'objID', req.body.objID); //find Index of object in unlockDB array
                const reqSource = unlockDB[unlockIndex].sourceID //need that to assign obj to right source in collectDB
            
            
                if (collectIndex !== -1) { //if user already exists
                    const sourceIDIndex = getIndexByValue(collectDB[collectIndex].sources, 'sourceID', reqSource);
                    if (sourceIDIndex !== -1) {//if sourceID already exists for this user
                        collectDB[collectIndex].sources[sourceIDIndex].objCount += 1; //add +1 for this sourceID
                    }
                    else {
                        const newSource = {sourceID: reqSource, objCount: 1};
                        collectDB[collectIndex].sources.push(newSource);
                    } 
            
                }
                else {
                    const newSource = {sourceID: reqSource, objCount: 1};
                    collectDB.push({userID: req.body.userID, sources: [newSource]});
                

            }
            unlockDB[unlockIndex].unlockBoolean = false;
            // sets unlock boolean back to false
            console.log(collectDB);
            console.log(unlockDB);
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
})

//user can check his objcounts in collectDB
//req syntax:  http GET localhost:4001/collect userID=2

app.post('/collect', (req, res, next) => {
    const collectIndex = getIndexByValue(collectDB, 'userID', req.body.userID);
    if (collectIndex !== -1) {
        res.status(200).send(collectDB[collectIndex].sources);
        console.log(collectDB[collectIndex].sources)
    }
    else {res.status(404).send('User not found');
        console.log("No valid userID")
}
})


//enable listening on PORT

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
