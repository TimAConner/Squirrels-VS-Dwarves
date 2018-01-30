'use strict';

/*

Images are loaded and stored in this file so they don't clutter up the rest of the file.

*/

// Array holding all images and names.
let images = [];

// Adds an image to images array
const addImage = (name, src) => {
    let newImage = new Image();
    newImage.src = src;
    images.push({
        name,
        'image': newImage
    });
};

/* 
Returns an image from images array based on a name given.
Is called by passing into the required variable a name.  
Example: const img = require("./imageController"); img('dwarfImage');
*/
const findImage = (name) => {
    return images.find(img => img.name === name).image;
};

addImage('dwarfAnimation', './img/dwarfAnimation.png');
addImage('dwarf', './img/dwarf.png');
addImage('squirrel', './img/squirrel.png');
addImage('dirt', "./img/dirt.png");
addImage('stone', "./img/stone.jpeg");

// https://opengameart.org/content/32x32-pixel-gems
// Copyright/Attribution Notice: 
// Credit:Jianhui999 https://www.patreon.com/GamePixelArt Credit: http://opengameart.org/users/jianhui999
addImage('gem', "./img/gems.png");
addImage("acorn", "./img/acorn.png");


module.exports = findImage;
