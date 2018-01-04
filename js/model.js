"use strict";

let firebase = require('firebase');

let c = document.getElementById('game-canvas');

const loadAPI = () => {
    return new Promise(function (resolve, reject){
        let apiRequest = new XMLHttpRequest();
        apiRequest.addEventListener("load", () => {
            resolve(JSON.parse(apiRequest.responseText));
        });
        apiRequest.addEventListener("error", () => {
            console.log("The files weren't loaded correctly!");
        });
        apiRequest.open("GET", "../js/apiKey.json");
        apiRequest.send();
    });
};

module.exports.fetchData = () => {
    let config = {
        apiKey: "",
        authDomain: "squirrelsvsdwarves.firebaseapp.com",
        databaseURL: "https://squirrelsvsdwarves.firebaseio.com",
        projectId: "squirrelsvsdwarves",
        storageBucket: "squirrelsvsdwarves.appspot.com",
        messagingSenderId: ""
    };

    loadAPI().then(data => {
        config.apiKey = data.apiKey;
        config.messagingSenderId = data.messagingSenderId;
        firebase.initializeApp(config);
        
        
  
      //   module.exports.getTiles("https://squirrelsvsdwarves.firebaseio.com/tiles.json").then((data) => {
      //       return convertObjectsToArray(data);
      //   });
  
  
      // Try listening to only one of them.  One listens to tiles one listens to other.
        firebase.database().ref("tiles").on('value', function(snapshot) {
          //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdateTiles", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("players").on('value', function(snapshot) {
          //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdatePlayer", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("gems").on('value', function(snapshot) {
        //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdateGems", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("gameState").on('value', function(snapshot) {
            //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdateGameState", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });

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

module.exports.savePlayer = (player) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(player);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PATCH", `https://squirrelsvsdwarves.firebaseio.com/players/players/${+player.id}.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveTile = (tile) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(tile);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PATCH", `https://squirrelsvsdwarves.firebaseio.com/tiles/tiles/${+tile.id}.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveNewTileSet = (tiles) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(tiles);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PUT", `https://squirrelsvsdwarves.firebaseio.com/tiles/tiles.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveGem = (gem) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(gem);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PATCH", `https://squirrelsvsdwarves.firebaseio.com/gems/gems/${+gem.id}.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveGameState = (state) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(state);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PUT", `https://squirrelsvsdwarves.firebaseio.com/gameState.json`);
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