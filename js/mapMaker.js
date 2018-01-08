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
                if(x >=  0 && x <= 5 && y >= h/2 && y <= (h/2)+5){
                    obj.hard = 0;
                    obj.teamBase = 0;
                }
    
                if(x >=  w-5 && x <= w && y >= h/2 && y <= (h/2)+5){
                    obj.hard = 0;
                    obj.teamBase = 1;
                }
    
                id ++;
                tiles.push(obj);
            }
        }
        return tiles;
  };

 