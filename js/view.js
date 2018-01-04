"use strict";

// module.exports.showTiles = (tiles) => {
//     console.log(tiles);
// };

const g = require("./game");


let sightDistance = 2.25;

// Square colors
let unknownColor = "black",
minedColor = "blue",
rockColor = "brown",
baseColor = "orange",
allyColor = "green",
enemyColor = "red",
allyGemColor = "yellow",
enemyGemColor = "yellow";

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


const drawTiles = (tiles) => {
    for(let i = 0; i < tiles.length; i++){

        // console.log(`${tiles[i].pos.x} - ${tiles[i].pos.y}`);
        // g.ctx.fillStyle = "green";
        // g.ctx.font = "10px Arial";
        // g.ctx.fillText(`${tiles[i].pos.x} - ${tiles[i].pos.y}`,tiles[i].pos.x*25, tiles[i].pos.y*25);


        
        let playerTile;
        if(thisPlayer !== undefined){
            playerTile = findPlayerTile(thisPlayer);
        }
        
        if(playerTile !== undefined){

            let a = (playerTile.pos.x+0.5) - (tiles[i].pos.x+0.5),
            b = (playerTile.pos.y+0.5) - (tiles[i].pos.y+0.5),
            distance = Math.sqrt(a*a + b*b);
            if(Math.abs(distance) <= sightDistance){
                if(tiles[i].hard > 0){
                    g.ctx.fillStyle = rockColor; 
                    
                // console.log("b",  distance);
                } else {
                    if(tiles[i].teamBase === thisPlayer.team){
                        g.ctx.fillStyle = baseColor;
                    } else {
                        g.ctx.fillStyle = minedColor; 
                    }
                   
                    
                // console.log("w", distance);
                }
            } else {
                if(tiles[i].teamBase === thisPlayer.team){
                    g.ctx.fillStyle = baseColor;
                } else {
                    g.ctx.fillStyle = unknownColor;
                }
                // console.log("b", distance);
            }   
            
        } else {
            g.ctx.fillStyle = unknownColor;
        }   

       
        g.ctx.fillRect(tiles[i].pos.x*tiles[i].size.w, tiles[i].pos.y*tiles[i].size.h, tiles[i].size.w,  tiles[i].size.h);
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

const drawPlayers = (players) => {
        
    for(let i = 0; i < players.length; i++){
        // let playerDirection = (players[i].dir*30);
        // g.ctx.rotate(playerDirection * Math.PI / 180);

        if(players[i].team === thisPlayer.team || thisPlayer.id == players[i].id || canSeePlayer(thisPlayer, players[i], sightDistance)){
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
            if(players[i].team === thisPlayer.team){
                g.ctx.fillStyle = allyColor; 
            } else {
                g.ctx.fillStyle  = enemyColor;
            }
            
            g.ctx.fillRect(players[i].pos.x, players[i].pos.y, players[i].size.w, players[i].size.h);
            g.ctx.stroke();

            // g.ctx.restore();
        }
        
        // g.ctx.rotate(-playerDirection * Math.PI / 180);
    }
};

const drawGems = (gems, players) => {
    for(let i = 0; i < gems.length; i++){

        if(thisPlayer.team === gems[i].team){
            g.ctx.fillStyle = allyGemColor; 
        } else {
            g.ctx.fillStyle  = enemyGemColor;
        }
           


        if(gems[i].carrier === -1){
            g.ctx.fillRect(gems[i].pos.x, gems[i].pos.y, gems[i].size.w, gems[i].size.h);
        } else {
            let carrier = players.find(player => player.id === gems[i].carrier); // jshint ignore:line
            g.ctx.fillRect(carrier.pos.x+(gems[i].size.w/4), carrier.pos.y+(gems[i].size.h/4), gems[i].size.w/2, gems[i].size.h/2);
        }
        g.ctx.stroke();
    }
};

module.exports.draw = (playerId, tiles, players, gems) => {
    thisPlayer = players.find(x => x.id === playerId);
    g.ctx.clearRect(0, 0, g.c.width, g.c.height);

    drawTiles(tiles);
    drawPlayers(players);
    drawGems(gems, players);
};

module.exports.showLoadingScreen = () => {
    hideAllMenus();
    
    document.getElementById("loading-screen").classList.remove("hide");
};

module.exports.viewMainMenu = () => {
    hideAllMenus();
    
    document.getElementById("main-menu-screen").classList.remove("hide");
};

module.exports.viewWinnerScreen =  (winnerId) => {
    hideAllMenus();

    document.getElementById("victory-screen").classList.remove("hide");
    document.getElementById("winner").textContent = winnerId;
};  

module.exports.viewGame = () => {
    hideAllMenus();


    document.getElementById("player-id").classList.remove("hide");
    g.c.classList.remove("hide");
};

const hideAllMenus = () => {

    document.getElementById("victory-screen").classList.add("hide");
    document.getElementById("player-id").classList.add("hide");
    document.getElementById("main-menu-screen").classList.add("hide");
    document.getElementById("loading-screen").classList.add("hide");
    g.c.classList.add("hide");
};