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

let tileDestructionAnimation = [
    {tough: 1.9, img: img('stone')},
    {tough: 1.7, img: img('stoneBroke1')},
    {tough: 1.5, img: img('stoneBroke2')},
    {tough: 1.3, img: img('stoneBroke3')},
    {tough: 1.1, img: img('stoneBroke4')},
    {tough: 1.0, img: img('stoneBroke5')},
    {tough: 0.9, img: img('stoneFrac1')},
    {tough: 0.8, img: img('stoneFrac2')},
    {tough: 0.6, img: img('stoneFrac3')},
    {tough: 0.4, img: img('stoneFrac4')},
    {tough: 0.2, img: img('stoneFrac5')},
    {tough: 0.0, img: img('stoneFrac6')}
];

// // Angular

// let players = ['two'];

// module.exports.setPlayers = (x) => {
//     players = x;
// };


// // Cleared on each update.  Contains the tiles that should be drawn that frame.
// // TODO: Move inside function.
// let tilesToDraw = [];

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

const shouldTileBeDrawn = (tile, tiles) => isDefined(tiles.find(x => x.pos.x === tile.pos.x && x.pos.y === tile.pos.y)) ? true : false;


// Tile is being check is if within one of other tiles
const isTileWithinOne = (tile, otherTiles) => {
    for(let testingTile of otherTiles){
         if(Math.abs(tile.pos.x - testingTile.pos.x) <= 1 &&  Math.abs(tile.pos.y - testingTile.pos.y) <= 1 && testingTile.tough.points <= 0 && testingTile.tough.points !== -2){
            return true;
        }
    }
    return false;
};

const calcVisibleTiles = (tiles, players) => {
    let tilesToDraw = [];
    
    let tilesToBeAddedToDraw = [];
    
    let playerTile = g.findTileBelowPlayer(thisPlayer, tiles);
    // Add seed tile that player is on
    if(isDefined(playerTile)){
        tilesToDraw.push(playerTile);
    }

    // Add seed tile that team mate is on
    for(let player of players){
        let allyTile = g.findTileBelowPlayer(player, tiles);
        if(isDefined(allyTile) && player.team === thisPlayer.team && g.isPlayerAlive(player)){
            tilesToDraw.push(allyTile);
        }
    }

    // Find all tiles that are touching player or marked as touching a tile touching a player.
    for(let i = 0; i < sightDistance; i++){
        for(let tile of tiles){
            if(isTileWithinOne(tile, tilesToDraw)){
                tilesToBeAddedToDraw.push(tile);
            }
        }
        // Add tiles  to tilesToDraw (the tiles that are being used to check if a tile is within oen), only after a whole loop so that the tile that is added will not be used to check other tiles against.
        tilesToDraw = tilesToDraw.concat(tilesToBeAddedToDraw);
    }

    return tilesToDraw;
};

const drawTiles = (tiles, players) => {
    let tilesToDraw = calcVisibleTiles(tiles, players);
    
    for(let tile of tiles){
        let playerTile;

        if(isDefined(thisPlayer)){
            playerTile = findPlayerTile(thisPlayer);
        }
        
        if(isDefined(playerTile)){
            if(shouldTileBeDrawn(tile, tilesToDraw)){
                let {tough: {points: toughness}} = tile;
                if(toughness > 0){
                    for(let anim of tileDestructionAnimation){
                        if(toughness > +anim.tough){
                            g.ctx.drawImage(anim.img,g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                            break;
                        }
                    }
                } else if (toughness === -2) {
                    g.ctx.fillRect(g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                    
                } else {
                    if(tile.teamBase === thisPlayer.team){
                        g.ctx.drawImage(img('dirt'),g.calcObjBounds(tile, g.tileSize).x,g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                        g.ctx.fillStyle = baseColor;
                        g.ctx.fillRect(g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    } else {
                        g.ctx.drawImage(img('dirt'),g.calcObjBounds(tile, g.tileSize).x,g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                        
                    }
                }
            } else {
                if(tile.teamBase === thisPlayer.team){
                    g.ctx.fillStyle = minedColor; 
                    g.ctx.drawImage(img('dirt'),g.calcObjBounds(tile, g.tileSize).x,g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                    g.ctx.fillStyle = baseColor;
                    g.ctx.fillRect(g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                    
                } else if (tile.tough.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
                }
            }  
        } 
        g.ctx.stroke();
    }
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