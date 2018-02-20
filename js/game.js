"use strict";

// Holds information that needs to be accessible by multiple modules
let c = document.getElementById('game-canvas');
let ctx = c.getContext("2d");

const mapWidth = 21;
const mapHeight = 21;
const tileSize = 30;


// Compensate for >= with +1
ctx.canvas.width  = (mapWidth+1)*tileSize;
ctx.canvas.height = (mapHeight+1)*tileSize;

const playerSpeed = 1;
const playerWithGemSpeed = 0.75;
const playerSize = 25;
const attackDistance = 1;
const attackStrength = 1;
const mineStrength = 0.01;
const gemPickupDistance = 15;



const team1 = "Dwarf";
const team2 = "Squirrel";


let playerId = 0;
let uid = "";
let fullName = "";

const battleTypes = ["Battle of",  "Battle of",  "Battle of",  "Skirmish of", "Siege of", "The Final Stand of", "Long Live", "The Legend of"];
const battleNames = ["Acorn Hill", "Akourncourt", "Skwir'el", "The Gem Stash", "The Acorn Stash", "Daarvenboro", "Drunken Allies", "Nutloser Pass", "Dwarf's Forge", "Leifcurn", "Skullcrack Hill", "Skwir'el Village", "Skwir'el Ford", "The Great Hoard", "The Tiny Hoard"];


// const battleAdjective = [""];
// const battleNoun = ["", ""];


const isPlayerAlive = player => {
    if(typeof player !== "undefined" && typeof player.health !== "undefined"){
        if(player.health.points > 0 ){
            return true;
        }
    }

    return false;
};


// Returns tile position based on their x and y and tilesize
const calcObjBounds = (obj, size, convertFromGrid = false) => {
    let x = convertFromGrid ? obj.pos.x : obj.pos.x * size,// min x (Left)
    y = convertFromGrid ? obj.pos.y : obj.pos.y * size,// min y (Top)
    b = y + size, // max y (Bottom)
    r = x + size; // max x (Right)
    return {x, y, b, r};
};


// Takes two pos and deals with distance.
const calcDistance = (posA,  posB) => {
    // console.log('posA, posB', posA, posB);
    let a = (posA.x) - (posB.x),
    b = (posA.y) - (posB.y);

    // Line must be ignored, because JS Hint doesn't recognize ** operator.
    let distance = Math.abs(Math.sqrt(a**2 + b**2));// jshint ignore:line

    return distance; 
};

const findTileBelowPlayer = (player, tiles) => {
    // Sorts through and finds tile closest to player
    let sortedTiles = tiles.slice().sort((a, b) =>{ 
        let TileADistance = calcDistance(player.pos, calcObjBounds(a, tileSize));
        let TileBDistance = calcDistance(player.pos, calcObjBounds(b, tileSize));
        return TileADistance - TileBDistance;
    });

    return sortedTiles[0];
};

const getTeamName = id => id === 0 ? team1 : team2;


module.exports = {
    c,
    ctx,
    playerSpeed,
    mapWidth,
    mapHeight,
    playerWithGemSpeed,
    tileSize,
    playerSize,
    attackDistance,
    attackStrength,
    mineStrength,
    gemPickupDistance,
    playerId,
    uid,
    fullName,
    battleTypes,
    battleNames,
    isPlayerAlive,
    calcDistance,
    findTileBelowPlayer,
    calcObjBounds,
    getTeamName
};