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

let tilesToDraw = [];

// Square colors
let baseColor = "#FFA50080";


let DwarfAnimation = {
    frame: [1, 2],
    curFrame: 0,
    lastFrame: 0,
    interval: 250,
    w: 21,
    h: 21
};

let tileDestructionAnimation = [
    {tough: 1.9, imgName: 'stone'},
    {tough: 1.7, imgName: 'stoneBroke1'},
    {tough: 1.5, imgName: 'stoneBroke2'},
    {tough: 1.3, imgName: 'stoneBroke3'},
    {tough: 1.1, imgName: 'stoneBroke4'},
    {tough: 1.0, imgName: 'stoneBroke5'},
    {tough: 0.9, imgName: 'stoneFrac1'},
    {tough: 0.8, imgName: 'stoneFrac2'},
    {tough: 0.6, imgName: 'stoneFrac3'},
    {tough: 0.4, imgName: 'stoneFrac4'},
    {tough: 0.2, imgName: 'stoneFrac5'},
    {tough: 0.0, imgName: 'stoneFrac6'}
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
    tilesToDraw = [];
    
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

const drawTile = (imgName, tile, color = null) => {
    g.ctx.drawImage(img(imgName), g.calcObjBounds(tile, g.tileSize).x,g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
    if(color !== null){
        g.ctx.fillStyle = color;
        g.ctx.fillRect(g.calcObjBounds(tile, g.tileSize).x, g.calcObjBounds(tile, g.tileSize).y, g.tileSize,  g.tileSize);
    }
};

const drawTiles = (tiles, players) => {
    tilesToDraw = calcVisibleTiles(tiles, players);
    
    let playerTile;
    if(isDefined(thisPlayer)){
        playerTile = findPlayerTile(thisPlayer);
    }
    if(isDefined(playerTile)){
        for(let tile of tiles){
            let tileToughness = tile.tough.points;
            
            const tileType = {
                isIndestructable: () => tileToughness === -2,
                isVisible: () => shouldTileBeDrawn(tile, tilesToDraw),
                isRock: () =>  tileToughness > 0,
                isDirt: () => tileToughness <= 0,
                isTeamBase: () => tile.teamBase === thisPlayer.team,
            };

            if (tileType.isIndestructable()) {
                drawTile('wall', tile);
                continue;
            } 

            if(tileType.isTeamBase()){
                drawTile('dirt', tile, baseColor);
                continue;
            } 

            if(tileType.isVisible()){
                if(tileType.isRock()){
                    animationLoop:
                    for(let anim of tileDestructionAnimation){
                        if(tileToughness > +anim.tough){
                            drawTile(anim.imgName, tile);
                            break;
                        }
                    }
                    continue;
                } else if(tileType.isDirt()) {
                    drawTile('dirt', tile);
                    continue;
                }
            }
        } 

        g.ctx.stroke();
    }
};

const drawHealthBar = player => {
    g.ctx.fillStyle = "red";
    g.ctx.strokeRect(player.pos.x, player.pos.y - 10, g.playerSize, 5);
    g.ctx.fillRect(player.pos.x+1, player.pos.y - 9, g.playerSize*(player.health.points*0.01)-1, 3);
};

const isOnSquirrelTeam = ({team}) => team === 1 ? true : false;
const isOnDwarfTeam = ({team}) => team === 0 ? true : false;

const drawPlayers = (players, playerId, tiles) => {
    for(let player of players){
        let playerTile = g.findTileBelowPlayer(player, tiles);
        if((player.team === thisPlayer.team || thisPlayer.id == player.id || tilesToDraw.find(tile => tile === playerTile)) && g.isPlayerAlive(player)){// jshint ignore:line

        // Draw health
        drawHealthBar(player);

        if(isOnSquirrelTeam(player)){ // Is Squirrel
            g.ctx.drawImage(img('squirrel'), player.pos.x, player.pos.y, g.playerSize, g.playerSize);
        } else if(isOnDwarfTeam(player)){

            const dwarfAnimationDirector = {
                "left": {
                    "up": 'dwarfSpriteLeftUp',
                    "down": 'dwarfSpriteLeftDown',
                    "none": 'dwarfSpriteLeft',
                    "animation": 'dwarfAnimationLeft'
                },
                "right": {
                    "up": 'dwarfSpriteRightUp',
                    "down": 'dwarfSpriteRightDown',
                    "none": 'dwarfSpriteRight',
                    "animation": 'dwarfAnimationRight'
                }
            };

            let {pos: {animDirHorizontal: horizontalDir, animDirVertical: verticalDir}} = player;

            if(isDefined(horizontalDir)) {
                if(isDefined(dwarfAnimationDirector[horizontalDir][verticalDir])){
                    drawPlayerAnimation(
                        dwarfAnimationDirector[horizontalDir][verticalDir], 
                        dwarfAnimationDirector[horizontalDir].animation,
                        player.pos
                    );    
                }
            }
        }
            
        g.ctx.stroke();
        }
    }
};

const drawGems = (gems, players) => {
    for(let gem of gems){
        if(isOnSquirrelTeam(gem)){
            if(gem.carrier === -1){ // Right now, the gem carrier is never -1.
                g.ctx.drawImage(img('gem'), 0, 0, 32, 32, gem.pos.x, gem.pos.y, g.tileSize, g.tileSize);
            }
             else {
                g.ctx.drawImage(img('gem'), 0, 0, 32, 32, gem.pos.x, gem.pos.y, g.tileSize/2, g.tileSize/2);
            }
        } else if (isOnDwarfTeam(gem)) {
            if(gem.carrier === -1){
                g.ctx.drawImage(img('acorn'), gem.pos.x, gem.pos.y, g.tileSize, g.tileSize);
            } 
            else {
                g.ctx.drawImage(img('acorn'), gem.pos.x, gem.pos.y, g.tileSize/2, g.tileSize/2);
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

module.exports.printGemInfo = gems => {
    $("#gemInfo").text(`${gems.length} | ${gems[0].carrier} | ${gems[1].carrier}`);
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