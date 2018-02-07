"use strict";
/*
Using information by :

Isaac Sukin
http://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing

Gabriel Gambetta
http://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html

Bahlor
https://coderwall.com/p/iygcpa/gameloop-the-correct-way

*/
const model = require("./model");
const view = require("./view");
const login = require("./login");
const g = require("./game");
const $ = require("jquery");
const gameMaker = require("./gameMaker");

const _ = require("lodash");


const angular = require("angular");


// 0 menu, 1 game, 2 winner

let onlineGameState = 0,
localGameState = 0,
waitingForGame = false;


let winner = 0;


let players = [];
let tiles = [];
let gems = [];
let games = [];

let proccessedActions = [];
let completedActions = [];

let newPlayers = [];
let newTiles = [];
let newGems = [];



let speedMultiplier = 0.1;


let localPlayerStats =  {  
    id: 0,
    uid: "",
    damageDelt: 0,
    mined: 0,
    team: 0,
    spawnTime: 0,
    deathTime: 0
};
let statsSent = false;

//  Use timestamp instead?
let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false, 
    ArrowDown: false,
    " ": false,
    d: false,
    s: false
};


let initialLobbyLoad = true;

let initialTileDraw = true;
let initialPlayerDraw = true;
let initialGemDraw = true;
let initialGameState = true;

let proccessDataThisFrame = false;



let timestep = 1000 / 60,
delta = 0,
lastFrameTimeMs = 0;


let lag = 0; // Time between current timestamp and new peices of data timestamp.
let countDataReturned = 0, // Count of data returned after sending information.
countDataSent = 0; // Count of data sent to  firebase.

let app = angular.module("myApp", []);

