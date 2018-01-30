'use strict';

/*

Images are loaded and stored in this file so they don't clutter up the rest of the file.

*/

let dwarfAnimation = new Image();
dwarfAnimation.src = "./img/dwarfAnimation.png";

/* 
End Animation Testing Variables
*/


let dwarfImage = new Image(); 
dwarfImage.src = './img/dwarf.png'; 

let squirrelImage = new Image(); 
squirrelImage.src = './img/squirrel.png'; 

let dirtImage = new Image();
dirtImage.src = "./img/dirt.png";


let stoneImage = new Image();
stoneImage.src = "./img/stone.jpeg";

// Gems

// https://opengameart.org/content/32x32-pixel-gems
// Copyright/Attribution Notice: 
// Credit:Jianhui999 https://www.patreon.com/GamePixelArt Credit: http://opengameart.org/users/jianhui999

let gemImage = new Image();
gemImage.src = "./img/gems.png";

let acornImage = new Image();
acornImage.src = "./img/acorn.png";


// Export images so that I don't have to write module.exports infront of every pair.
module.exports = {
    dwarfAnimation,
    dwarfImage,
    squirrelImage,
    dirtImage,
    stoneImage,
    gemImage,
    acornImage
};