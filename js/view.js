"use strict";

// module.exports.showTiles = (tiles) => {
//     console.log(tiles);
// };

const g = require("./game");
const $ = require("jquery");


// Number of squares that can be seen around player
let sightDistance = 3;

// Square colors
let unknownColor = "black",
minedColor = "blue",
rockColor = "brown",
baseColor = "orange",
allyColor = "green",
enemyColor = "red",
allyGemColor = "yellow",
enemyGemColor = "yellow",
edgeColor = "gray";


let dwarfImage = new Image(); 
dwarfImage.src = './img/dwarf.png'; 

let dirtImage = new Image();
dirtImage.src = "./img/dirt.png";

let stoneImage = new Image();
stoneImage.src = "./img/stone.jpeg";


// Gems

// https://opengameart.org/content/32x32-pixel-gems
// Copyright/Attribution Notice: 
// Credit:Jianhui999 https://www.patreon.com/GamePixelArt Credit: http://opengameart.org/users/jianhui999

let gemImage = new Image();
gemImage.src = "./img/gems.png";



// Set by draw()
let thisPlayer;

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

const findTileBelowPlayer = (player, tiles) => {
    
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

    return sortedTiles[0];
};

// Tile is being check is if within one of other tiles
const isTileWithinOne = (tile, otherTiles) => {
    for(let i = 0; i < otherTiles.length; i++){
        // console.log('Math.abs(tile.pos.x - otherTiles[i].pos.x)', Math.abs(tile.pos.x - otherTiles[i].pos.x));
        // console.log('Math.abs(tile.pos.y - otherTiles[i].pos.y)', Math.abs(tile.pos.y - otherTiles[i].pos.y));
        if(Math.abs(tile.pos.x - otherTiles[i].pos.x) <= 1 &&  Math.abs(tile.pos.y - otherTiles[i].pos.y) <= 1 && otherTiles[i].hard <= 0 && otherTiles[i].hard !== -2){
            // console.log(tile);
            return true;
        }
    }

    return false;
};

