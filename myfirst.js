const array1 = [{objID: 123, sourceID: 321, sourceName: 'lokal', unlockBoolean: true}, {objID: 2234, sourceID: 532, sourceName: 'lokal1', unlockBoolean: false}]
const array2 = [{myID: 444}, {myID:555}]

function getIndexByValue(myArray, myProp, myValue) {
    for(let i = 0; i < myArray.length; i += 1) {
        if(myArray[i][myProp] === myValue) {
            return i;
        }
    }
    return -1;
} 

const wantToLog = getIndexByValue(array2, 'myID', 444)


console.log('Hello World')
console.log(wantToLog)