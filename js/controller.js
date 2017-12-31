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

let tileSize = 25;

let model = require("./model");
let view = require("./view");

let gameState = 0;
let playerId = "0";


let players = [];
let tiles = [];

let previousPlayerActions = [];
let completedActions = [];

let newPlayers = [];
let newTiles = [];

let c = document.getElementById('game-canvas');
var ctx = c.getContext("2d");

ctx.canvas.width  = 500;
ctx.canvas.height = 500;

let speedMultiplier = 0.1;

let sightDistance = 2.25;


//  Use timestamp instead?
let keys = {
    left:false,
    right:false,
    up: false, 
    down: false,
    space: false
};


let initialTileDraw = true;
let initialPlayerDraw = true;

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

/* 
    By Daniel X Moore
    http://strd6.com/2010/08/useful-javascript-game-extensions-clamp/
*/
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
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

    let tileX = Math.floor((player.pos.x+player.size.w/2) / tileSize),
    tileY = Math.floor((player.pos.y+player.size.h/2) / tileSize);

    console.log(tileX, tileY);
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

const findPlayerTile = (player) => {
    let tileX = Math.round(player.pos.x / tileSize),
    tileY = Math.round(player.pos.y /tileSize);
    return {
        pos: {
            x: tileX,
            y: tileY
        }
    };
};

const update = (delta) => { // new delta parameter
    // boxPos += boxVelocity * delta; // velocity is now time-sensitive
    // console.log(keys);

    // console.log('previousPlayerActions', previousPlayerActions);
    // console.log('completedActions', completedActions);

    //  Set player and tiles to new values recieved from listener

    // let actionList = 
    // document.getElementById('actions');
    // actionList.innerHTML = "";
    // for(let i = 0; i < previousPlayerActions.length; i++){
    //     actionList.innerHTML += `<br/>${previousPlayerActions[i]}`;
    //     actionList.scrollTop = actionList.scrollHeight;
    // }
  
    // tiles = newTiles;
    // players = newPlayers;

    // Loops through


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


            // if(!previousPlayerActions.includes(newTiles[i].requestId) && newTiles[i] !== tiles[i]){
            //     // console.log("New tile", newTiles[i].requestId,  newTiles[i].hard);
            //     tiles[i] = newTiles[i];
            //     completedActions.push(newTiles[i].requestId);
            // } else {
            //     completedActions.push(newTiles[i].requestId);
            // }

            
            if(newTiles[i] !== tiles[i] && !previousPlayerActions.includes(newTiles[i].requestId) && newTiles[i].requestId !== undefined){
                tiles[i] = newTiles[i];
                previousPlayerActions.push(newTiles[i].requestId);
                // console.log(newTiles[i].requestId);
            }
            
        }
        newTiles = null;
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
           

            if(keys.up && canMove("up", player, delta)){
                players[players.indexOf(player)].pos.y -= speedMultiplier * delta;
                requestId += `01`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayerData(players[players.indexOf(player)]);
            } else if (keys.down && canMove("down", player, delta)){
                players[players.indexOf(player)].pos.y += speedMultiplier * delta;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayerData(players[players.indexOf(player)]);
            } else if(keys.left && canMove("left", player, delta)){
                players[players.indexOf(player)].pos.x -= speedMultiplier * delta;
                requestId += `02`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayerData(players[players.indexOf(player)]);
            } else if(keys.right && canMove("right", player, delta)){
                players[players.indexOf(player)].pos.x += speedMultiplier * delta;
                requestId += `03`;
                previousPlayerActions.push(requestId);
                players[players.indexOf(player)].requestId = requestId;
                
                // console.log('players[players.indexOf(player)].pos.y', players[players.indexOf(player)].pos.y);
                model.savePlayerData(players[players.indexOf(player)]);
            } else if(keys.space){
                // If there is an object in front of you
                let selectedTile = findTileInFront(player);
                if(selectedTile !== undefined){
                    requestId += `04`;
                previousPlayerActions.push(requestId);
                tiles[tiles.indexOf(selectedTile)].requestId = requestId;
               
                // Take away hardness of object.
                
                    tiles[tiles.indexOf(selectedTile)].hard -= 0.5;
                    console.log(selectedTile);
                    model.saveTileData(tiles[tiles.indexOf(selectedTile)]); 
                }
                
            }

            
        }

    }
};