const drawTiles = (tiles, players) => {
    let tilesToDraw = [];

    let tilesToBeAddedToDraw = [];
    
    let playerTile = findTileBelowPlayer(thisPlayer, tiles);

    for(let i = 0; i < players.length; i++){
        if(players[i].team === thisPlayer.team){
            tilesToDraw.push(findTileBelowPlayer(players[i], tiles));
        }
    }

    if(playerTile !== undefined){
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

        if(typeof thisPlayer !== undefined){
            playerTile = findPlayerTile(thisPlayer);
        }
        
        if(typeof playerTile !== undefined){

            // let a = (playerTile.pos.x+0.5) - (tiles[i].pos.x+0.5),
            // b = (playerTile.pos.y+0.5) - (tiles[i].pos.y+0.5),
            // distance = Math.sqrt(a*a + b*b);

            
            if(doesTileExists(tiles[i], tilesToDraw) !== undefined){
                if(tiles[i].hard > 0){
                    g.ctx.fillStyle = rockColor; 
                    g.ctx.drawImage( stoneImage ,tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                    
                // console.log("b",  distance);
                } else if (tiles[i].hard === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                    
                } else {
                    if(tiles[i].teamBase === thisPlayer.team){
                        g.ctx.fillStyle = baseColor;
                        g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                        
                    } else {
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage( dirtImage ,tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                        
                    }
                   
                    
                // console.log("w", distance);
                }
            } else {
                if(tiles[i].teamBase === thisPlayer.team){
                    g.ctx.fillStyle = baseColor;
                    g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                    
                } else if (tiles[i].hard === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                    
                } else {
                    g.ctx.fillStyle = unknownColor;
                    g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
                    
                }
                // console.log("b", distance);
            }   
            
        } else {
            g.ctx.fillStyle = unknownColor;
            g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
            
        }   

       
        g.ctx.stroke();
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

const drawPlayers = (players, playerId) => {
    // console.log("players", players); 
    for(let i = 0; i < players.length; i++){
        // let playerDirection = (players[i].dir*30);
        // g.ctx.rotate(playerDirection * Math.PI / 180);
        // console.log("playeri", players[i], thisPlayer);
      

        if((players[i].team === thisPlayer.team || thisPlayer.id == players[i].id || canSeePlayer(thisPlayer, players[i], sightDistance)) && players[i].health.points > 0){
            // console.log("in here", players[i]);
            
            // g.ctx.save();

            // // if(players[i].dir === "right"){
            //     // g.ctx.rotate(1);
            // // }

            // // if(players[i].dir === "left"){
            //     g.ctx.rotate(10*Math.PI/180);
            // // }
            // // if(players[i].dir === "up"){
            // //     g.ctx.rotate(0*Math.PI/180);
            // // }
            


            // Instead of rotating it, will just use a seperate image for each direction that the user is facing.

           
            // if(players[i].team === thisPlayer.team){
            //     g.ctx.fillStyle = allyColor; 
            // } else {
            //     g.ctx.fillStyle  = enemyColor;
            // }
            
            g.ctx.drawImage(dwarfImage,players[i].pos.x, players[i].pos.y, players[i].size.w, players[i].size.h);
            
            // g.ctx.fillRect(players[i].pos.x, players[i].pos.y, players[i].size.w, players[i].size.h);
            g.ctx.stroke();

            // g.ctx.restore();
        }
        
        // g.ctx.rotate(-playerDirection * Math.PI / 180);
    }
};

const drawGems = (gems, players) => {
    for(let i = 0; i < gems.length; i++){

        if(thisPlayer.team === gems[i].team){ // Your team
            // console.log(gems[i].carrier === -1);
            if(gems[i].carrier === -1){ 
                g.ctx.drawImage(gemImage, 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, gems[i].size.w, gems[i].size.h);
            }
             else {
                g.ctx.drawImage(gemImage, 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, gems[i].size.w/2, gems[i].size.h/2);
            }
        } else { // Enemy team

            if(gems[i].carrier === -1){
                g.ctx.drawImage(gemImage, 32, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, gems[i].size.w, gems[i].size.h);
            } 
            else {
                g.ctx.drawImage(gemImage, 32, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, gems[i].size.w/2, gems[i].size.h/2);
            }
        }
        g.ctx.stroke();
    }
};

const drawHealth = (health) => {
    if(health > 0){
        $("#player-health").html(health);
    } else {
        $("#player-health").html("<p>You are Dead</p>");
    }
};

module.exports.draw = (playerId, tiles, players, gems) => {
    thisPlayer = players.find(x => x.id == playerId);

    drawHealth(thisPlayer.health.points);

    g.ctx.clearRect(0, 0, g.c.width, g.c.height);
    drawTiles(tiles, players);
    drawPlayers(players, playerId);
    drawGems(gems, players);
};



module.exports.createPlayerButton = (players) => {
    $("#player-lobby").empty();
    for(let i = 0; i < players.length; i ++){
        $("#player-lobby").append($(`<button class="add"playerId=${players[i].id}>Select Player ${players[i].id}</button>`));
        $("#player-lobby").append($(`<button class="remove" playerId=${players[i].id}>Delete Player ${players[i].id}</button></br>`));
    }
};  

module.exports.showLoadingScreen = () => {
    hideAllMenus();
    
    document.getElementById("loading-screen").classList.remove("hide");
};

module.exports.viewMainMenu = () => {
    hideAllMenus();
    

    document.getElementById("main-menu-screen").classList.remove("hide");
};



// module.exports.viewSelectPlayerScreen = () => {
//     hideAllMenus();

//     document.getElementById("select-player-screen").classList.remove("hide");
// };

module.exports.viewWinnerScreen =  (winnerId) => {
    hideAllMenus();

    document.getElementById("victory-screen").classList.remove("hide");
    document.getElementById("winner").textContent = winnerId;
};  

module.exports.viewGame = () => {
    hideAllMenus();

    $("#game-screen").removeClass("hide");
};

const hideAllMenus = () => {

    document.getElementById("victory-screen").classList.add("hide");
    document.getElementById("main-menu-screen").classList.add("hide");
    document.getElementById("game-screen").classList.add("hide");
    document.getElementById("loading-screen").classList.add("hide");
};