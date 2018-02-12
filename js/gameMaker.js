"use strict";

const mapMaker = require("./mapMaker");
const model = require("./model");
const g = require("./game");

module.exports.addPlayer = (teamId, tiles, playersLength) =>  {
    let spawnPoint = tiles.find(x => x.teamBase === teamId); 
    let newPlayerId = typeof playersLength !== undefined ? playersLength : 0;

    let player = {
        "id": newPlayerId,
        "team": teamId,
        "pos": {
            "x": spawnPoint.pos.x*g.tileSize,
            "y": spawnPoint.pos.y*g.tileSize,
            "z": 0,
            "requestId": "0--0",
            "dir": "up",
            "animDirHorizontal": "right",
            "animDirVertical": "none"
        },
        "health": {
            "points": 100,
            "requestId": "0--0"
        },
        "uid": g.uid
    };

    model.addNewPlayer(player);  
    console.log('g.playerId', g.playerId);
    g.playerId = newPlayerId;
};

module.exports.addGame = () => {
    return new Promise(function (resolve, reject){
        let createdTiles = mapMaker.generateTiles(20, 20);
        
        let teamBaseZero = createdTiles.find(x => x.teamBase === 0),
        teamBaseOne = createdTiles.find(x => x.teamBase === 1);

        let newGems = [
            {
                "pos": {
                    "x": teamBaseZero.pos.x*g.tileSize,
                    "y": teamBaseZero.pos.y*g.tileSize
                },
                "carrier": -1,
                "requestId": "0--0",
                "team": 0,
                "type": "gem",
                "id": 0
            },
            {
                "pos": {
                    "x": teamBaseOne.pos.x*g.tileSize,
                    "y": teamBaseOne.pos.y*g.tileSize
                },
                "carrier": -1,
                "requestId": "0--0",
                "team": 1,
                "type": "gem",
                "id": 1
            }
        ];

        let gemPromise1 = model.saveGem(newGems[0]);  
        let gemPromise2 =  model.saveGem(newGems[1]);
        let mapPromise = model.saveNewMap(createdTiles);
        let gameStatePromise = model.saveGameState({
            "gameState" : 1,
            "winningTeam": 0
        });

        Promise.all([gemPromise1, gemPromise2, mapPromise, gameStatePromise])
        .then(function(values) {
            resolve();
        });

    });
};