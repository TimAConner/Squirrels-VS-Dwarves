  "use strict";

  module.exports.generateTiles = (w, h) => {
    let tiles = [];
        let id = 0;
        for(let x = 0; x < w; x++){
            for(let y = 0; y < h; y++){
                let obj = {
                    "id": id,
                    "pos": {
                        "x": x,
                        "y": y,
                        "z": 0
                    },
                    "size": {
                        "w": 25,
                        "h": 25
                    },
                    "hard": 1,
                };

                if(x === 0 || x === w-1){
                    obj.hard = -2;
                }
                if(y === 0 || y === y-1){
                    obj.hard = -2;
                }

                if(x >=  1 && x <= 3 && y >= h/3 && y <= (h/3)+2){
                    obj.hard = 0;
                    obj.teamBase = 0;
                }
    
                if(x >=  w-5 && x <= w-2 && y >= h/3 && y <= (h/3)+2){
                    obj.hard = 0;
                    obj.teamBase = 1;
                }
    
                id ++;
                tiles.push(obj);
            }
        }
        return tiles;
  };

 