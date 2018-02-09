"use strict";

// module.exports.showTiles = (tiles) => {
//     console.log(tiles);
// };


let screens = ["#victory-screen", "#main-menu-screen", "#game-screen", "#loading-screen", "#sign-in-screen"];


const g = require("./game");
const $ = require("jquery");
const _ = require("lodash");
const img = require("./imageController");
const drawPlayerAnimation = require("./animationController");

// Number of squares that can be seen around player
let sightDistance = 3;

// Square colors
let unknownColor = "black",
minedColor = "blue",
rockColor = "brown",
baseColor = "#FFA50080",
allyColor = "green",
enemyColor = "red",
allyGemColor = "yellow",
enemyGemColor = "yellow",
edgeColor = "gray";


let DwarfAnimation = {
    frame: [1, 2],
    curFrame: 0,
    lastFrame: 0,
    interval: 250,
    w: 21,
    h: 21
};


// // Angular

// let players = ['two'];

// module.exports.setPlayers = (x) => {
//     players = x;
// };


// Cleared on each update.  Contains the tiles that should be drawn that frame.
// TODO: Move inside function.
let tilesToDraw = [];

// Set by draw()
let thisPlayer;

const isDefined = obj => typeof obj !== "undefined";


const findPlayerTile = (player) => {
    let tileX = Math.round(player.pos.x / g.tileSize),
    tileY = Math.round(player.pos.y / g.tileSize);
    return {
        pos: {
            x: tileX,
            y: tileY
        }
    };
};

const doesTileExists = (tile, tiles) => {
    return tiles.find(x => x.pos.x === tile.pos.x && x.pos.y === tile.pos.y);
};


// Tile is being check is if within one of other tiles
const isTileWithinOne = (tile, otherTiles) => {
    for(let i = 0; i < otherTiles.length; i++){
        // console.log('Math.abs(tile.pos.x - otherTiles[i].pos.x)', Math.abs(tile.pos.x - otherTiles[i].pos.x));
        // console.log('Math.abs(tile.pos.y - otherTiles[i].pos.y)', Math.abs(tile.pos.y - otherTiles[i].pos.y));
        if(Math.abs(tile.pos.x - otherTiles[i].pos.x) <= 1 &&  Math.abs(tile.pos.y - otherTiles[i].pos.y) <= 1 && otherTiles[i].hard.points <= 0 && otherTiles[i].hard.points !== -2){
            // console.log(tile);
            return true;
        }
    }

    return false;
};

