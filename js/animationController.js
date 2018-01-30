'use strict';
const g = require("./game");
const img = require("./imageController");

// Current time in timestamp updated on each selectNextFrame & shouldIncrementFrame
let currentTime = 0;

/*
Animation Example:
{
    frame: [1, 2],
    curFrame: 0,
    lastFrame: 0,
    interval: 250,
    w: 21,
    h: 21
}
*/

// Calculates location in the spritesheet of the current frame.
const calcFrame = (animation) => {
    let frameIndex = animation.frame[animation.curFrame%animation.frame.length];
    return (frameIndex * animation.w);
};

// Returns true if enough time has passed between current and last frame.
const shouldIncrementFrame = (animation) => {
    currentTime = Date.now();
    return (currentTime - animation.lastFrame) > animation.interval; 
};

// TODO: Link current time in shouldIncrement Frame and selectNextFrame.
// Selects next frame
const selectNextFrame = (animation) => {
    animation.curFrame++;
    animation.lastFrame = currentTime;
};

// Draws player animation on the canvas then calls updateAnimation to get a new frame.
const drawPlayerAnimation = (imgName, animation, position) => {

    // Animations run along x axis, so the animations must be in a horizontal strip.
    g.ctx.drawImage(img(imgName), calcFrame(animation), 0, animation.w, animation.h, position.x, position.y, g.playerSize, g.playerSize); 

    if(shouldIncrementFrame(animation)) selectNextFrame(animation);
};

module.exports = drawPlayerAnimation;