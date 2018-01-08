"use strict";
/*
Using information by :

Isaac Sukin
http://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing

Gabriel Gambetta
http://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html

Bahlor
https://coderwall.com/p/iygcpa/gameloop-the-correct-way

*/
const model = require("./model");
const view = require("./view");
const g = require("./game");
const mapMaker = require("./mapMaker");

// 0 menu, 1 game, 2 winner

let onlineGameState = 1;
let localGameState = 0;
let waitingForGame = false;


let winner = 0;

let playerId = "0";


let players = [];
let tiles = [];
let gems = [];

let previousPlayerActions = [];
let completedActions = [];

let newPlayers = [];
let newTiles = [];
let newGems = [];



let speedMultiplier = 0.1;




//  Use timestamp instead?
let keys = {
    left: { active: false, id: 37},
    right: { active: false, id: 39},
    up: { active: false, id: 38}, 
    down: { active: false, id: 40},
    space: { active: false, id: 32},
    d: { active: false, id: 68},
    s: { active: false, id: 83}
};

// Generated on runtime
let keyIds = [];


let initialTileDraw = true;
let initialPlayerDraw = true;
let initialGemDraw = true;

let timestep = 1000 / 60,
delta = 0,
lastFrameTimeMs = 0;

const canMove = (direction, obj, delta) => {
    let objLeftPoint = obj.pos.x,
    objRightPoint = obj.pos.x+obj.size.w,
    objBottomPoint = obj.pos.y+obj.size.h,
    objTopPoint = obj.pos.y;

    let increment = speedMultiplier*delta;

    for(let i = 0; i < tiles.length; i++){

        let tileXPosition = (tiles[i].pos.x*tiles[i].size.w),
        tileYPosition = (tiles[i].pos.y*tiles[i].size.h);

        let tileRightPoint = tileXPosition + tiles[i].size.w,
        tileLeftPoint = tileXPosition,
        tileBottomPoint = tileYPosition + tiles[i].size.h,
        tileTopPoint = tileYPosition;
        
       if(tiles[i].hard > 0 ){
            if(((objTopPoint > tileTopPoint && objTopPoint < tileBottomPoint) || (objBottomPoint > tileTopPoint && objBottomPoint < tileBottomPoint))){
                if(direction === "left"){
                    if((((objLeftPoint-increment) < tileRightPoint && (objLeftPoint-increment) > tileLeftPoint))){
                        // console.log(tileLeftPoint, (objLeftPoint-increment), tileRightPoint);
                        // console.log("left");
                        return false;
                    }
                } else if (direction === "right"){
                    if(((((objRightPoint+increment) > tileLeftPoint) && (objRightPoint+increment) < tileRightPoint))){
                        // console.log("right");
                        return false;
                    }
                }
            }

            if( (objRightPoint > tileLeftPoint && objRightPoint < tileRightPoint) ||  (objLeftPoint < tileRightPoint && objLeftPoint > tileLeftPoint)){
                if(direction === "up"){
                    if(((objTopPoint-increment) > tileTopPoint && (objTopPoint-increment) < tileBottomPoint)){
                        // console.log("up");
                        return false;
                   }
                } else if(direction === "down"){
                    if((objBottomPoint+increment) > tileTopPoint && (objBottomPoint+increment) < tileBottomPoint){
                        // console.log(tileBottomPoint, objTopPoint, tileTopPoint);
                        // console.log(tileBottomPoint, objBottomPoint , tileTopPoint);
                        // console.log("down");
                        return false;
                   }
                }
            }
        }
    }

    return true;
};

