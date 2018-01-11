"use strict";

const mapMaker = require("./mapMaker");
const model = require("./model");

module.exports.newGame = () => {
    let createdTiles = mapMaker.generateTiles(20, 20);
    
    let teamBaseZero = createdTiles.find(x => x.teamBase === 0);
    let teamBaseOne = createdTiles.find(x => x.teamBase === 1);

    let newGems = [
        {
            "pos": {
                "x": teamBaseZero.pos.x*teamBaseZero.size.w,
                "y": teamBaseZero.pos.y*teamBaseZero.size.h
            },
            "size": {
                "h": 25,
                "w": 25
            },
            "carrier": -1,
            "team": 0,
            "type": "gem",
            "id": 0
        },
        {
            "pos": {
                "x": teamBaseOne.pos.x*teamBaseOne.size.w,
                "y": teamBaseOne.pos.y*teamBaseOne.size.h
            },
            "size": {
                "h": 25,
                "w": 25
            },
            "carrier": -1,
            "team": 1,
            "type": "gem",
            "id": 1
        }
    ];

    model.saveGem(newGems[0]);  
    model.saveGem(newGems[1]);
    model.saveNewMap(createdTiles);
};