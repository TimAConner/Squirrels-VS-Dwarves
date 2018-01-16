"use strict";

// module.exports.showTiles = (tiles) => {
//     console.log(tiles);
// };


let screens = ["#victory-screen", "#main-menu-screen", "#game-screen", "#loading-screen"];

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


// Angular

let players = ['two'];

module.exports.setPlayers = (x) => {
    players = x;
};

let app = angular.module("myApp", []);

app.controller("myCtrl", ['$scope', function($scope) {
    $("#game-canvas").on("serverUpdatePlayer", (e) => {
        $scope.$apply(function(){
            $scope.players = Object.keys(e.detail.players);
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
                    g.ctx.drawImage( stoneImage ,g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    
                // console.log("b",  distance);
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    
                } else {
                    if(tiles[i].teamBase === thisPlayer.team){
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                        g.ctx.fillStyle = baseColor;
                        g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                        
                    } else {
                        g.ctx.fillStyle = minedColor; 
                        g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                        
                    }
                   
                    
                // console.log("w", distance);
                }
            } else {
                if(tiles[i].teamBase === thisPlayer.team){
                    g.ctx.fillStyle = minedColor; 
                    g.ctx.drawImage( dirtImage ,g.calcTilePos(tiles[i]).x,g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    g.ctx.fillStyle = baseColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    
                } else if (tiles[i].hard.points === -2) {
                    g.ctx.fillStyle = edgeColor;
                    g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    
                } 
                // else {
                //     g.ctx.fillStyle = unknownColor;
                //     g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
                    
                // }
                // console.log("b", distance);
            }   
            
        } 
        // else {
        //     g.ctx.fillStyle = unknownColor;
        //     g.ctx.fillRect(g.calcTilePos(tiles[i]).x, g.calcTilePos(tiles[i]).y, tiles[i].size.w,  tiles[i].size.h);
            
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
    drawPlayers(players, playerId, tiles);
    drawGems(gems, players);
};




module.exports.showLoadingScreen = () => {
    showScreen("#loading-screen");
};

module.exports.viewMainMenu = () => {
    showScreen("#main-menu-screen");
};

module.exports.viewWinnerScreen =  (winnerId) => {
    showScreen("#victory-screen");
    $("#winner").text(winnerId);
};  

module.exports.viewGame = () => {
    showScreen("#game-screen");
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