const drawTiles = (tiles, players) => {
    tilesToDraw = [];

    let tilesToBeAddedToDraw = [];
    
    let playerTile = g.findTileBelowPlayer(thisPlayer, tiles);

    // Draw tiles around team mates
    for(let i = 0; i < players.length; i++){
        if(players[i].team === thisPlayer.team && g.isPlayerAlive(players[i])){
            tilesToDraw.push(g.findTileBelowPlayer(players[i], tiles));
        }
    }

    if(isDefined(playerTile)){
        tilesToDraw.push(playerTile);
    }

    // Find all tiles touching the player that are hard <= 0
    for(let i = 0; i < sightDistance; i++){
        for(let a = 0; a < tiles.length; a++){
            if(isTileWithinOne(tiles[a], tilesToDraw)){
                tilesToBeAddedToDraw.push(tiles[a]);
            }
        }

        // Add tiles  to tilesToDraw (the tiles that are being used to check if a tile is within oen), only after a whole loop so that the tile that is added will not be used to check other tiles against.
        // console.log('tilesToDraw', tilesToDraw);
        tilesToDraw = tilesToDraw.concat(tilesToBeAddedToDraw);
        // console.log('tilesToDraw', tilesToDraw);
    }
    // console.log('tileToBeAddedToDraw', tilesToBeAddedToDraw);


    for(let i = 0; i < tiles.length; i++){
        let playerTile;

        if(isDefined(thisPlayer)){
            playerTile = findPlayerTile(thisPlayer);
        }
        
        if(isDefined(playerTile)){

            // let a = (playerTile.pos.x+0.5) - (tiles[i].pos.x+0.5),
            // b = (playerTile.pos.y+0.5) - (tiles[i].pos.y+0.5),
            // distance = Math.sqrt(a*a + b*b);

            
            if(isDefined(doesTileExists(tiles[i], tilesToDraw))){
                let hardness = tiles[i].hard.points;
                if(hardness > 0){
                    g.ctx.fillStyle = rockColor; 
                    if(hardness > 1.95){
                        g.ctx.drawImage(img('stone'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    }
                    else if(hardness > 1.7){
                        g.ctx.drawImage(img('stoneBroke1'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    }
                    else if(hardness > 1.5){
                        g.ctx.drawImage(img('stoneBroke2'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    }
                    else if(hardness > 1.3){
                        g.ctx.drawImage(img('stoneBroke3'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, 
                        g.tileSize,  g.tileSize);
                    }
                    else if(hardness > 1.1){
                        g.ctx.drawImage(img('stoneBroke4'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    }
                    else if(hardness > 1){
                        g.ctx.drawImage(img('stoneBroke5'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    } else  if (hardness > 0.9){
                        g.ctx.drawImage(img('stoneFrac1'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    } else  if (hardness > 0.8){
                        g.ctx.drawImage(img('stoneFrac2'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    } else  if (hardness > 0.6){
                        g.ctx.drawImage(img('stoneFrac3'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    } else  if (hardness > 0.4){
                        g.ctx.drawImage(img('stoneFrac4'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    } else  if (hardness > 0.2){
                        g.ctx.drawImage(img('stoneFrac5'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    } else  if (hardness > 0.0){
                        g.ctx.drawImage(img('stoneFrac6'),g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    }
                    
                // console.log("b",  distance);
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    
                } else {
                    if(tiles[i].teamBase === thisPlayer.team){
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage(img('dirt'),g.calcObjBounds(tiles[i], g.tileSize).x,g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        g.ctx.fillStyle = baseColor;
                        g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    } else {
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage(img('dirt'),g.calcObjBounds(tiles[i], g.tileSize).x,g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    }
                   
                    
                // console.log("w", distance);
                }
            } else {
                if(tiles[i].teamBase === thisPlayer.team){
                    g.ctx.fillStyle = minedColor; 
                    g.ctx.drawImage(img('dirt'),g.calcObjBounds(tiles[i], g.tileSize).x,g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    g.ctx.fillStyle = baseColor;
                    g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    
                } 
                // else {
                //     g.ctx.fillStyle = unknownColor;
                //     g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
                    
                // }
                // console.log("b", distance);
            }   
            
        } 
        // else {
        //     g.ctx.fillStyle = unknownColor;
        //     g.ctx.fillRect(g.calcObjBounds(tiles[i], g.tileSize).x, g.calcObjBounds(tiles[i], g.tileSize).y, g.tileSize,  g.tileSize);
            
        // }   

       
        g.ctx.stroke();
    }
};

const canSeePlayer = (p1, p2, sightDistance) => {

    let player1 = findPlayerTile(p1);
    let player2 = findPlayerTile(p2);

    let a = (player1.pos.x+0.5) - (player2.pos.x+0.5),
    b = (player1.pos.y+0.5) - (player2.pos.y+0.5),
    // Line must be ignored, because JS Hint doesn't recognize ** operator.
    distance = Math.sqrt(a**2 + b**2);// jshint ignore:line

    return Math.abs(distance) <= sightDistance;
};

const drawPlayers = (players, playerId, tiles) => {
    // console.log("players", players); 
    for(let i = 0; i < players.length; i++){
        // let playerDirection = (players[i].dir*30);
        // g.ctx.rotate(playerDirection * Math.PI / 180);
        // console.log("playeri", players[i], thisPlayer);
      
        let playerTile = g.findTileBelowPlayer(players[i], tiles);

        if((players[i].team === thisPlayer.team || thisPlayer.id == players[i].id || tilesToDraw.find(tile => tile === playerTile)) && g.isPlayerAlive(players[i])){// jshint ignore:line
            // console.log("in here", players[i]);
            

        //    g.ctx.setTransform(1,0,0,1,players[i].pos.x,players[i].pos.y); // set position of image center
           
        //     if(players[i].pos.dir === "right"){
        //         g.ctx.rotate(90); // rotate
        //     }

        // Draw health
        g.ctx.fillStyle = "red";
        g.ctx.strokeRect(players[i].pos.x, players[i].pos.y - 10, g.playerSize, 5);
        g.ctx.fillRect(players[i].pos.x+1, players[i].pos.y - 9, g.playerSize*(players[i].health.points*0.01)-1, 3);
        g.ctx.stroke();

        if(players[i].team === 1){
            g.ctx.drawImage(img('squirrel'), players[i].pos.x, players[i].pos.y, g.playerSize, g.playerSize);
            
        } else {
            if(isDefined(players[i].pos.animDir)) {
                if(players[i].pos.animDir === "right"){
                    drawPlayerAnimation('dwarfSprite', 'dwarfAnimation', players[i].pos);
                } else {
                    drawPlayerAnimation('dwarfSpriteLeft', 'dwarfAnimationLeft', players[i].pos);
                }
            }
        }
            
        g.ctx.stroke();
            // g.ctx.setTransform(1,0,0,1,0,0); // restore default transform

            // g.ctx.fillRect(players[i].pos.x, players[i].pos.y, players[i].size.w, players[i].size.h);
            
        }
        
        // g.ctx.rotate(-playerDirection * Math.PI / 180);
    }
};

const drawGems = (gems, players) => {
    for(let i = 0; i < gems.length; i++){


        if(gems[i].team === 1){
            if(gems[i].carrier === -1){ 
                g.ctx.drawImage(img('gem'), 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, g.tileSize, g.tileSize);
            }
             else {
                g.ctx.drawImage(img('gem'), 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, g.tileSize/2, g.tileSize/2);
            }
        } else {
            if(gems[i].carrier === -1){
                g.ctx.drawImage(img('acorn'), gems[i].pos.x, gems[i].pos.y, g.tileSize, g.tileSize);
            } 
            else {
                g.ctx.drawImage(img('acorn'), gems[i].pos.x, gems[i].pos.y, g.tileSize/2, g.tileSize/2);
            }
        }
        g.ctx.stroke();
    }
};




const drawHealth = (health) => {
    if(health > 0){
        $("#player-health").html("Health: " + health);
    } else {
        $("#player-health").html("<p>You are Dead</p>");
    }
};

const drawLag = (lag) => {
    $("#lag").text("Lag (miliseconds): " + lag);
};

module.exports.draw = (playerId, tiles, players, gems, lag) => {
    thisPlayer = players.find(x => x.id == playerId);

    drawHealth(thisPlayer.health.points);
    drawLag(lag);
    g.ctx.clearRect(0, 0, g.c.width, g.c.height);
    drawTiles(tiles, players);
    drawPlayers(players, playerId, tiles);
    drawGems(gems, players);
};



module.exports.drawSignIn = () => {
    $("#signInText").text(`${g.fullName}`);
};


module.exports.showLoadingScreen = () => {
    showScreen("#loading-screen");
};

module.exports.viewMainMenu = () => {
    showScreen("#main-menu-screen");
    module.exports.drawSignIn();
};

module.exports.viewWinnerScreen =  winnerId => {
    showScreen("#victory-screen");
    $("#winner").text(winnerId == 0 ? "Dwarves" : "Squirrels");
};  

module.exports.viewGame = () => {
    showScreen("#game-screen");
};

module.exports.showSignIn = () => {
    showScreen("#sign-in-screen");
};

module.exports.printDataCount = (returned, sent) => {
    $("#dataCount").text(`Sent/Returned: ${returned}/${sent}`);
};

const showScreen = (screen) => {


    for(let i = 0; i < screens.length; i++){
        if(screens[i] !== screen){
            if(!$(screens[i]).hasClass("hide")){
                $(screens[i]).addClass("hide");
            }
        }
    }
    if($(screen).hasClass("hide")){
        $(screen).removeClass("hide");
    }
};