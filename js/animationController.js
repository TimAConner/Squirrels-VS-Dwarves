'use strict';
const g = require("./game");
const img = require("./imageController");

/*
Animation Example:
{
    frames: [1, 2],
    curFrame: 0,
    lastFrame: 0,
    interval: 250,
    w: 21,
    h: 21
}
*/

// Current time in miliseconds updated on each shouldIncrementFrame()
let currentTime = 0;

// Array of total animations
let animations = [];

const addAnimation = (name, animation) => {
    let {frames, curFrame, lastFrame, interval, w, h} = animation;
    let animationObject = {
        name,
        frames,
        curFrame,
        lastFrame, 
        interval,
        w,
        h
    };
    animations.push(animationObject);   
};

const findAnimation = name => {
    let animation = animations.find(anim => anim.name === name);
    if(typeof animation === "undefined") console.log(`Cannot find ${name} animation.`);
    return animation;
};

addAnimation('dwarfAnimation', 
    {
        frames: [1, 2],
        curFrame: 0,
        lastFrame: 0,
        interval: 250,
        w: 21,
        h: 21
    }
);

addAnimation('dwarfAnimationLeft', 
    {
        frames: [1, 2],
        curFrame: 0,
        lastFrame: 0,
        interval: 250,
        w: 21,
        h: 21
    }
);

// Calculates location in the spritesheet of the current frame.
const calcFrame = ({frames, curFrame, w}) => {
    let frameIndex = frames[curFrame%frames.length];
    return (frameIndex * w);
};

// Returns true if enough time has passed between current and last frame.
const shouldIncrementFrame = ({lastFrame, interval}) => {
    currentTime = Date.now();
    return (currentTime - lastFrame) > interval; 
};

// TODO: Link current time in shouldIncrement Frame and selectNextFrame.
// Selects next frame
const selectNextFrame = (animation) => {
    // console.log('curFrame, lastFrame', curFrame, lastFrame);
    animation.curFrame ++;
    animation.lastFrame = currentTime;
    // console.log('curFrame, lastFrame', curFrame, lastFrame);
};

// Draws player animation on the canvas then calls updateAnimation to get a new frame.
// Animations run along x axis, so the animations must be in a horizontal strip.
const drawPlayerAnimation = (imgName, animationName, position) => {
    let animation = findAnimation(animationName);
    g.ctx.drawImage(img(imgName), calcFrame(animation), 0, animation.w, animation.h, position.x, position.y, g.playerSize, g.playerSize); 
    if(shouldIncrementFrame(animation)) selectNextFrame(animation);
};

/*
 Export just drawPlayerAniation so this can be called refrenced by
    const drawPlayerAnimation = require("./animationController");
 and called by
    drawPlayerAnimation();
 */

module.exports = drawPlayerAnimation;