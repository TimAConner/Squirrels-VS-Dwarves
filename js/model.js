"use strict";

let firebase = require('firebase');

let c = document.getElementById('game-canvas');

const $ = require("jquery");

let baseUrl = "https://squirrelsvsdwarves.firebaseio.com";

let url = "https://squirrelsvsdwarves.firebaseio.com/gameData/";

let gameId = "";

module.exports.setGameId = (id) => {
    gameId = id;
    url = `${baseUrl}/gameData/${gameId}`;
};
module.exports.getGameId = () => gameId;

// Loads apiKey.  Resolves when complete.
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

// Initiliaze firebase. Resolves when complete.
module.exports.initFirebase = () => {
    return new Promise(function (resolve, reject){
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
            resolve();
        });
    });
};


/*
Listen to games table for all games.
Thiis will create an event that bubble up from the game canvas when data changes or on first load.
Runs once by default.
*/
module.exports.listenToLobbys = () => {
    firebase.database().ref(`games`).on('value', function(snapshot) {
        let serverUpdate = new CustomEvent("serverUpdateGames", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
};

// Detaches Firebase listeners that are listening to gameData/gameId
module.exports.detachGameListeners = () => {
    firebase.database().ref(`gameData/${gameId}`).off();
};

/* 
Start the listener on gameState, tiles, players, and gems that are on server nested inside games.
They will create events that bubble up from the game canvas when data changes or on first load.
Runs once by default.
*/
module.exports.listenToGame = () => {
    // Try listening to only one of them.  One listens to tiles one listens to other.
    firebase.database().ref(`gameData/${gameId}/gameState`).on('value', function(snapshot) {
        //   console.log("-------Gem Update");
        let serverUpdate = new CustomEvent("serverUpdateGameState", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/tiles`).on('value', function(snapshot) {
    //   console.log("Update");
        let serverUpdate = new CustomEvent("serverUpdateTiles", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/players`).on('value', function(snapshot) {
        let serverUpdate = new CustomEvent("serverUpdatePlayer", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/gems`).on('value', function(snapshot) {
    //   console.log("Update");
        let serverUpdate = new CustomEvent("serverUpdateGems", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
};

module.exports.savePlayerPos = (player) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/${player.id}/.json`,
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
        url:`${baseUrl}/games/${gameId}/players/${playerStats.id}/.json`,
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify(playerStats),
    });
};

// Adds a blank game with a start date to games and returns its key.
module.exports.addGame = (startTime, name) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/games/.json`,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                "gameStart": startTime,
                "name": name
            }),
        })
        .done(gameKey => resolve(gameKey.name));
    });
};

module.exports.finishGame = (endTime, gameId) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/games/${gameId}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                "gameEnd": endTime,
            }),
        });
    });
};

module.exports.savePlayerHealth = (player) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/${player.id}/.json`,
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
        JSONRequest.open("DELETE", `${url}/players/${player.id}.json`);
        JSONRequest.send();
    });
};

module.exports.saveTileHard = (tile) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/tiles/${+tile.id}/.json`,
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
        JSONRequest.open("PUT", `${url}/tiles.json`);
        JSONRequest.send(jsonString);
    });
};

module.exports.saveGem = (gem) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/gems/${+gem.id}.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify(gem)
        })
        .done(data => resolve(data));
    });
};



module.exports.saveGameState = (state) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/gameState.json`,
            type: 'PUT',
            dataType: 'json',   
            data: JSON.stringify(state),
        }).done(data => resolve(data));
    });
};

module.exports.addNewPlayer = (player) => {
    let jsonString = JSON.stringify(player);
    let JSONRequest = new XMLHttpRequest();
    JSONRequest.open("POST", `${url}/players/.json`);
    JSONRequest.send(jsonString);
};


module.exports.saveNewMap = (tiles) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/tiles.json`,
            type: 'PUT',
            dataType: 'json',
            data: JSON.stringify(tiles)
        })
        .done(data => resolve(data));
    });
};

module.exports.deleteMap = id => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/gameData/${id}.json`,
            type: 'DELETE'
        })
        .done(data => resolve(data));
    });
};

module.exports.deleteLobby = id => {
    console.log('`${baseUrl}/games/${id}.json`', `${baseUrl}/games/${id}.json`);
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/games/${id}.json`,
            type: 'DELETE'
        })
        .done(data => resolve(data));
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