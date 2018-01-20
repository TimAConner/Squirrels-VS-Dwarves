"use strict";

// module.exports.showTiles = (tiles) => {
//     console.log(tiles);
// };


let screens = ["#victory-screen", "#main-menu-screen", "#game-screen", "#loading-screen", "#sign-in-screen"];

const g = require("./game");
const $ = require("jquery");
const _ = require("lodash");
const angular = require("angular");

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


let dwarfImage = new Image(); 
dwarfImage.src = './img/dwarf.png'; 

let squirrelImage = new Image(); 
squirrelImage.src = './img/squirrel.png'; 

let dirtImage = new Image();
dirtImage.src = "./img/dirt.png";

let stoneImage = new Image();
stoneImage.src = "./img/stone.jpeg";

let tilesToDraw = [];

// Gems

// https://opengameart.org/content/32x32-pixel-gems
// Copyright/Attribution Notice: 
// Credit:Jianhui999 https://www.patreon.com/GamePixelArt Credit: http://opengameart.org/users/jianhui999

let gemImage = new Image();
gemImage.src = "./img/gems.png";

let acornImage = new Image();
acornImage.src = "./img/acorn.png";

// Angular

let players = ['two'];

module.exports.setPlayers = (x) => {
    players = x;
};

let app = angular.module("myApp", []);

app.controller("myCtrl", ['$scope', function($scope) {
    $("#game-canvas").on("serverUpdatePlayer", (e) => {
        $scope.$apply(function(){
            if(e.detail !== null){
                let ownedPlayers = Object.keys(e.detail.players).filter(x => e.detail.players[x].uid == g.uid).map(x => e.detail.players[x]);

                let otherPlayers = Object.keys(e.detail.players).filter(x => e.detail.players[x].uid != g.uid).map(x => e.detail.players[x]);
                $scope.ownedPlayers = ownedPlayers;
                $scope.otherPlayers = otherPlayers;
            } else {
                $scope.otherPlayers = [];
                $scope.ownedPlayers = [];
            }
            
        });
    });
}]);

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

    for(let i = 0; i < players.length; i++){
        if(players[i].team === thisPlayer.team && players[i].health.points > 0){
            tilesToDraw.push(g.findTileBelowPlayer(players[i], tiles));
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
                if(tiles[i].hard.points > 0){
                    g.ctx.fillStyle = rockColor; 
                    g.ctx.drawImage( stoneImage ,g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    
                // console.log("b",  distance);
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    
                } else {
                    if(tiles[i].teamBase === thisPlayer.team){
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                        g.ctx.fillStyle = baseColor;
                        g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                        
                    } else {
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                        
                    }
                   
                    
                // console.log("w", distance);
                }
            } else {
                if(tiles[i].teamBase === thisPlayer.team){
                    g.ctx.fillStyle = minedColor; 
                    g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    g.ctx.fillStyle = baseColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    
                } 
                // else {
                //     g.ctx.fillStyle = unknownColor;
                //     g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
                    
                // }
                // console.log("b", distance);
            }   
            
        } 
        // else {
        //     g.ctx.fillStyle = unknownColor;
        //     g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, g.tileSize,  g.tileSize);
            
        // }   

       
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

const drawPlayers = (players, playerId, tiles) => {
    // console.log("players", players); 
    for(let i = 0; i < players.length; i++){
        // let playerDirection = (players[i].dir*30);
        // g.ctx.rotate(playerDirection * Math.PI / 180);
        // console.log("playeri", players[i], thisPlayer);
      
        let playerTile = g.findTileBelowPlayer(players[i], tiles);

        if((players[i].team === thisPlayer.team || thisPlayer.id == players[i].id || tilesToDraw.find(tile => tile === playerTile)) && players[i].health.points > 0){// jshint ignore:line
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
            g.ctx.drawImage(squirrelImage,players[i].pos.x, players[i].pos.y, g.playerSize, g.playerSize);
            
        } else {
            
            g.ctx.drawImage(dwarfImage,players[i].pos.x, players[i].pos.y, g.playerSize, g.playerSize);
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
                g.ctx.drawImage(gemImage, 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, g.tileSize, g.tileSize);
            }
             else {
                g.ctx.drawImage(gemImage, 0, 0, 32, 32, gems[i].pos.x, gems[i].pos.y, g.tileSize/2, g.tileSize/2);
            }
        } else {
            if(gems[i].carrier === -1){
                g.ctx.drawImage(acornImage, gems[i].pos.x, gems[i].pos.y, g.tileSize, g.tileSize);
            } 
            else {
                g.ctx.drawImage(acornImage, gems[i].pos.x, gems[i].pos.y, g.tileSize/2, g.tileSize/2);
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

module.exports.viewWinnerScreen =  (winnerId) => {
    showScreen("#victory-screen");
    $("#winner").text(winnerId);
};  

module.exports.viewGame = () => {
    showScreen("#game-screen");
};

module.exports.showSignIn = () => {
    showScreen("#sign-in-screen");
};

module.exports.printDataCount = (returned, sent) => {
    $("#dataCount").text(`Sent/Recieved: ${returned}/${sent}`);
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