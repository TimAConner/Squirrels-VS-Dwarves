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

module.exports.playerId = 0;
module.exports.uid = "";
module.exports.fullName = "";

module.exports.battleTypes = ["Battle of",  "Battle of",  "Battle of",  "Skirmish of", "Siege of", "The Final Stand of", "Long Live", "The Legend of"];
module.exports.battleNames = ["Acorn Hill", "Akourncourt", "Skwir'el", "The Gem Stash", "The Acorn Stash", "Daarvenboro", "Drunken Allies", "Nutloser Pass", "Dwarf's Forge", "Leifcurn", "Skullcrack Hill"];



// Returns tile position based on their x and y and tilesize
module.exports.calcTilePos = (tile) => {
    let x = tile.pos.x * module.exports.tileSize,
    y = tile.pos.y * module.exports.tileSize,
    b = y + module.exports.tileSize, // Bottom
    r = x + module.exports.tileSize; // Right
    return {x, y, b, r};
};

module.exports.findTileBelowPlayer = (player, tiles) => {

    let playerX = (player.pos.x+module.exports.playerSize/2),
    playerY = (player.pos.y+module.exports.playerSize/2);    

    let sortedTiles = tiles.slice().sort((a, b) => {
        let tileAX= module.exports.calcTilePos(a).x,
        tileAY = module.exports.calcTilePos(a).y;
        
        let tileBX= module.exports.calcTilePos(b).x,
        tileBY = module.exports.calcTilePos(b).y;

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