const findTileBelowPlayer = (player) => {

    let playerX = (player.pos.x+player.size.w/2),
    playerY = (player.pos.y+player.size.h/2);    

    let sortedTiles = tiles.slice().sort((a, b) => {
        let tileAX= a.pos.x*a.size.w,
        tileAY = a.pos.y*a.size.h;
        
        let tileBX= b.pos.x*b.size.w,
        tileBY = b.pos.y*b.size.h;

        let tileAXDifference = (player.pos.x) - (tileAX),
        playerAYDIfference = (player.pos.y) - (tileAY),
        tileADistance = Math.sqrt(tileAXDifference*tileAXDifference + playerAYDIfference*playerAYDIfference);

        let tileBXDifference = (player.pos.x) - (tileBX),
        playerBYDIfference = (player.pos.y) - (tileBY),
        tileBDistance = Math.sqrt(tileBXDifference*tileBXDifference + playerBYDIfference*playerBYDIfference);
        
        return Math.abs(tileADistance) - Math.abs(tileBDistance); 
    });

    // let tile = tiles.find(t => {
    //     let tileLeftPoint = t.pos.x*t.size.w,
    //     tileTopPoint = t.pos.y*t.size.h;

    //     let tileRightPoint = tileLeftPoint + t.size.w,
    //     tileBottomPoint = tileTopPoint + t.size.h;
        
    //     return playerX >= tileLeftPoint && playerX <= tileRightPoint && playerY >= tileTopPoint && playerY <= tileBottomPoint;
    // });

    return sortedTiles[0];
};

const findTileInDirection = (player) => {

    // let tile = tiles.find(x => {
    //     let leftSide = (x.pos.x*x.size.w),
    //     rightSide = (x.pos.x*x.size.w)+x.size.w;
    
    //     return player.x.pos > leftSide && player.x.pos < rightSide && 

    // });

    // console.log(tile.pos.x, " ", tile.pos.y);

    let direction = player.dir;

    // Find tile based on middle of player.

    let tileX = Math.floor((player.pos.x+player.size.w/2) / g.tileSize),
    tileY = Math.floor((player.pos.y+player.size.h/2) / g.tileSize);

    // console.log(tileX, tileY);
    if(direction === "up"){
        tileY -= 1;
    } else if(direction === "down"){
        tileY += 1;
    } else if(direction === "left"){
        tileX -= 1;
    } else if(direction === "right"){
        tileX += 1;
    }

    // console.log(tileX, tileY);
    let tile = tiles.find(t => t.pos.x === tileX && t.pos.y === tileY);
    // console.log(tile);


    return tile;
};

const isKeyOn = (prop) => {
    if(keys[prop].active === true){
        return true;
    } else {
        return false;
    }
};

const findCloseGem = (player) => {
    let gem = gems.find((gem) => {

        let a = (player.pos.x) - (gem.pos.x),
        b = (player.pos.y) - (gem.pos.y),

        distance = Math.sqrt(a*a + b*b);
        console.log(Math.abs(distance));
        return Math.abs(distance) <= 15; // 10 Pixels
    });

    return gem;
};

const getGemOnTile = (tile) => {
    let gem = gems.find((gem) => {
        let tileXPosition = (tile.pos.x*tile.size.w),
        tileYPosition = (tile.pos.y*tile.size.h);

        let tileRightPoint = tileXPosition + tile.size.w,
        tileLeftPoint = tileXPosition,
        tileBottomPoint = tileYPosition + tile.size.h,
        tileTopPoint = tileYPosition;        

        // console.log(gem.team, tileLeftPoint, gem.pos.x, tileRightPoint, tileTopPoint, gem.pos.y, tileBottomPoint);
        return gem.carrier === -1 && gem.pos.x >= tileLeftPoint && gem.pos.x <= tileRightPoint && gem.pos.y >= tileTopPoint && gem.pos.y <= tileBottomPoint;
    });

    // console.log('gem', gem);
    return gem;
};

const setWinner = (teamId) => {
    console.log("set winner");
    let winningObject = {
        gameState: 2,
        winningTeam: teamId
    };
    model.saveGameState(winningObject);
};

const initiateGameState = () => {
    waitingForGame = true;
    
    let winningObject = {
        gameState: 1,
        winningTeam: 0
    };
    model.saveGameState(winningObject);
    
};