app.controller("myCtrl", ['$scope', function($scope) {


    let convertMiliToHMS = millis => {
        let hours = Math.floor(millis / 3600000);
        let minutes = Math.floor(millis / 60000)%60;
        let seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${hours}:${minutes >= 10 ? minutes :  `0` + minutes}:${seconds >= 10 ? seconds :  `0` + seconds}`;
       // return `${(hours >= 1 ? `${hours} hour` : ``)} ${ minutes > 0 ? `${minutes} minutes,` : ``} ${seconds} seconds.`;
    };

    let convertMiliToDate = millis => {
        let date = new Date(millis);
        return `${date.getMonth()+1}/${date.getDate()+1}/${date.getFullYear()}`;
    };

    $("#game-canvas").on("serverUpdatePlayer", (e) => {
        _.defer(function(){ 
            $scope.$apply(function(){
                if(e.detail !== null){
                    let ownedPlayers = Object.keys(e.detail).filter(x => e.detail[x].uid == g.uid).map(x => e.detail[x]);
                    let otherPlayers = Object.keys(e.detail).filter(x => e.detail[x].uid != g.uid).map(x => e.detail[x]);
                    $scope.ownedPlayers = ownedPlayers;
                    $scope.otherPlayers = otherPlayers;
                } else {
                    $scope.otherPlayers = [];
                    $scope.ownedPlayers = [];
                }
                
            });
        });
    });
    $("#game-canvas").on("serverUpdateGames", (e) => {
        // Force Angular to digest new lobbies to update the html
        _.defer(function(){ 
            $scope.$apply(function(){
                if(e.detail !== null){
                    
                    // Add firebase key to lobbys
                    let lobbyDetails = Object.keys(e.detail).map(lobbyKey => {
                        e.detail[lobbyKey].key = lobbyKey;

                        //Add game time to lobby information
                        if(typeof e.detail[lobbyKey].gameEnd !== "undefined"){
                            e.detail[lobbyKey].gameTime = convertMiliToHMS(+e.detail[lobbyKey].gameEnd - +e.detail[lobbyKey].gameStart);
                        }

                        // Add game date
                        e.detail[lobbyKey].date = convertMiliToDate(e.detail[lobbyKey].gameStart);

                        // For each player, add a life time.
                        if(typeof e.detail[lobbyKey].players !== "undefined") {
                            Object.values(e.detail[lobbyKey].players).forEach(player => {
                                // If the player died, calculate lifetime from spawn to death, else from spawn to end of game.
                                player.lifeTime = player.deathTime === 0 ? convertMiliToHMS(e.detail[lobbyKey].gameEnd - player.spawnTime) : convertMiliToHMS(player.deathTime - player.spawnTime);
                            });
                        }

                        return e.detail[lobbyKey];
                    });
                    

                    // Reverse order of lobbies to have newer first.
                    $scope.lobbyList = _.reverse(lobbyDetails);
                }
            });
        });
    });

    $scope.selectGame = id => {
        model.setGameId(id);
        model.detachGameListeners(); // Detach previous game listeners
        model.listenToGame();// Listen to new game data
    };

    $scope.deleteGame = id => {
        model.deleteLobby(id);
        model.deleteMap(id);
    };


    // Select the player to be played
    // and puts its values into the localPlayerStats to be later sent when game is complete.

    // TODO: Make sure that localPlayerStats are being sent to the database properly.
    $scope.selectPlayer = id => {
        g.playerId = id;      
        
        console.log('players', [...players]);
        let player = players.find(x => x.id === g.playerId);
        console.log('players', players);

        console.log('player', player);
        
        console.log('id', id);
        if(player !== undefined){
            localPlayerStats.uid = g.uid;
            localPlayerStats.id = g.playerId;
            localPlayerStats.spawnTime = Date.now();
            localPlayerStats.team = player.team;       
        }
        console.log('localPlayerStats', localPlayerStats);
        startPlay();
    };

    $scope.removePlayer = id => {
        model.deletePlayer({id});
    };
    
    $scope.isLobbySelected = () => model.getGameId() !== "" ? true : false;
    
    $scope.addDwarf = () => {
        gameMaker.addPlayer(0, tiles, players.length);
    };

    $scope.addSquirrel = () => {
        gameMaker.addPlayer(1, tiles, players.length);
    };

    $scope.isFinished = gameEnd => typeof gameEnd !== "undefined" ? true : false;

    $scope.isObjectEmpty = obj => {
        return typeof obj === "undefined" || Object.keys(obj).length === 0;
    };

}]);

const canMove = (direction, obj, delta) => {
    let objLeftPoint = obj.pos.x,
    objRightPoint = obj.pos.x+g.playerSize,
    objBottomPoint = obj.pos.y+g.playerSize,
    objTopPoint = obj.pos.y;

    let increment = speedMultiplier*delta;

    for(let i = 0; i < tiles.length; i++){

        let tileXPosition = g.calcTilePos(tiles[i]).x,
        tileYPosition = g.calcTilePos(tiles[i]).y;

        let tileRightPoint = tileXPosition + g.tileSize,
        tileLeftPoint = tileXPosition,
        tileBottomPoint = tileYPosition + g.tileSize,
        tileTopPoint = tileYPosition;
        
       if(tiles[i].hard.points > 0 || tiles[i].hard.points === -2){ // If it  is still hard or if hardness is -2, unbreakable.
            if(((objTopPoint > tileTopPoint && objTopPoint < tileBottomPoint) || (objBottomPoint > tileTopPoint && objBottomPoint < tileBottomPoint))){
                if(direction === "left"){
                    if((((objLeftPoint-increment) < tileRightPoint && (objLeftPoint-increment) > tileLeftPoint))){
                        // console.log(tileLeftPoint, (objLeftPoint-increment), tileRightPoint);
                        // console.log("left");
                        return false;
                    }
                } else if (direction === "right"){
                    if(((((objRightPoint+increment) > tileLeftPoint) && (objRightPoint+increment) < tileRightPoint))){
                        // console.log("right");
                        return false;
                    }
                }
            }

            if( (objRightPoint > tileLeftPoint && objRightPoint < tileRightPoint) ||  (objLeftPoint < tileRightPoint && objLeftPoint > tileLeftPoint)){
                if(direction === "up"){
                    if(((objTopPoint-increment) > tileTopPoint && (objTopPoint-increment) < tileBottomPoint)){
                        // console.log("up");
                        return false;
                   }
                } else if(direction === "down"){
                    if((objBottomPoint+increment) > tileTopPoint && (objBottomPoint+increment) < tileBottomPoint){
                        // console.log(tileBottomPoint, objTopPoint, tileTopPoint);
                        // console.log(tileBottomPoint, objBottomPoint , tileTopPoint);
                        // console.log("down");
                        return false;
                   }
                }
            }
        }
    }

    return true;
};

const findTileInDirection = (player) => {

    // let tile = tiles.find(x => {
    //     let leftSide = (x.pos.x*x.size.w),
    //     rightSide = (x.pos.x*x.size.w)+x.size.w;
    
    //     return player.x.pos > leftSide && player.x.pos < rightSide && 

    // });

    // console.log(tile.pos.x, " ", tile.pos.y);

    let direction = player.pos.dir;

    // Find tile based on middle of player.

    let tileX = Math.floor((player.pos.x+g.playerSize/2) / g.tileSize),
    tileY = Math.floor((player.pos.y+g.playerSize/2) / g.tileSize);

    // console.log(tileX, tileY);
    if(direction === "up"){
        tileY -= 1;
    } else if(direction === "down"){
        tileY += 1;
    } else if(direction === "left"){
        tileX -= 1;
    } else if(direction === "right"){
        tileX += 1;
    }

    // console.log(tileX, tileY);
    let tile = tiles.find(t => t.pos.x === tileX && t.pos.y === tileY);
    // console.log(tile);


    return tile;
};

const isKeyOn = (prop) => { 
    if(keys[prop] === true){
        return true;
    } else {
        return false;
    }
};

// Takes two pos and deals with distance.
const calcDistance = (posA,  posB) => {
    
    let a = (posA.x) - (posB.x),
    b = (posA.y) - (posB.y);

    // Line must be ignored, because JS Hint doesn't recognize ** operator.
    let distance = Math.sqrt(a**2 + b**2);// jshint ignore:line

    return Math.abs(distance); 
};

const findCloseGem = (player) => {
    let gem = gems.find((gem) => {

        let a = (player.pos.x) - (gem.pos.x),
        b = (player.pos.y) - (gem.pos.y),

        // Line must be ignored, because JS Hint doesn't recognize ** operator.
        distance = Math.sqrt(a**2 + b**2);// jshint ignore:line
        return Math.abs(distance) <= 15; // 10 Pixels
    });

    return gem;
};

const getGemOnTile = (tile) => {
    let gem = gems.find((gem) => {
        let tileXPosition = g.calcTilePos(tile).x,
        tileYPosition = g.calcTilePos(tile).y;

        let tileRightPoint = tileXPosition + g.tileSize,
        tileLeftPoint = tileXPosition,
        tileBottomPoint = tileYPosition + g.tileSize,
        tileTopPoint = tileYPosition;        

        // console.log(gem.team, tileLeftPoint, gem.pos.x, tileRightPoint, tileTopPoint, gem.pos.y, tileBottomPoint);
        return gem.carrier === -1 && gem.pos.x >= tileLeftPoint && gem.pos.x <= tileRightPoint && gem.pos.y >= tileTopPoint && gem.pos.y <= tileBottomPoint;
    });

    // console.log('gem', gem);
    return gem;
};

const setWinner = (teamId) => {
    console.log("set winner");
    let winningObject = {
        gameState: 2,
        winningTeam: teamId
    };
    model.saveGameState(winningObject);
};

const initiateGameState = () => {
    waitingForGame = true;
    
    let winningObject = {
        gameState: 1,
        winningTeam: 0
    };
    
    model.saveGameState(winningObject);
    
};

// TODO: Fix proccess new data only when new data is sents

const parseRequestId = (requestId) => {
    let values = requestId.match("(.*)-(-.*)");
    return values;
};

const calcLag = (miliseconds) => {
    if(+miliseconds !== 0){
        lag = Date.now() - miliseconds;
    }
};

const proccessNewData = (currentData, newData, valuesToCheck) => {
    if(newData !== null && typeof newData !== "undefined" && newData.length !== 0){

        // Create an array of new and olds ids
        let curIdList = currentData.map(data => data.id),
        newIdList = newData.map(data => data.id);

        if(newIdList.length !== 0){
            let addedValues =  _.difference(newIdList, curIdList),
            deletedValues =  _.difference(curIdList, newIdList);
            
            // Remove values not present
            for(let i = 0; i < deletedValues.length; i ++){
                currentData.splice(curIdList.indexOf(deletedValues[i]), 1);
            }

            // Add values present
            for(let i = 0; i < addedValues.length; i++){
                currentData.push(newData.find(data => data.id === addedValues[i])); // jshint ignore:line
            }
        }

        // Change existing values
        for(let i = 0; i < newData.length; i++){

            if(typeof valuesToCheck === "undefined"){ // If no specific value should be proccessed, update the whole object
                if(typeof newData[i].requestId !== "undefined" && newData[i].requestId !== currentData[i].requestId ){
                    let newRequestId = +parseRequestId(newData[i].requestId)[1];
                    let curRequestId = +parseRequestId(currentData[i].requestId)[1];
                    // If the new values also have a newer timestamp
                    if((newRequestId >= curRequestId)) calcLag(newRequestId);

                        // If this is dealing withi local data, the local will always be newer than what is being pulled down.  The stuff being pulled down will only be newer if sent my someone else.                    // Some how subtract difference if own

                    if(!proccessedActions.includes(newData[i].requestId)){
                        if((newRequestId >= curRequestId)){ 
                            currentData[i] = Object.assign({}, newData[i]);
                            proccessedActions.push(newData[i].requestId);
                        }
                    }
                }
            } else { // If specific values should be proccesed, update only those values.
                for(let j = 0; j < valuesToCheck.length; j++){

                    if(typeof newData[i][valuesToCheck[j]] !== "undefined" && newData[i][valuesToCheck[j]].requestId !== currentData[i][valuesToCheck[j]].requestId ){ 

                        let newRequestId = +parseRequestId(newData[i][valuesToCheck[j]].requestId)[1];
                        let curRequestId = +parseRequestId(currentData[i][valuesToCheck[j]].requestId)[1];

                        if((newRequestId >= curRequestId)) calcLag(newRequestId);

                        if(!proccessedActions.includes(newData[i][valuesToCheck[j]].requestId)){
                            console.log('newRequestId >= curRequestId', newRequestId, curRequestId, newRequestId >= curRequestId);
                            if((newRequestId >= curRequestId)){ // If this game has not proccessed it and the value is not an old one
                                
                                proccessedActions.push(newData[i][valuesToCheck[j]].requestId);

                                currentData[i][valuesToCheck[j]] = Object.assign({}, newData[i][valuesToCheck[j]]);
                                
                                //TODO: Fix issue where older peice of data is replacing newer data.
                                // Is move being replaced by mine?  Didin't pick up a move.
                                // Is move replacing mine?  Only a move of same timestamp, not a mine.
                                // console.log('newRequestId, lag', newRequestId, lag);
                            }
                        }   
                    }
                }
            }
        }
    }
    // console.log('proccessedActions', proccessedActions);
    newData.length = 0;
};

const calcCurRequestId = () => `${Date.now()}-${g.playerId}`;

const dropGem = gem => {
    gem.carrier = -1;
    addRequestId(gem, calcCurRequestId());
    model.saveGem(gem);
};

const updateGemPosition = () => {
    for(let i = 0; i < gems.length; i++){
        if(gems[i].carrier !== -1){
            let carrier = players.find(player => player.id === gems[i].carrier); // jshint ignore:line
            console.log('carrier.health.points', carrier.health.points);
            if(g.isPlayerAlive(carrier)){
                gems[i].pos.x = carrier.pos.x;
                gems[i].pos.y = carrier.pos.y;
            } else {
                console.log('drop gem');
                gems[i].pos.x = carrier.pos.x;
                gems[i].pos.y = carrier.pos.y;
                dropGem(gems[i]);
            }
        }
    }
};


const update = (delta) => { // new delta parameter
    // boxPos += boxVelocity * delta; // velocity is now time-sensitive
    

    // console.log("gems", gems);
    
    updateGemPosition();
    /*
        Controls
    */


    if(typeof g.playerId !== "undefined"){

        let player = players.find(x => x.id == g.playerId);
        // TODO: Fix issue that when you die the game stops keeping up.
        if(!g.isPlayerAlive(player) && localPlayerStats.deathTime === 0){
            localPlayerStats.deathTime = Date.now();
        }
        
        if(typeof player !== "undefined" && g.isPlayerAlive(player)){

            let requestId = calcCurRequestId();

            let playerUpdateObject = {
                player: players[players.indexOf(player)],
                requestId,
                delta,
                speedMultiplier,
            };

            if(isKeyOn(" ")){
                // If there is an object in front of you
                let selectedTile = findTileInDirection(player);
                if(typeof selectedTile !== "undefined"){
                    // Check if player is near

                    let targetPlayer = null;

                    for(let i = 0; i < players.length; i++){
                        let otherPlayersTile = g.findTileBelowPlayer(players[i], tiles);

                        // The logic that you find a tile in a direction, which is one away, and you check the attack distance, is convoluted.  This is saying if they are within 1 of the square in front of you.

                        if(calcDistance(g.calcTilePos(selectedTile), g.calcTilePos(otherPlayersTile))/g.tileSize <= g.attackDistance && players[i].id !== player.id){
                            targetPlayer = players[i];
                            break;
                        }
                    }
                    
                    // If there is a player in the direction within 1, then attack.
                    
                    if(targetPlayer !== null && targetPlayer.id !== player.id && targetPlayer.team !== player.team && g.isPlayerAlive(targetPlayer)){
                        targetPlayer.health.points -= g.attackStrength;

                        localPlayerStats.damageDelt += g.attackStrength;

                        addRequestId(targetPlayer.health, requestId);
                        countDataSent++;

                        // console.log(targetPlayer.health);
                        model.savePlayerHealth(targetPlayer).then(data => {
                            countDataReturned ++;
                            calcLag(parseRequestId(data.health.requestId)[1]);
                        });

                    } else { // Else mine a block
                        if(selectedTile.hard.points !== -1 && selectedTile.hard.points !== -2 && selectedTile.hard.points >= 0){ // -1 is mined, -2 is unbreakable
                            selectedTile.hard.points -= g.mineStrength;
                            localPlayerStats.mined += g.mineStrength;
                            addRequestId(selectedTile.hard, `${requestId}mine`);
                            // Local request id has been changed from what is being downloaded event though the downloaded one is the same except for the request id, because the new requestId has not got there yet.

                            countDataSent++;
                            model.saveTileHard(selectedTile).then(data => {
                                countDataReturned ++;
                                calcLag(parseRequestId(data.hard.requestId)[1]);
                            });
                        }
                    }
                    
                }
                
            } else if(isKeyOn("s")){
                let selectedTile = g.findTileBelowPlayer(player, tiles);

                if(typeof selectedTile  !== "undefined"){
                    let gemOnTile = findCloseGem(player);
                    // console.log('gemOnTile', gemOnTile);
                    if(typeof gemOnTile !== "undefined" && gemOnTile.carrier === -1 && gemOnTile.team !== player.team){
                        gemOnTile.carrier = player.id;
                        addRequestId(gems[gems.indexOf(gemOnTile)], requestId);

                        countDataSent ++;
                        model.saveGem(gems[gems.indexOf(gemOnTile)]).then(data => {
                            countDataReturned ++;
                            calcLag(parseRequestId(data.requestId)[1]);
                        }); 
                    }
                } 
            
            } else if(isKeyOn("d")){
                // If there is an object in front of you
                let selectedTile = g.findTileBelowPlayer(player, tiles);
                
                // If there is a tile that it can be dropped on,
                if(typeof selectedTile !== "undefined"){

                    let gemOnTile = getGemOnTile(selectedTile);
                    
                    // if the gem is not on a tile
                    if(typeof gemOnTile === "undefined" ){

                         // If player has gem,
                        let carriedGem = gems.find(x => x.carrier === g.playerId);

                        if(typeof carriedGem !== "undefined"){

                            // Drop gems
                            carriedGem.carrier = -1;
                            
                            addRequestId(gems[gems.indexOf(carriedGem)], requestId);

                            if(selectedTile.teamBase === player.team){
                                setWinner(player.team);
                                model.deleteCurrentMap();
                            }
                            countDataSent ++;
                            model.saveGem(gems[gems.indexOf(carriedGem)]).then(data => {
                                countDataReturned++;
                                calcLag(parseRequestId(data.requestId)[1]);
                            }); 
                        }
                    }
                }      
            } 
            
            // Check if can move, if can't, still update position.
            if(isKeyOn("ArrowUp") && canMove("up", player, delta)){
                updatePlayerState("up", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowUp") && player.pos.dir !== "up"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("up", "y", playerUpdateObject);
            } else if (isKeyOn("ArrowDown") && canMove("down", player, delta)){

                updatePlayerState("down", "y", playerUpdateObject);

            } else if(isKeyOn("ArrowDown") && player.pos.dir !== "down"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("down", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowLeft") && canMove("left", player, delta)){
                updatePlayerState("left", "x", playerUpdateObject);

            } else if(isKeyOn("ArrowLeft") && player.pos.dir !== "left"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("left", "x", playerUpdateObject);
            } else if(isKeyOn("ArrowRight") && canMove("right", player, delta)){

                updatePlayerState("right", "x", playerUpdateObject);
            
            } else if(isKeyOn("ArrowRight") && player.pos.dir !== "right"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("right", "x", playerUpdateObject);
            } else {// If nothing is being pressed, tell the server that the player is not moving and use the animation direction as the direction to set the player.
                if(typeof playerUpdateObject.player.pos.isMoving === "undefined" || playerUpdateObject.player.pos.isMoving){
                    playerUpdateObject.player.pos.isMoving = false;
                    playerUpdateObject.speedMultiplier = 0;
                    updatePlayerState(playerUpdateObject.player.pos.animDir, "x", playerUpdateObject);
                }
            }
        }
    }
};

const addRequestId = (object, requestId) => {
    proccessedActions.push(requestId);
    object.requestId = requestId;
};

const updatePlayerState = (direction,  changeIn, options) => {

    if(options.speedMultiplier !== 0){
        options.player.pos.isMoving = true;
    } else {
        options.player.pos.isMoving = false;
    }

    if(direction === "left"){
        options.player.pos.animDir = "left";
    } else if(direction === "right"){
        options.player.pos.animDir = "right";
    }

    if(direction === "up" || direction === "left"){
        options.speedMultiplier = -options.speedMultiplier;
    }

    options.player.pos[changeIn] += options.speedMultiplier * options.delta;
    options.player.pos.dir = direction;

    addRequestId(options.player.pos, `${options.requestId}move`);

    countDataSent ++;

    model.savePlayerPos(options.player).then(data => {
        // console.log('data', data);
        countDataReturned ++;
        calcLag(parseRequestId(data.pos.requestId)[1]);
    });
};



const mainLoop = (timestamp) => {
    if (g.uid === ""){
        view.showSignIn();
    }  else if(initialLobbyLoad){//initialGameState || initialPlayerDraw){ // Loading Screen, While plyaers and game state aren't loaded
        view.showLoadingScreen();
    } else if (onlineGameState === 2 && localGameState === 1){ // Winner
        view.viewWinnerScreen(winner);
    } else if(localGameState === 1 && onlineGameState === 1){  // Game Playing
        view.viewGame();
        waitingForGame = false;

        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

        while (delta >= timestep) {

            // if(lag > 2000){
            //     if(newPlayers.length !== 0){
            //         players = newPlayers;
            //     }
            //     if(newTiles.length !== 0){
            //         tiles = newTiles;
            //     }
            //     if(newGems.length !== 0){
            //         gems = newGems;
            //     }
            //     lag = 0;
            // } else {
                if(proccessDataThisFrame){
                    proccessNewData(players, newPlayers, ["health", "pos"]);
                    proccessNewData(tiles, newTiles, ["hard"]);
                    proccessNewData(gems, newGems);
                    proccessDataThisFrame = false;
                }
            // }
            // if(countDataSent - countDataReturned < 50){
                update(timestep);
            // }

            delta -= timestep;
        }
        view.printDataCount(countDataReturned, countDataSent);

        view.draw(g.playerId, tiles, players, gems, lag);

    } else if (localGameState === 0){ // Menu
        view.viewMainMenu();

        if($(".add").length === 0){
            let playerIds = players.map(x => x.id);
            // console.log('playerIds', playerIds);
            // view.setPlayers(playerIds);
        } else {
            let playerIds = players.map(x => x.id);
            // console.log(players);
            // view.setPlayers(playerIds);
        }
        // else if($("#player-lobby .add").length !== newPlayers.length){
            // console.log('newPlayers', newPlayers);
          
        // }
    }  

    if(waitingForGame === true){  // Load screen
        view.showLoadingScreen();
    }
    requestAnimationFrame(mainLoop);
};

// Resets variables on whether or not the map has been drawn for the first time or not.
const resetMapDraw = () => {
    initialGemDraw = true;
    initialTileDraw = true;
};

module.exports.startGame = () => {
    activateServerListener();
    activateButtons();
    requestAnimationFrame(mainLoop);
};

const startPlay = () => {
    view.viewGame();
    initiateGameState();
    localGameState = 1;
};

// Returns a random battle  name using the inputs on game.js
const generateBattleName = () => {
    let randomType = g.battleTypes[Math.floor(Math.random()*g.battleTypes.length)];
    let randomName = g.battleNames[Math.floor(Math.random()*g.battleNames.length)];
    return `${randomType} ${randomName}`;
};

const activateButtons = () => {

    $("#signIn").on("click", function(){
        // Commented out for testing purpose.  Comment back in to test with multiple users.
            // login.googleSignin().then((data) => {
            //      console.log(data);
            //     g.uid = data.email;
            //     g.name = data.name;
            // });
        g.uid = "timaconner1@gmail.com";
        g.fullName = "Tim Conner";
        view.showSignIn();

        // Initialize firebase and start listening to the list of lobbys
        model.initFirebase().then(() => {
            model.listenToLobbys();
        });

    });
    document.getElementById("back-to-main-menu").addEventListener("click", () => {
        localGameState = 0;
    });



    // document.getElementById("main-menu-play").addEventListener("click", () => {
    //     startPlay();
    // });

    // Get and set gameId on model

   
    /* 
        If canvas is clicked on, find the tile being clicked, a
        and return its object from the tile array
        along with whether or not it is in the proccessedActions array.
     */
    $("canvas").on("click", function(e){
    
        let rect = g.c.getBoundingClientRect();
        let x = e.clientX - rect.left,
        y = e.clientY - rect.top;
        let tile = tiles.find(data => {
            let t = g.calcTilePos(data);
            return x > t.x && x < t.r && y > t.y && y < t.b;
        });
    
        console.log(tile);
        console.log("isTileInProccessedArray", (proccessedActions.indexOf(tile.hard.requestId) !== -1));
    });


    /* When new game button is clicked:
     add a new game, 
     populate it with initial data, 
     starts game listener,
     and set initial draws to true.
    */
    $("#main-menu-new").on("click", () => {
        model.addGame(Date.now(), generateBattleName()).then(gameId => {
            model.setGameId(gameId);

            // When game has finished being saved on server, start listening.
            gameMaker.newGame().then(() => {
                model.listenToGame();
            });

            resetMapDraw();
        });
        
    });
    
};



const activateServerListener = () => {
    
    g.c.addEventListener("serverUpdateGems", (e) => {
        let filteredGems = _.compact(e.detail);
        if(initialGemDraw === true){
            // console.log(gems);
            gems = filteredGems;
            initialGemDraw = false;
        } else {
            console.log("new data");
            newGems = filteredGems;
        }        
        proccessDataThisFrame = true;
    });

    g.c.addEventListener("serverUpdateGames", (e) => {
        games = e.detail;
        initialLobbyLoad = false;
        proccessDataThisFrame = true;
    });

    g.c.addEventListener("serverUpdatePlayer", (e) => {
        // console.log("listened");
        // console.log('e.detail', e.detail);
        if(e.detail !== null){
            
        // Filter the results, because firebase will return empty values if there are gaps in the array.
        let filteredPlayers = Object.keys(e.detail).map(key => {
            let player = e.detail[key];
            player.id = key;
            return player;
        }); 

          
            if(initialPlayerDraw === true || localGameState === 0){
                players = filteredPlayers;
            } else {
                console.log("new data");
                newPlayers = filteredPlayers;
            }
        }
        

        initialPlayerDraw = false;
        proccessDataThisFrame = true;

        // Update list of players
        
        // console.log('players', newPlayers);
        // console.log('tiles', newTiles);

    });
    g.c.addEventListener("serverUpdateTiles", (e) => {
        // console.log("tile", e.detail);

        let filteredTiles = _.compact(e.detail);

        for(let i = 0; i < filteredTiles.length; i++){
            filteredTiles[i].id = i;
        }

        if(initialTileDraw === true){
            tiles = filteredTiles;
            initialTileDraw = false;
        } else {
            console.log("new data");
            newTiles = filteredTiles;
        }

        proccessDataThisFrame = true;

    });

    g.c.addEventListener("serverUpdateGameState", (e) => {
        // console.log("loaded");
        
        console.log("new data");
        initialGameState = false;
        onlineGameState = e.detail.gameState; 
        winner = e.detail.winningTeam;
        
        // If the game has been won by a player online, 
        // then send states and finish the game locally.
        if(onlineGameState === 2 && statsSent === false){
            statsSent = true;
            model.savePlayerStats(localPlayerStats);
            model.finishGame(Date.now());
        }
        proccessDataThisFrame = true;
    });

};


// Prevent key defaults
window.addEventListener("keydown", function(e) {
    if(Object.keys(keys).indexOf(e.key) > -1) {
        e.preventDefault();
    }
}, false);

// When a key is pressed, set it to true.
window.onkeydown = function(event) {
    // console.log(event.key);
    for(let prop in keys){
        if(prop == event.key){
        // console.log("event.keycode", event.keycode);
            keys[prop] = true;
        }
    }
};

// When a key is up, set it to false.
window.onkeyup = function(event) {
    for(let prop in keys){
        if(prop == event.key){
            // console.log("event.keycode", event.keycode);
            keys[prop] = false;
        }
    }
};