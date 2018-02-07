  "use strict";

  const g = require("./game");
  const _ = require("lodash");

  let freqTable = [
        {
            'count': 0.2,
            'value': 2
        },
        {
            'count': 0.1,
            'value': 0.75
        },
        {
            'count': 0.1,
            'value': 0
        },
        {
            'count': 0.4,
            'value': 1
        },
        {
            'count': 0.2,
            'value': 0.5
        }
    ];

    let curFreqCount = {};


  let generateTile = totalTiles => {
      // Generate a random index in the frequency table
    let randFreqIndex = freqTable[Math.floor(Math.random() * freqTable.length)];

    // Add values used to list of numbers used
    curFreqCount[randFreqIndex.value] = (curFreqCount[randFreqIndex.value]+=1) || 1;

    // Remove the value from the frequency table if it's frequent enogh in curFreqCount
    if((curFreqCount[randFreqIndex.value] / totalTiles) >= randFreqIndex.count){
       _.remove(freqTable, randFreqIndex);
    }
    
    return randFreqIndex.value;
  };

  module.exports.generateTiles = (w, h) => {
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
                    "hard": {
                        "points": generateTile(w*h),
                        "requestId": "0--0"
                    }
                    
                };


                // Set map bounds tiles
                if(x === 0 || x === w-1 || y === 0 || y === h-1){ 
                    obj.hard.points = -2;
                }

                // Set dwarf base tiles
                if(x >=  1 && x <= 3 && y >= h/3 && y <= (h/3)+2){
                    obj.hard.points = 0;
                    obj.teamBase = 0;
                }
    
                // Set squirrel base tiles
                if(x >=  w-5 && x <= w-2 && y >= h/3 && y <= (h/3)+2){
                    obj.hard.points = 0;
                    obj.teamBase = 1;
                }
    
                id ++;
                tiles.push(obj);
            }
        }
        return tiles;
  };

 