const update = (delta) => { // new delta parameter
    // boxPos += boxVelocity * delta; // velocity is now time-sensitive

    if(newPlayers !== null){
        for(let i = 0; i < newPlayers.length; i++){
            if(!previousPlayerActions.includes(newPlayers[i].requestId) && newPlayers[i] !== players[i] && newPlayers[i].requestId !== undefined){
                // console.log("New player", newPlayers[i].requestId,  players[i]);
                players[i] = newPlayers[i];
                previousPlayerActions.push(newPlayers[i].requestId);
                // console.log(newPlayers[i].requestId);
            } else {
                // let index = previousPlayerActions.indexOf(newPlayers[i].requestId);
                // previousPlayerActions.splice(index, 1);
                // console.log(previousPlayerActions);
                completedActions.push(newPlayers[i].requestId);
            }
        }
        newPlayers = null;
    }
   
    // This will be triggered each time the player moves, because both are being updated.

    if(newTiles !== null){
        for(let i = 0; i < newTiles.length; i++){

            // The issue that is happening:  Data is being recieved, and that data says x block is gone, but the rest are still there. So, it puts rest there and deletes block.  Does that all the way through.

            // Need to only update the new blocks, not the old blocks.
            

            // See if you can see only the changed data.  The new data.
            
            if(newTiles[i] !== tiles[i] && !previousPlayerActions.includes(newTiles[i].requestId) && newTiles[i].requestId !== undefined){
                tiles[i] = newTiles[i];
                previousPlayerActions.push(newTiles[i].requestId);
                // console.log(newTiles[i].requestId);
            }
            
        }
        newTiles = null;
        // initialTileDraw = false;
    }

    
    if(newGems !== null && newGems !== undefined){
        for(let i = 0; i < newGems.length; i++){
            if(newGems[i] !== gems[i] && !previousPlayerActions.includes(newGems[i].requestId) && newGems[i].requestId !== undefined){
                gems[i] = newGems[i];
                previousPlayerActions.push(newGems[i].requestId);
                // console.log(newGems[i].requestId);
            }
            
        }
        newGems = null;
        // initialTileDraw = false;
    }
    
    /*
        Controls
    */

    if(playerId !== undefined){

        let player = players.find(x => x.id === playerId);
        // console.log(player);
        // console.log(playerId);
        if(player !== undefined){
           
            // The saving here is not the jerky issue.  THe issue is the loading.
            let requestId = `${Date.now()}-${playerId}`;
        //    console.log(requestId);

        // console.log(findTileBelowPlayer(player).id);

            if(isKeyOn("up") && canMove("up", player, delta)){
                players[players.indexOf(player)].pos.y -= speedMultiplier * delta;
                players[players.indexOf(player)].dir = "up";
                // requestId += `01`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayer(players[players.indexOf(player)]);
            } else if (isKeyOn("down") && canMove("down", player, delta)){
                players[players.indexOf(player)].pos.y += speedMultiplier * delta;
                players[players.indexOf(player)].dir = "down";
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayer(players[players.indexOf(player)]);
            } else if(isKeyOn("left") && canMove("left", player, delta)){
                players[players.indexOf(player)].pos.x -= speedMultiplier * delta;
                players[players.indexOf(player)].dir = "left";
                // requestId += `02`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayer(players[players.indexOf(player)]);
            } else if(isKeyOn("right") && canMove("right", player, delta)){
                players[players.indexOf(player)].pos.x += speedMultiplier * delta;
                players[players.indexOf(player)].dir = "right";
                // requestId += `03`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayer(players[players.indexOf(player)]);
            } else if(isKeyOn("space")){
                // If there is an object in front of you
                let selectedTile = findTileInDirection(player);
                if(selectedTile !== undefined){
                    if(selectedTile.hard !== -1){
                        tiles[tiles.indexOf(selectedTile)].hard -= 0.01;
                        // console.log(selectedTile);
                        previousPlayerActions.push(requestId);
                        tiles[tiles.indexOf(selectedTile)].requestId = requestId;
                        model.saveTile(tiles[tiles.indexOf(selectedTile)]); 
                    }
                }
                
            } else if(isKeyOn("s")){
                let selectedTile = findTileBelowPlayer(player);

                if(selectedTile  !== undefined){
                    let gemOnTile = findCloseGem(player);
                    // console.log('gemOnTile', gemOnTile);
                    if(gemOnTile !== undefined && gemOnTile.carrier === -1 && gemOnTile.team !== player.team){
                        gemOnTile.carrier = player.id;
                        previousPlayerActions.push(requestId);
                        gems[gems.indexOf(gemOnTile)].requestId = requestId;
                        model.saveGem(gems[gems.indexOf(gemOnTile)]); 
                    }
                } 
            
            } else if(isKeyOn("d")){
                // If there is an object in front of you
                let selectedTile = findTileBelowPlayer(player);
                console.log(selectedTile);
                // If there is a tile that it can be dropped on,
                if(selectedTile !== undefined){

                    let gemOnTile = getGemOnTile(selectedTile);
                    
                    // if the gem is not on a tile
                    if(gemOnTile === undefined ){

                         // If player has gem,
                        let carriedGem = gems.find(x => x.carrier === playerId);

                        if(carriedGem !== undefined){
                            // Drop gems
                            carriedGem.carrier = -1;
                            // carriedGem.pos.x = selectedTile.pos.x*g.tileSize;
                            // carriedGem.pos.y = selectedTile.pos.y*g.tileSize;
                            carriedGem.pos.x = player.pos.x;
                            carriedGem.pos.y = player.pos.y;
                            previousPlayerActions.push(requestId);
                            gems[gems.indexOf(carriedGem)].requestId = requestId;
                            if(selectedTile.teamBase === player.team){
                                console.log("here");
                                setWinner(player.team);
                            }
                            model.saveGem(gems[gems.indexOf(carriedGem)]); 
                        }
                    }
                }      
            }
        }
    }
};

