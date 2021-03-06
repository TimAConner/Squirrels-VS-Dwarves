"use strict";

const firebase = require('firebase');

const c = document.getElementById('game-canvas');

const $ = require("jquery");

const baseUrl = "https://squirrelsvsdwarves.firebaseio.com";

let url = "https://squirrelsvsdwarves.firebaseio.com/gameData/";

let gameId = "";

// List of required tables that each game needs to run
let requiredTables = ["gameState", "tiles", "players", "gems"];

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
    for(let table of requiredTables){
        firebase.database().ref(`gameData/${gameId}/${table}`).off();
    }
};

/* 
Start the listener on gameState, tiles, players, and gems that are on server nested inside games.
They will create events that bubble up from the game canvas when data changes or on first load.
Runs once by default.
*/
module.exports.listenToCurGame = () => {
    // Try listening to only one of them.  One listens to tiles one listens to other.
    firebase.database().ref(`gameData/${gameId}/gameState`).on('value', function(snapshot) {
        let serverUpdate = new CustomEvent("serverUpdateGameState", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/tiles`).on('value', function(snapshot) {
        let serverUpdate = new CustomEvent("serverUpdateTiles", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/players`).on('value', function(snapshot) {
        let serverUpdate = new CustomEvent("serverUpdatePlayer", {'detail': snapshot.val()});
        c.dispatchEvent(serverUpdate);
    });
    firebase.database().ref(`gameData/${gameId}/gems`).on('value', function(snapshot) {
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
        .done(data => {
            // Add the id to the resolved information
            let dataCopy = Object.assign({}, data);
            dataCopy.id = player.id;    
            resolve(dataCopy);
        });
    });
};

module.exports.savePlayerStats = playerStats => {
    $.ajax({
        url:`${baseUrl}/games/${gameId}/players/${playerStats.id}/.json`,
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify(playerStats),
    });
};

// Adds a blank game with a start date to games and returns its key.
module.exports.addLobby = (startTime, name) => {
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

module.exports.finishGame = (endTime,  winner) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/games/${gameId}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                "gameEnd": endTime,
                winner
            }),
        });
    });
};

module.exports.savePlayerHealth = (player) => {
    console.log('player', player);
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/${player.id}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                "health": player.health
            }),
        })
        .done(data => {
            // Add the id to the resolved information
            let dataCopy = Object.assign({}, data);
            dataCopy.id = player.id;    
            resolve(dataCopy);
        });
    });
};


module.exports.deletePlayer = (player) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/${player.id}.json`,
            type: 'DELETE',
            dataType: 'json'
        }).done(data => resolve(data));
    });
};

module.exports.saveTileTough = (tile) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/tiles/${+tile.id}/.json`,
            type: 'PATCH',
            dataType: 'json',
            data: JSON.stringify({
                tough: tile.tough
            })
        })
        .done(data => {
            // Add the id to the resolved information
            let dataCopy = Object.assign({}, data);
            dataCopy.id = tile.id;    
            resolve(dataCopy);
        })
        .fail(data => {console.log("failed");reject(data);});
    });
};

module.exports.saveNewTileSet = (tiles) => {
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/tiles.json`,
            type: 'PUT',
            dataType: 'json',   
            data: JSON.stringify(tiles),
        }).done(data => resolve(data));
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
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${url}/players/.json`,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(player)
        })
        .done(data => resolve(data));
    });
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

// TODO: Figure out how to remove map data all togethor.
// Map is being deleted, but the game state is being sent after the map is deleted.
module.exports.deleteCurrentMap = () => module.exports.deleteMap(gameId);

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
    return new Promise(function (resolve, reject){
        $.ajax({
            url:`${baseUrl}/games/${id}.json`,
            type: 'DELETE'
        })
        .done(data => resolve(data));
    });
};