const drawTiles = () => {
    let player = players.find(x => x.id === playerId);

    for(let i = 0; i < tiles.length; i++){

        // console.log(`${tiles[i].pos.x} - ${tiles[i].pos.y}`);
        // ctx.fillStyle = "green";
        // ctx.font = "10px Arial";
        // ctx.fillText(`${tiles[i].pos.x} - ${tiles[i].pos.y}`,tiles[i].pos.x*25, tiles[i].pos.y*25);


        
        let playerTile;
        if(player !== undefined){
            playerTile = findPlayerTile(player);
        }
        
        if(playerTile !== undefined){

            let a = (playerTile.pos.x+0.5) - (tiles[i].pos.x+0.5),
            b = (playerTile.pos.y+0.5) - (tiles[i].pos.y+0.5),
            distance = Math.sqrt(a*a + b*b);
            if(Math.abs(distance) <= sightDistance){
                if(tiles[i].hard > 0){
                    ctx.fillStyle = "brown"; 
                    
                // console.log("b",  distance);
                } else {
                    ctx.fillStyle = "white"; 
                    
                // console.log("w", distance);
                }
            } else {
                ctx.fillStyle = "black";
                // console.log("b", distance);
            }   
            
        } else {
            ctx.fillStyle = "black";
        }   

       
        ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
        ctx.stroke();
    }
};

const canSeePlayer = (p1, p2, sightDistance) => {

    let player1 = findPlayerTile(p1);
    let player2 = findPlayerTile(p2);

    let a = (player1.pos.x+0.5) - (player2.pos.x+0.5),
    b = (player1.pos.y+0.5) - (player2.pos.y+0.5),
    distance = Math.sqrt(a*a + b*b);

    return Math.abs(distance) <= sightDistance;
};

const drawPlayers = () => {
    

    let thisPlayer = players.find(x => x.id === playerId);
    
    for(let i = 0; i < players.length; i++){
        // let playerDirection = (players[i].dir*30);
        // ctx.rotate(playerDirection * Math.PI / 180);
        if(players[i].team === thisPlayer.team || thisPlayer.id == players[i].id || canSeePlayer(thisPlayer, players[i], sightDistance)){
            ctx.fillStyle = "#FF0000"; 
            ctx.fillRect(players[i].pos.x, players[i].pos.y, players[i].size.w, players[i].size.h);
            ctx.stroke();
        }
        
        // ctx.rotate(-playerDirection * Math.PI / 180);
    }
};

const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    drawTiles();
    drawPlayers();
};

const mainLoop = (timestamp) => {
    
    if(gameState === 0){
        // Track the accumulated time that hasn't been simulated yet
        delta += timestamp - lastFrameTimeMs; // note += here
        lastFrameTimeMs = timestamp;
        
        cleanupRequest();
        // console.log('previousPlayerActions', previousPlayerActions);
        // console.log('completedActions', completedActions);

        // Simulate the total elapsed time in fixed-size chunks
        while (delta >= timestep) {
            update(timestep);
            delta -= timestep;
        }
        draw();

        // 

        requestAnimationFrame(mainLoop);
    }
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

module.exports.startGame = () => {
    model.fetchData();
    activateServerListener();
    requestAnimationFrame(mainLoop);

    document.getElementById('player-id').addEventListener("change", function(){
        playerId = this.value;
    });

};

const activateServerListener = () => {
    c.addEventListener("serverUpdatePlayer", (e) => {

        // console.log("player", e.detail);
        if(initialPlayerDraw === true){
            players = e.detail.players;
            initialPlayerDraw = false;
        } else {
            newPlayers = e.detail.players;
        }
        
        // console.log('players', newPlayers);
        // console.log('tiles', newTiles);

    });
    c.addEventListener("serverUpdateTiles", (e) => {
        console.log("tile", e.detail);
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
};


// const clearKeyPress = () => {
//     keys.left = false;
//     keys.right = false;
//     keys.up = false;
//     keys.down = false;
//     keys.space = false;
// };

// Disable keydow defaults
window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

window.onkeydown = function() {
	switch(event.keyCode) {
		case 37:
			keys.left = true;
		break;
		case 39:
			keys.right = true;
        break;
        case 38:
            keys.up = true;
        break;
        case 40:
            keys.down = true;
        break;
        case 32:    
            keys.space = true;
        break;
	}
};

window.onkeyup = function() {
	switch(event.keyCode) {
		case 37:
			keys.left = false;
		break;
		case 39:
			keys.right = false;
        break;
        case 38:
            keys.up = false;
        break;
        case 40:
            keys.down = false;
        break;
        case 32:
            keys.space = false;
        break;
	}
};