const mainLoop = (timestamp) => {
    
    
    if (onlineGameState === 2 && localGameState === 1){ // Winner
        view.viewWinnerScreen(winner);
    } else if(localGameState === 1 && onlineGameState === 1){  // Game Playing
        view.viewGame();
        waitingForGame = false;

        // Track the accumulated time that hasn't been simulated yet
        delta += timestamp - lastFrameTimeMs; // note += here
        lastFrameTimeMs = timestamp;
        
        // cleanupRequest();
        // console.log('previousPlayerActions', previousPlayerActions);
        // console.log('completedActions', completedActions);

        // Simulate the total elapsed time in fixed-size chunks
        while (delta >= timestep) {
            update(timestep);
            delta -= timestep;
        }

        view.draw(playerId, tiles, players, gems);

        // 

        
    } else if (localGameState === 0){ // Menu
        view.viewMainMenu();
    }  

    if(waitingForGame === true){
        view.showLoadingScreen();
    }
    requestAnimationFrame(mainLoop);
};

const cleanupRequest = () => {
    for(let i = 0; i < completedActions.length; i++){
        let index = previousPlayerActions.indexOf(completedActions[i]);
        if(index !== -1){
            previousPlayerActions.splice(index, 1);

        //      /* jshint ignore:start */
        // if(index !== -1){
        //     previousPlayerActions.splice(index, 1);
        //     previousPlayerActions = previousPlayerActions.filter((x) => { 
        //         let idFormat = /(.*)-(.*)/;

        //         let xSubstring = x.match(idFormat);
        //         let completedActionSubstring = completedActions[i].match(idFormat);

        //         console.log(+completedActionSubstring[1], +xSubstring[1]);
        //         return (xSubstring[2] !== completedActionSubstring[2]) || ((xSubstring[2] == completedActionSubstring[2]) && (+xSubstring[1] - +completedActionSubstring[1] >= 0));
        //     });
        // }
        // /* jshint ignore:end */


        }
    }
    completedActions = [];
    // console.log(previousPlayerActions.length);

    // New player is being updated before it can be run through to check if there is new data. 
};

