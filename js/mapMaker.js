  "use strict";

        

    let tiles = [];

    let id = 0;
    for(let x = 0; x < 100; x++){
        
        for(let y = 0; y < 80; y++){
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
            if(x >=  5 && x <= 10 && y >= 36 && y <= 41){
                obj.hard = 0;
                obj.teamBase = 0;
            }

            if(x >=  95 && x <= 85 && y >= 36 && y <= 41){
                obj.hard = 0;
                obj.teamBase = 0;
            }

            id ++;
            tiles.push()
        }
    }

    console.log(tiles);