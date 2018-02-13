  "use strict";

  const g = require("./game");
  const _ = require("lodash");

    let freqTable;

    let freqTableCopy = {
        "2":  {
            'count': 0.2,
            'value': 2
        },
        "0.75": {
            'count': 0.1,
            'value': 0.75
        },
        "0": {
            'count': 0.2,
            'value': 0
        },
        "1":  {
            'count': 0.3,
            'value': 1
        },
        "0.5": {
            'count': 0.2,
            'value': 0.5
        }
    };  


    let curFreqCount = {};



// Create half of the array.  Dupliate it, change x to right side max minues the 1.

  const generateTile = totalTiles => {
    let freqTableArray = Object.values(freqTable);

    // Generate a random index in the frequency table
    let randFreqIndex = freqTableArray[Math.floor(Math.random() * freqTableArray.length)];
    
    // Add values used to list of values already used to then be checked in the next if statment
    curFreqCount[randFreqIndex.value] = (curFreqCount[randFreqIndex.value] += 1) || 1;

    // Remove the value from the frequency table if it's frequent enough in curFreqCount
    if((curFreqCount[randFreqIndex.value] / totalTiles) >= randFreqIndex.count){
        delete freqTable[randFreqIndex.value];
    }
    
    return randFreqIndex.value;
  };

  const resetTileGenerator = () => {
    curFreqCount = {};
    // Copy frequency table copy.
    freqTable = Object.assign({}, freqTableCopy);
  };

  module.exports.generateTiles = (w, h) => {

    resetTileGenerator();

    let tiles = [];
    let id = 0;

    let halfW = Math.floor(w/2)+1;

    // Create half the map
    for(let x = 0; x < halfW; x++){
        for(let y = 0; y < h; y++){
            // Set default to unbroken tile
            let obj = {
                "id": id,
                "pos": {
                    "x": x,
                    "y": y
                },
                "tough": {
                    "points": generateTile(halfW*h),
                    "requestId": "0--0"
                }
            };

            id ++;
            tiles.push(obj);
        }
    }

    // Duplicate tiles and mirror it.
    let tilesCopy = tiles.map(({id, pos: {x, y}, tough}) => {
        id += 200;
        x = w - x;
        return {id, pos: {x, y},  tough};
    });

    // Join both sides of the map.
    tiles = [...tiles, ...tilesCopy];

    // Set teams bases and map boundaries.
    tiles.map(tile => {
        let x = tile.pos.x;
        let y = tile.pos.y;


        const specialTiles = {
            MapBound: {
                is: () => x === 0 || x === w || y === 0 || y === (h-1),
                set: () => {tile.tough.points = -2;}
            },
            SquirrelBase: {
                is: () => x >=  w-5 && x <= w-2 && y >= h/3 && y <= (h/3)+2,
                set: () => {tile.tough.points = 0; tile.teamBase = 1;}
            },
            DwarfBase: {
                is: () => x >=  1 && x <= 3 && y >= h/3 && y <= (h  /3)+2,
                set: () => {tile.tough.points = 0; tile.teamBase = 0;}
            }
        };
    
        for(let type in specialTiles){
            if(specialTiles[type].is()) specialTiles[type].set();
        }

        return tile;
    });
    
    return tiles;
  };

 