const populateKeyIds = ()  => {
    for(let key in keys){
        keyIds.push(keys[key].id);
    }
};

module.exports.startGame = () => {
    populateKeyIds();
    model.fetchData();
    activateServerListener();
    activateButtons();
    requestAnimationFrame(mainLoop);

    document.getElementById('player-id').addEventListener("change", function(){

        if(players.length > this.value && this.value >= 0){
            playerId = this.value;
        } else {
            window.alert("Player does not exist.");
        }
    });

};

const activateButtons = () => {
    document.getElementById("back-to-main-menu").addEventListener("click", () => {
        // view.viewMainMenu();
        localGameState = 0;
        // console.log("clicked");
    });

    document.getElementById("add-player").addEventListener("click", () => {
        // view.viewMainMenu();
        
        // console.log("clicked");

        let spawnPoint = tiles.find(x => x.teamBase === 0);
        console.log(spawnPoint);
        model.addNewPlayer(players.length, 0, spawnPoint.pos.x*spawnPoint.size.w, spawnPoint.pos.y*spawnPoint.size.h);
    });

    document.getElementById("add-player-2").addEventListener("click", () => {
        // view.viewMainMenu();
        
        // console.log("clicked");
        
        
        let spawnPoint = tiles.find(x => x.teamBase === 1);
        console.log(spawnPoint);
        model.addNewPlayer(players.length, 1, spawnPoint.pos.x*spawnPoint.size.w, spawnPoint.pos.y*spawnPoint.size.h);
    });

    document.getElementById("main-menu-play").addEventListener("click", () => {
        view.viewGame();
        initiateGameState();
        // onlineGameState = 1;
        localGameState = 1;
        // console.log("clicked");
    });

    document.getElementById("main-menu-new").addEventListener("click", () => {
        newGame();
    });
};

const newGame = () => {
    let createdTiles = mapMaker.generateTiles(20, 20);
    tiles = createdTiles;
    // console.log(createdTiles);
    
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

const activateServerListener = () => {
    
    g.c.addEventListener("serverUpdateGems", (e) => {
        if(initialGemDraw === true){
            console.log(gems);
            gems = e.detail.gems;
            initialGemDraw = false;
        } else {
            console.log(gems);
            newGems = e.detail.gems;
        }        
    });

    g.c.addEventListener("serverUpdatePlayer", (e) => {

        // console.log("player", e.detail);
        if(initialPlayerDraw === true){
            players = e.detail.players;
            console.log(players);
            initialPlayerDraw = false;
        } else {
            newPlayers = e.detail.players;
        }

        // Update list of players
        
        // console.log('players', newPlayers);
        // console.log('tiles', newTiles);

    });
    g.c.addEventListener("serverUpdateTiles", (e) => {
        // console.log("tile", e.detail);
        for(let i = 0; i < e.detail.tiles.length; i++){
            e.detail.tiles[i].id = i;
        }

        if(initialTileDraw === true){
            tiles = e.detail.tiles;
            initialTileDraw = false;
        } else {
            newTiles = e.detail.tiles;
        }

    });

    g.c.addEventListener("serverUpdateGameState", (e) => {
        onlineGameState = e.detail.gameState; 
        winner = e.detail.winningTeam; 
    });

};


// Prevent key defaults
window.addEventListener("keydown", function(e) {
    if(keyIds.indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

// When a key is pressed, set it to true.
window.onkeydown = function() {
    for(let prop in keys){
        if(keys[prop].id == event.keyCode){
            keys[prop].active = true;
        }
    }
};

// When a key is up, set it to false.
window.onkeyup = function() {
    for(let prop in keys){
        if(keys[prop].id == event.keyCode){
            keys[prop].active = false;
        }
    }
};