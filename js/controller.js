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
const $ = require("jquery");
const gameMaker = require("./gameMaker");

const _ = require("lodash");

// 0 menu, 1 game, 2 winner

let onlineGameState = null;
let localGameState = 0;
let waitingForGame = false;


let winner = 0;


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
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false, 
    ArrowDown: false,
    " ": false,
    d: false,
    s: false
};



let initialTileDraw = true;
let initialPlayerDraw = true;
let initialGemDraw = true;

let timestep = 1000 / 60,
delta = 0,
lastFrameTimeMs = 0;


let lag = 0,
mostRecentRecieved = 0;


const canMove = (direction, obj, delta) => {
    let objLeftPoint = obj.pos.x,
    objRightPoint = obj.pos.x+obj.size.w,
    objBottomPoint = obj.pos.y+obj.size.h,
    objTopPoint = obj.pos.y;

    let increment = speedMultiplier*delta;

    for(let i = 0; i < tiles.length; i++){

        let tileXPosition = g.calcTilePos(tiles[i]).x,
        tileYPosition = g.calcTilePos(tiles[i]).y;

        let tileRightPoint = tileXPosition + tiles[i].size.w,
        tileLeftPoint = tileXPosition,
        tileBottomPoint = tileYPosition + tiles[i].size.h,
        tileTopPoint = tileYPosition;
        
       if(tiles[i].hard.points > 0 || tiles[i].hard.points === -2){ // If it  is still hard or if hardness is -2, unbreakable.
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



const findTileInDirection = (player) => {

    // let tile = tiles.find(x => {
    //     let leftSide = (x.pos.x*x.size.w),
    //     rightSide = (x.pos.x*x.size.w)+x.size.w;
    
    //     return player.x.pos > leftSide && player.x.pos < rightSide && 

    // });

    // console.log(tile.pos.x, " ", tile.pos.y);

    let direction = player.pos.dir;

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
    if(keys[prop] === true){
        return true;
    } else {
        return false;
    }
};


// Takes two pos and deals with distance.
const calcDistance = (posA,  posB) => {
    
    let a = (posA.x) - (posB.x),
    b = (posA.y) - (posB.y);

    let distance = Math.sqrt(a*a + b*b);

    return Math.abs(distance); 
};



const findCloseGem = (player) => {
    let gem = gems.find((gem) => {

        let a = (player.pos.x) - (gem.pos.x),
        b = (player.pos.y) - (gem.pos.y),

        distance = Math.sqrt(a*a + b*b);
        // console.log(Math.abs(distance));
        return Math.abs(distance) <= 15; // 10 Pixels
    });

    return gem;
};

const getGemOnTile = (tile) => {
    let gem = gems.find((gem) => {
        let tileXPosition = g.calcTilePos(tile).x,
        tileYPosition = g.calcTilePos(tile).y;

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

const parseRequestId = (requestId) => {
    let values = requestId.match("(.*)-(-.*)");
    return values;
};

const calculateLag = (miliseconds) => {
    lag = Date.now() - miliseconds;
};

const proccessNewData = (currentData, newData, valuesToCheck) => {
    if(newData !== null && typeof newData !== "undefined"){

        // Create an array of new and olds ids
        let curIdList = currentData.map(data => data.id),
        newIdList = newData.map(data => data.id);

        if(newIdList.length !== 0){
            let addedValues =  _.difference(newIdList, curIdList),
            deletedValues =  _.difference(curIdList, newIdList);
            
            // Remove values not present
            for(let i = 0; i < deletedValues.length; i ++){
                currentData.splice(curIdList.indexOf(deletedValues[i]), 1);
            }

            // Add values present
            for(let i = 0; i < addedValues.length; i++){
                currentData.push(newData.find(data => data.id === addedValues[i])); // jshint ignore:line
            }
        }

        // Change existing values
        for(let i = 0; i < newData.length; i++){

            if(typeof valuesToCheck === "undefined"){ // If no specific value should be proccessed, update the whole object
                let newRequestId = +parseRequestId(newData[i].requestId)[1];
                let curRequestId = +parseRequestId(currentData[i].requestId)[1];
                // If the new values also have a newer timestamp
                calculateLag(newRequestId); 
                if(typeof newData[i].requestId !== "undefined" && newData[i] !== currentData[i] && !previousPlayerActions.includes(newData[i].requestId)){
                    if((newRequestId >= curRequestId)){
                        currentData[i] = newData[i];
                        previousPlayerActions.push(newData[i].requestId);
                    }
                }
            } else { // If specific values should be proccesed, update only those values.
                for(let j = 0; j < valuesToCheck.length; j++){
                    let newRequestId = +parseRequestId(newData[i][valuesToCheck[j]].requestId)[1];
                    let curRequestId = +parseRequestId(currentData[i][valuesToCheck[j]].requestId)[1];
                    calculateLag(newRequestId);
                    if(typeof newData[i][valuesToCheck[j]] !== "undefined" && !previousPlayerActions.includes(newData[i][valuesToCheck[j]].requestId)){ 

                        if(!previousPlayerActions.includes(newData[i][valuesToCheck[j]].requestId) && (newRequestId >= curRequestId)){ // If this game has not proccessed it and the value is not an old one
                            previousPlayerActions.push(newData[i][valuesToCheck[j]].requestId);
 
                            currentData[i][valuesToCheck[j]] = newData[i][valuesToCheck[j]];
                            // console.log('newRequestId, lag', newRequestId, lag);
                        }
                    }
                }
            }
        }
        newData = null;
    }
};

// const updateGemPosition = () => {   
//     gems = gems.map(gem => {
//         if(gem.carrier !== -1){
//             let carrier = players.find(player => player.id === gem.carrier); // jshint ignore:line
//             gem.pos.x = carrier.pos.x+(gem.size.w/4);
//             gem.pos.y = carrier.pos.y+(gem.size.h/4);
//         }
//         return gem;
//     });gems[gems.indexOf(carriedGem)]
// };


const updateGemPosition = () => {
    for(let i = 0; i < gems.length; i++){
        if(gems[i].carrier !== -1){
            let carrier = players.find(player => player.id === gems[i].carrier); // jshint ignore:line
            gems[i].pos.x = carrier.pos.x;
            gems[i].pos.y = carrier.pos.y;
        }
    }
};


const update = (delta) => { // new delta parameter
    // boxPos += boxVelocity * delta; // velocity is now time-sensitive
    
 
    // console.log("gems", gems);
    
    updateGemPosition();
    /*
        Controls
    */


    if(typeof g.playerId !== "undefined"){

        let player = players.find(x => x.id == g.playerId);

        if(typeof player !== "undefined" && player.health.points > 0){

            let requestId = `${Date.now()}-${g.playerId}`;

            let playerUpdateObject = {
                player: players[players.indexOf(player)],
                requestId,
                delta,
                speedMultiplier,
            };

            if(isKeyOn(" ")){
                // If there is an object in front of you
                let selectedTile = findTileInDirection(player);
                if(typeof selectedTile !== "undefined"){
                    // Check if player is near

                    let targetPlayer = null;

                    for(let i = 0; i < players.length; i++){
                        let otherPlayersTile = g.findTileBelowPlayer(players[i], tiles);

                        // The logic that you find a tile in a direction, which is one away, and you check the attack distance, is convoluted.  This is saying if they are within 1 of the square in front of you.

                        if(calcDistance(g.calcTilePos(selectedTile), g.calcTilePos(otherPlayersTile))/g.tileSize <= g.attackDistance && players[i].id !== player.id){
                            targetPlayer = players[i];
                            break;
                        }
                    }
                    
                    // If there is a player in the direction within 1, then attack.
                    
                    if(targetPlayer !== null && targetPlayer.id !== player.id && targetPlayer.team !== player.team && targetPlayer.health.points > 0){
                        targetPlayer.health.points -= g.attackStrength;
                        addRequestId(targetPlayer.health, requestId);
                        // console.log(targetPlayer.health);
                        model.savePlayerHealth(targetPlayer); 

                    } else { // Else mine a block
                        if(selectedTile.hard.points !== -1 && selectedTile.hard.points !== -2){ // -1 is mined, -2 is unbreakable
                            tiles[tiles.indexOf(selectedTile)].hard.points -= g.mineStrength;
                            addRequestId(tiles[tiles.indexOf(selectedTile)].hard, requestId);
                            model.saveTileHard(tiles[tiles.indexOf(selectedTile)]); 
                        }
                    }
                    
                }
                
            } else if(isKeyOn("s")){
                let selectedTile = g.findTileBelowPlayer(player, tiles);

                if(typeof selectedTile  !== "undefined"){
                    let gemOnTile = findCloseGem(player);
                    // console.log('gemOnTile', gemOnTile);
                    if(typeof gemOnTile !== "undefined" && gemOnTile.carrier === -1 && gemOnTile.team !== player.team){
                        gemOnTile.carrier = player.id;
                        addRequestId(gems[gems.indexOf(gemOnTile)], requestId);
                        model.saveGem(gems[gems.indexOf(gemOnTile)]).then(() => {console.log("saved");}); 
                    }
                } 
            
            } else if(isKeyOn("d")){
                // If there is an object in front of you
                let selectedTile = g.findTileBelowPlayer(player, tiles);
                
                // If there is a tile that it can be dropped on,
                if(typeof selectedTile !== "undefined"){

                    let gemOnTile = getGemOnTile(selectedTile);
                    
                    // if the gem is not on a tile
                    if(typeof gemOnTile === "undefined" ){

                         // If player has gem,
                        let carriedGem = gems.find(x => x.carrier === g.playerId);

                        if(typeof carriedGem !== "undefined"){

                            // Drop gems
                            carriedGem.carrier = -1;
                            
                            addRequestId(gems[gems.indexOf(carriedGem)], requestId);

                            if(selectedTile.teamBase === player.team){
                                setWinner(player.team);
                            }
                            
                            model.saveGem(gems[gems.indexOf(carriedGem)]).then(() => {console.log("saved");}); 
                        }
                    }
                }      
            } 
            
            if(isKeyOn("ArrowUp") && canMove("up", player, delta)){
                updatePlayerState("up", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowUp") && player.pos.dir !== "up"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("up", "y", playerUpdateObject);
            } else if (isKeyOn("ArrowDown") && canMove("down", player, delta)){

                updatePlayerState("down", "y", playerUpdateObject);

            } else if(isKeyOn("ArrowDown") && player.pos.dir !== "down"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("down", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowLeft") && canMove("left", player, delta)){
                updatePlayerState("left", "x", playerUpdateObject);

            } else if(isKeyOn("ArrowLeft") && player.pos.dir !== "left"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("left", "x", playerUpdateObject);
            } else if(isKeyOn("ArrowRight") && canMove("right", player, delta)){

                updatePlayerState("right", "x", playerUpdateObject);
            
            } else if(isKeyOn("ArrowRight") && player.pos.dir !== "right"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("right", "x", playerUpdateObject);
            }
        }
    }
};

const addRequestId = (object, requestId) => {
    previousPlayerActions.push(requestId);
    object.requestId = requestId;
};

const updatePlayerState = (direction,  changeIn, options) => {
    if(direction === "up" || direction === "left"){
        options.speedMultiplier = -options.speedMultiplier;
    }


    options.player.pos[changeIn] += options.speedMultiplier * options.delta;
    options.player.pos.dir = direction;

    addRequestId(options.player.pos, options.requestId);
    model.savePlayerPos(options.player);
};




const mainLoop = (timestamp) => {

    if(onlineGameState === null){ // Page is loading
        view.showLoadingScreen();
    } else if (onlineGameState === 2 && localGameState === 1){ // Winner
        view.viewWinnerScreen(winner);
    } else if(localGameState === 1 && onlineGameState === 1){  // Game Playing
        view.viewGame();
        waitingForGame = false;

        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

        while (delta >= timestep) {

            proccessNewData(players, newPlayers, ["health", "pos"]);
            proccessNewData(tiles, newTiles, ["hard"]);
            proccessNewData(gems, newGems);
            
            update(timestep);

            delta -= timestep;
        }

        view.draw(g.playerId, tiles, players, gems, lag);

    } else if (localGameState === 0){ // Menu
        view.viewMainMenu();

        if($(".add").length === 0){
            let playerIds = players.map(x => x.id);
            // console.log('playerIds', playerIds);
            view.setPlayers(playerIds);
        } else {
            let playerIds = players.map(x => x.id);
            view.setPlayers(playerIds);
        }
        // else if($("#player-lobby .add").length !== newPlayers.length){
            // console.log('newPlayers', newPlayers);
          
        // }
    }  

    if(waitingForGame === true){  // Load screen
        view.showLoadingScreen();
    }
    requestAnimationFrame(mainLoop);
};



module.exports.startGame = () => {
    model.fetchData();
    activateServerListener();
    activateButtons();
    requestAnimationFrame(mainLoop);

};

const startPlay = () => {
    view.viewGame();
    initiateGameState();
    localGameState = 1;
};

const activateButtons = () => {
    document.getElementById("back-to-main-menu").addEventListener("click", () => {
        localGameState = 0;
    });

    document.getElementById("add-player").addEventListener("click", () => {
        gameMaker.addPlayer(0, tiles, players.length);
    });

    document.getElementById("add-player-2").addEventListener("click", () => {
        gameMaker.addPlayer(1, tiles, players.length);
    });

    // document.getElementById("main-menu-play").addEventListener("click", () => {
    //     startPlay();
    // });

    document.getElementById("main-menu-new").addEventListener("click", () => {
        gameMaker.newGame();
    });
    $("#player-lobby").on("click", ".select", function(){
        g.playerId = $(this).attr("playerId");
        startPlay();
    });
    $("#player-lobby").on("click", ".remove", function(){
        model.deletePlayer({id: $(this).attr("playerId")});
    });
    
};



const activateServerListener = () => {
    
    g.c.addEventListener("serverUpdateGems", (e) => {
        let filteredGems = _.compact(e.detail.gems);
        if(initialGemDraw === true){
            // console.log(gems);
            gems = filteredGems;
            initialGemDraw = false;
        } else {
            console.log("new data");
            newGems = filteredGems;
        }        
    });

    g.c.addEventListener("serverUpdatePlayer", (e) => {
        if(e.detail !== null){
            
        // Filter the results, because firebase will return empty values if there are gaps in the array.
        let filteredPlayers = Object.keys(e.detail.players).map(key => {
            let player = e.detail.players[key];
            player.id = key;
            return player;
        });

        // console.log("player", e.detail);
          
            if(initialPlayerDraw === true){
                players = filteredPlayers;
                // console.log(players);
                initialPlayerDraw = false;
            } else {
                console.log("new data");
                newPlayers = filteredPlayers;
            }
        }
        

        // Update list of players
        
        // console.log('players', newPlayers);
        // console.log('tiles', newTiles);

    });
    g.c.addEventListener("serverUpdateTiles", (e) => {
        // console.log("tile", e.detail);

        let filteredTiles = _.compact(e.detail.tiles);

        for(let i = 0; i < filteredTiles.length; i++){
            filteredTiles[i].id = i;
        }

        if(initialTileDraw === true){
            tiles = filteredTiles;
            initialTileDraw = false;
        } else {
            console.log("new data");
            newTiles = filteredTiles;
        }

    });

    g.c.addEventListener("serverUpdateGameState", (e) => {
        console.log("loaded");
        onlineGameState = e.detail.gameState; 
        winner = e.detail.winningTeam; 
    });

};


// Prevent key defaults
window.addEventListener("keydown", function(e) {
    if(Object.keys(keys).indexOf(e.key) > -1) {
        e.preventDefault();
    }
}, false);

// When a key is pressed, set it to true.
window.onkeydown = function(event) {
    // console.log(event.key);
    for(let prop in keys){
        if(prop == event.key){
        // console.log("event.keycode", event.keycode);
            keys[prop] = true;
        }
    }
};

// When a key is up, set it to false.
window.onkeyup = function(event) {
    for(let prop in keys){
        if(prop == event.key){
            // console.log("event.keycode", event.keycode);
            keys[prop] = false;
        }
    }
};