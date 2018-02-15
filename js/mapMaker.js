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
            'count': 0.15,
            'value': 0
        },
        "1":  {
            'count': 0.35,
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

    let halfW = Math.floor(w/2);
    console.log('halfW', halfW);
    console.log('h', h);
    // Create half the map
    for(let x = 0; x <= halfW; x++){
        for(let y = 0; y <= h; y++){
            // Set default to unbroken tile
            let obj = {
                "id": id,
                "pos": {
                    "x": x,
                    "y": y
                },
                "tough": {
                    "points": generateTile((halfW+1)*(h+1)),
                    "requestId": "0--0"
                },
                "teamBase": -1
            };

            const specialTiles = {
                Base: {
                    is: () => x >=  1 && x <= 3 && y >= h/3 && y <= (h/3)+2,
                    set: () => {obj.tough.points = 0; obj.teamBase = 0;}
                }
            };
        
            for(let type in specialTiles){
                if(specialTiles[type].is()) specialTiles[type].set();
            }

            id ++;
            tiles.push(obj);
        }
    }

    // Duplicate tiles and mirror it.
    let tilesCopy = tiles.map(({id, pos: {x, y}, tough, teamBase}) => {
        // Continue giving a unique id to the tiles
        id += Math.floor((w*h)/2);

        // Flip the x and y coordinates
        x = w - x;
        y = h - y;

        if(teamBase === 0){
            teamBase = 1;
        }
        return {id, pos: {x, y},  tough, teamBase};
    });

    // Join both sides of the map.
    console.log('[...tiles]', [...tiles]);
    console.log('[...tilesCopy]', [...tilesCopy]);
    tiles = [...tiles, ...tilesCopy];
    console.log('tiles', tiles);
    // Set teams bases and map boundaries.
    tiles.map(tile => {
        let x = tile.pos.x;
        let y = tile.pos.y;


        const specialTiles = {
            MapBound: {
                is: () => x === 0 || x === w || y === 0 || y === h,
                set: () => {tile.tough.points = -2;}
            }
        };
    
        for(let type in specialTiles){
            if(specialTiles[type].is()) specialTiles[type].set();
        }

        if(tile.teamBase === -1){
            delete tile.teamBase;
        }
        return tile;
    });
    
    return tiles;
  };

 