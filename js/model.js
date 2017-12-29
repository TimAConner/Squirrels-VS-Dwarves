"use strict";

let firebase = require('firebase');

let c = document.getElementById('game-canvas');

module.exports.fetchData = () => {
    let config = {
        apiKey: "AIzaSyBCXZz3201ouzE1QkjIYi6oHaZK7tXZLMw",
        authDomain: "squirrelsvsdwarves.firebaseapp.com",
        databaseURL: "https://squirrelsvsdwarves.firebaseio.com",
        projectId: "squirrelsvsdwarves",
        storageBucket: "squirrelsvsdwarves.appspot.com",
        messagingSenderId: "585991040011"
    };
      firebase.initializeApp(config);
      
      let ref  = firebase.database().ref("tiles");

    //   module.exports.getTiles("https://squirrelsvsdwarves.firebaseio.com/tiles.json").then((data) => {
    //       return convertObjectsToArray(data);
    //   });

      firebase.database().ref().on('value', function(snapshot) {
          console.log("Update");
          let serverUpdate = new CustomEvent("serverUpdate", {'detail': snapshot.val()});
          c.dispatchEvent(serverUpdate);
      });
};


const convertObjectsToArray = (object) => {
    let objectArray = [];

    for(let property in object){
        objectArray.push(object[property]);
    }

    objectArray.sort((a, b) => a.pos.z - b.pos.z);

    return objectArray;
};

module.exports.savePlayerData = (player) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(player);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PATCH", `https://squirrelsvsdwarves.firebaseio.com/players/players/${+player.id}.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveTileData = (tile) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(tile);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PATCH", `https://squirrelsvsdwarves.firebaseio.com/tiles/tiles/${+tile.id}.json`);
        JSONRequest.send(jsonString);
    });
};

// module.exports.getTiles = (url) => {
//     return new Promise(function (resolve, reject){
//         let JSONRequest = new XMLHttpRequest();
//         JSONRequest.addEventListener("load", () => {
//             resolve(JSON.parse(JSONRequest.responseText));
//         });
//         JSONRequest.addEventListener("error", () => {
//             console.log("The files weren't loaded correctly!");
//         });
//         JSONRequest.open("GET", url);
//         JSONRequest.send();
//     });
// };