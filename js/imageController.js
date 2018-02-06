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
    let image = images.find(img => img.name === name).image;
    if(typeof image === "undefined") console.log(`Cannot find ${name} image.`);
    return image;
};

addImage('dwarfSprite', './img/dwarfAnimation.png');
addImage('dwarf', './img/dwarf.png');
addImage('squirrel', './img/squirrel.png');
addImage('dirt', "./img/small.png");
addImage('stone', "./img/stone.jpeg");
 
addImage('stoneBroke1', "./img/stoneBroke1.jpg");
addImage('stoneBroke2', "./img/stoneBroke2.jpg");
addImage('stoneBroke3', "./img/stoneBroke3.jpg");
addImage('stoneBroke4', "./img/stoneBroke4.jpg");
addImage('stoneBroke5', "./img/stoneBroke5.jpg");
addImage('stoneFrac1', "./img/stoneBroke6.jpg");
addImage('stoneFrac2', "./img/stoneFrac3.jpg");
addImage('stoneFrac3', "./img/stoneFrac5.jpg");
addImage('stoneFrac4', "./img/stoneFrac7.jpg");
addImage('stoneFrac5', "./img/stoneFrac9.jpg");
addImage('stoneFrac6', "./img/stoneFrac11.jpg");

// https://opengameart.org/content/32x32-pixel-gems
// Copyright/Attribution Notice: 
// Credit:Jianhui999 https://www.patreon.com/GamePixelArt Credit: http://opengameart.org/users/jianhui999
addImage('gem', "./img/gems.png");
addImage("acorn", "./img/acorn.png");


module.exports = findImage;
