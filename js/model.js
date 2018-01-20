"use strict";

let firebase = require('firebase');

let c = document.getElementById('game-canvas');

const $ = require("jquery");

let url = "https://squirrelsvsdwarves.firebaseio.com";

const loadAPI = () => {
    return new Promise(function (resolve, reject){
        let apiRequest = new XMLHttpRequest();
        apiRequest.addEventListener("load", () => {
            resolve(JSON.parse(apiRequest.responseText));
        });
        apiRequest.addEventListener("error", () => {
            console.log("The files weren't loaded correctly!");
        });
        apiRequest.open("GET", "./js/apiKey.json");
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
  
  

      // Listening is not the issue.  It is how quicklyi an xhr request is sent.

      
      // Try listening to only one of them.  One listens to tiles one listens to other.
        firebase.database().ref("gameState").on('value', function(snapshot) {
            //   console.log("-------Gem Update");
            let serverUpdate = new CustomEvent("serverUpdateGameState", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("tiles").on('value', function(snapshot) {
          //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdateTiles", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("players").on('value', function(snapshot) {
            let serverUpdate = new CustomEvent("serverUpdatePlayer", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });
        firebase.database().ref("gems").on('value', function(snapshot) {
        //   console.log("Update");
            let serverUpdate = new CustomEvent("serverUpdateGems", {'detail': snapshot.val()});
            c.dispatchEvent(serverUpdate);
        });


    });


};

module.exports.savePlayerPos = (player) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/players/${player.id}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                "pos": player.pos
            }),
        })
        .done(data => resolve(data));
    });
};

module.exports.savePlayerStats = (playerStats, gameId) => {
    $.ajax({
        url:`${url}/games/${gameId}/players/${playerStats.id}/.json`,
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify(playerStats),
    });
};

module.exports.addGame = (startTime) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/games/.json`,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                "gameStart": startTime,
            }),
        });
    });
};

module.exports.savePlayerHealth = (player) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/players/${player.id}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                "health": player.health
            }),
        })
        .done(data => resolve(data));
    });
};


module.exports.deletePlayer = (player) => {
    return new Promise(function (resolve, reject){
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("DELETE", `${url}/players/players/${player.id}.json`);
        JSONRequest.send();
    });
};

module.exports.saveTileHard = (tile) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/tiles/tiles/${+tile.id}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                hard: tile.hard
            })
        })
        .done(data => resolve(data));
    });
};

module.exports.saveNewTileSet = (tiles) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(tiles);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PUT", `${url}/tiles/tiles.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveGem = (gem) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/gems/gems/${+gem.id}.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify(gem)
        })
        .done(data => resolve(data));
    });
};



module.exports.saveGameState = (state) => {
    return new Promise(function (resolve, reject){
        let jsonString = JSON.stringify(state);
        let JSONRequest = new XMLHttpRequest();
        JSONRequest.open("PUT", `${url}/gameState.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.addNewPlayer = (player) => {
    let jsonString = JSON.stringify(player);
    let JSONRequest = new XMLHttpRequest();
    JSONRequest.open("POST", `${url}/players/players/.json`);
    JSONRequest.send(jsonString);
};


module.exports.saveNewMap = (data) => {
    let jsonString = JSON.stringify(data);
    let JSONRequest = new XMLHttpRequest();
    JSONRequest.open("PUT", `${url}/tiles/tiles.json`);
    JSONRequest.send(jsonString);
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