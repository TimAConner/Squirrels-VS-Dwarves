"use strict";

module.exports.c = document.getElementById('game-canvas');
module.exports.ctx = module.exports.c.getContext("2d");

module.exports.ctx.canvas.width  = window.innerWidth;
module.exports.ctx.canvas.height = window.innerHeight;

module.exports.tileSize = 25;
module.exports.attackDistance = 1;
module.exports.attackStrength = 1;
module.exports.mineStrength = 0.01;

module.exports.playerId = 0;
