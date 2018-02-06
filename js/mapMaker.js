  "use strict";

  const g = require("./game");

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
                        "points": 1,
                        "requestId": "0--0"
                    }
                    
                };

                obj.hard.points = 0;

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

 