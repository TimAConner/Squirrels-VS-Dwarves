  "use strict";

  const g = require("./game");
  const _ = require("lodash");

  let freqTable = {
        "2":  {
            'count': 0.9,
            'value': 2
        },
        "0": {
            'count': 0.1,
            'value': 0
        }
    };

    let freqTableCopy = {
        "2":  {
            'count': 0.9,
            'value': 2
        },
        "0": {
            'count': 0.1,
            'value': 0
        }
    };  


    let curFreqCount = {};


  const generateTile = totalTiles => {
    console.log('generate tiles freqTable', freqTable);

    let freqTableArray = Object.values(freqTable);

    // Generate a random index in the frequency table
    let randFreqIndex = freqTableArray[Math.floor(Math.random() * freqTableArray.length)];
    
    // console.log('randFreqIndex', randFreqIndex, freqTableArray.length);

    // Add values used to list of numbers used
    curFreqCount[randFreqIndex.value] = (curFreqCount[randFreqIndex.value] += 1) || 1;

    // Remove the value from the frequency table if it's frequent enough in curFreqCount
    if((curFreqCount[randFreqIndex.value] / totalTiles) >= randFreqIndex.count){
    //    _.remove(freqTableArray, randFreqIndex);
    console.log('delete');
        delete freqTable[randFreqIndex.value];
    }   
    
    return randFreqIndex.value;
  };

  const resetFrequency = () => {
    curFreqCount = {};
    freqTable = Object.assign({}, freqTableCopy);
    console.log('Just copied freqTable', freqTable);
  };

  module.exports.generateTiles = (w, h) => {

    resetFrequency();

    let tiles = [];
        let id = 0;
        for(let x = 0; x < w; x++){
            for(let y = 0; y < h; y++){

                // Set default to unbroken tile
                let obj = {
                    "id": id,
                    "pos": {
                        "x": x,
                        "y": y
                    },
                    "tough": {
                        "points": generateTile(w*h),
                        "requestId": "0--0"
                    }
                };

                
                // Set map bounds tiles
                if(x === 0 || x === w-1 || y === 0 || y === h-1){ 
                    obj.tough.points = -2;
                }

                // Set dwarf base tiles
                if(x >=  1 && x <= 3 && y >= h/3 && y <= (h/3)+2){
                    obj.tough.points = 0;
                    obj.teamBase = 0;
                }
    
                // Set squirrel base tiles
                if(x >=  w-5 && x <= w-2 && y >= h/3 && y <= (h/3)+2){
                    obj.tough.points = 0;
                    obj.teamBase = 1;
                }
    
                id ++;
                tiles.push(obj);
            }
        }
        console.log('tiles', tiles);
        return tiles;
  };

 