"use strict";

module.exports.c = document.getElementById('game-canvas');
module.exports.ctx = module.exports.c.getContext("2d");

module.exports.ctx.canvas.width  = 500;
module.exports.ctx.canvas.height = 500;

module.exports.tileSize = 25;