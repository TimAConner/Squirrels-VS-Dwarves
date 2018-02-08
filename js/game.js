"use strict";

// Holds information that needs to be accessible by multiple modules

module.exports.c = document.getElementById('game-canvas');
module.exports.ctx = module.exports.c.getContext("2d");

module.exports.ctx.canvas.width  = window.innerWidth;
module.exports.ctx.canvas.height = window.innerHeight;

module.exports.tileSize = 30;
module.exports.playerSize = 25;
module.exports.attackDistance = 1;
module.exports.attackStrength = 1;
module.exports.mineStrength = 0.01;
module.exports.gemPickupDistance = 15;

module.exports.playerId = 0;
module.exports.uid = "";
module.exports.fullName = "";

module.exports.battleTypes = ["Battle of",  "Battle of",  "Battle of",  "Skirmish of", "Siege of", "The Final Stand of", "Long Live", "The Legend of"];
module.exports.battleNames = ["Acorn Hill", "Akourncourt", "Skwir'el", "The Gem Stash", "The Acorn Stash", "Daarvenboro", "Drunken Allies", "Nutloser Pass", "Dwarf's Forge", "Leifcurn", "Skullcrack Hill"];


module.exports.isPlayerAlive = ({health: {points: health}}) => {
    return health > 0 ? true : false;
};


// Returns tile position based on their x and y and tilesize
module.exports.calcTilePos = (tile) => {
    let x = tile.pos.x * module.exports.tileSize,
    y = tile.pos.y * module.exports.tileSize,
    b = y + module.exports.tileSize, // Bottom
    r = x + module.exports.tileSize; // Right
    return {x, y, b, r};
};

// Takes two pos and deals with distance.
module.exports.calcDistance = (posA,  posB) => {
    let a = (posA.x) - (posB.x),
    b = (posA.y) - (posB.y);

    // Line must be ignored, because JS Hint doesn't recognize ** operator.
    let distance = Math.abs(Math.sqrt(a**2 + b**2));// jshint ignore:line

    return distance; 
};

module.exports.findTileBelowPlayer = (player, tiles) => {
    // Sorts through and finds tile closest to player
    let sortedTiles = tiles.slice().sort((a, b) =>{ 
        let TileADistance = module.exports.calcDistance(player.pos, module.exports.calcTilePos(a));
        let TileBDistance = module.exports.calcDistance(player.pos, module.exports.calcTilePos(b));
        return TileADistance - TileBDistance;
    });

    return sortedTiles[0];
};