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

const isDefined = obj => typeof obj !== "undefined";

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
        return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
    };

    const filterPlayers = (players, compareFunc) =>
        Object.keys(players).filter(x => compareFunc(players[x].uid, g.uid)).map(x => players[x]);

    $("#game-canvas").on("serverUpdatePlayer", ({detail: players}) => {
        // Force Angular to digest new players to update the html
        _.defer(function(){ 
            $scope.$apply(function(){
                if(players !== null){
                    $scope.ownedPlayers = filterPlayers(players, (playerOwner, thisPlayer) => playerOwner == thisPlayer);
                    $scope.otherPlayers = filterPlayers(players, (playerOwner, thisPlayer) => playerOwner != thisPlayer);
                } else {
                    $scope.otherPlayers = [];
                    $scope.ownedPlayers = [];
                }
            });
        });
    });

    $("#game-canvas").on("serverUpdateGames", ({detail: lobbies}) => {
        // Force Angular to digest new lobbies to update the html
        _.defer(function(){ 
            $scope.$apply(function(){
                if(lobbies !== null){ 
                    // Add firebase key to lobbys
                    let lobbyDetails = Object.keys(lobbies).map(lobbyKey => {

                        let lobby = lobbies[lobbyKey];
                        lobby.key = lobbyKey;

                        //Add game length to lobby information
                        if(isDefined(lobby.gameEnd)){
                            lobby.gameLength = convertMiliToHMS(+lobby.gameEnd - +lobby.gameStart);
                        }

                        // Add game date
                        lobby.date = convertMiliToDate(lobby.gameStart);

                        // For each player, add a life time.
                        if(isDefined(lobby.players)) {
                            Object.values(lobby.players).forEach(player => {
                                // If the player died, calculate lifetime from spawn to death, else from spawn to end of game.
                                player.lifeTime = 
                                    player.deathTime === 0 
                                        ? convertMiliToHMS(lobby.gameEnd - player.spawnTime) 
                                        : convertMiliToHMS(player.deathTime - player.spawnTime);
                            });
                        }

                        return lobby;
                    });

                    // Reverse order of lobbies to have newer first.
                    $scope.lobbyList = _.reverse(lobbyDetails);
                }
            });
        });
    });

    $scope.selectGame = id => {
        resetGameState();
        model.detachGameListeners(); // Detach previous game listeners
        model.setGameId(id);
        model.listenToCurGame();// Listen to new game data
    };

    $scope.deleteGame = id => {
        model.deleteLobby(id);
        model.deleteMap(id);
        // If you are in the lobby that you are deleting, detach game listeners.
        if(model.getGameId() === id){
            model.detachGameListeners();
            model.setGameId("");
        }
    };


    // Select the player to be played
    // and puts its values into the localPlayerStats to be later sent when game is complete.

    // TODO: Make sure that localPlayerStats are being sent to the database properly.
    $scope.selectPlayer = id => {
        g.playerId = id;      
        let player = players.find(x => x.id === g.playerId);
        if(isDefined(player)){
            localPlayerStats.uid = g.uid;
            localPlayerStats.id = g.playerId;
            localPlayerStats.spawnTime = Date.now();
            localPlayerStats.team = player.team;       
        }
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

    $scope.isFinished = gameEnd => isDefined(gameEnd) ? true : false;

    $scope.isObjectEmpty = obj => !isDefined(obj) || Object.keys(obj).length === 0;

    // Add a lobby and map to the lobby and listen to that game once it is done.
    $scope.addGame = () =>  {
        model.addLobby(Date.now(), generateBattleName())
        .then(gameId => {
            resetGameState();
            model.setGameId(gameId);
            gameMaker.addGame()
            .then(() => {
                model.listenToCurGame();
            });
        });
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

const findTileInPlayerDir = ({pos: playerPos, pos: {dir: playerDirection}}) => {

    // Calculate middle of tile that player is standing on to be used as point of reference
    let playerTile = {
        x: Math.floor((playerPos.x+g.playerSize/2) / g.tileSize),
        y: Math.floor((playerPos.y+g.playerSize/2) / g.tileSize)
    };
        
    // Define offset associated with each directin the player may be facing
    const directionOffsets = {
        up: () => playerTile.y -= 1,
        down: () => playerTile.y += 1,
        left: () => playerTile.x -= 1,
        right: () => playerTile.x += 1
    };
    // Select  the tile in the direction that the player is facaing.
    directionOffsets[playerDirection]();

    // Return where tile x and y match the calculated tile using player tile and direction offset
    return tiles.find(({pos: {x, y}}) => x === playerTile.x && y === playerTile.y);
};

// Returns true if a key is being pressed down
const isKeyOn = key => keys[key];


const findClosestGem = player => gems.find(gem => g.calcDistance(player.pos, gem.pos) <= g.gemPickupDistance);

// Returns true if one part of smaller is on or within the border of the larger
const isPositionWithinBounds = (smaller, larger) => 
    smaller.x >= larger.x 
    && smaller.x <= larger.r 
    && smaller.y >= larger.y 
    && smaller.y <= larger.b;

// Returns the gem touching or on a specific tile that is not picked up
const getGemOnTile = tile => 
    gems.find(gem => gem.carrier === -1 && isPositionWithinBounds(gem.pos, g.calcTilePos(tile)));

// Sets game state to playing and no winner and tells controller that the game is loading
const initiateGameState = () => {
    waitingForGame = true;
    model.saveGameState({
        gameState: 1,
        winningTeam: 0
    });    
};

// Sets gamestate to winning
const setWinnerGameState = teamId => { 
    model.saveGameState({
        gameState: 2,
        winningTeam: teamId
    });
};

//Returns  an array of matches on the requesst id
const parseRequestId = requestId => requestId.match("(.*)-(-.*)");

// Calculates lag and sets lag variable that is used by view
const calcLag = miliseconds => {
    if(+miliseconds !== 0) lag = Date.now() - +miliseconds;
};

// Merges currentData and newData where there are differences not caused by local player.
const proccessData = (currentData, newData, valuesToCheck) => {
    if(newData !== null && isDefined(newData) && newData.length !== 0){

        // Create an array of new and olds ids
        let curIdList = currentData.map(({id}) => id),
        newIdList = newData.map(({id}) => id);

        // Add or remove values not present
        if(newIdList.length !== 0){
            // Find differences between new and old data
            let valuesToAdd =  _.difference(newIdList, curIdList),
            valuesToDelete =  _.difference(curIdList, newIdList);
            
            // Remove values not present
            for(let i = 0; i < valuesToDelete.length; i ++){
                _.remove(currentData, val => val === valuesToDelete[i]);
            }

            // Add values present
            for(let i = 0; i < valuesToAdd.length; i++){
                currentData.push(newData.find(({id}) => id === valuesToAdd[i])); // jshint ignore:line
            }
        }

        // Change existing values
        for(let i = 0; i < newData.length; i++){

            // If no specific value should be proccessed, update the whole object
            if(!isDefined(valuesToCheck)){ 
                if(isDefined(newData[i].requestId) && newData[i].requestId !== currentData[i].requestId ){
                    let newRequestId = +parseRequestId(newData[i].requestId)[1];
                    let curRequestId = +parseRequestId(currentData[i].requestId)[1];
                    
                    if(newRequestId >= curRequestId) calcLag(newRequestId);

                    // If data has not been proccessed
                    if(!proccessedActions.includes(newData[i].requestId)){
                        if((newRequestId >= curRequestId)){ 
                            // Copy the whole object into the current data
                            currentData[i] = Object.assign({}, newData[i]);
                            proccessedActions.push(newData[i].requestId);
                        }
                    }
                }
            }

            // If specific values should be proccesed, update only those values. 
            else { 
                for(let j = 0; j < valuesToCheck.length; j++){
                    if(isDefined(newData[i][valuesToCheck[j]]) && newData[i][valuesToCheck[j]].requestId !== currentData[i][valuesToCheck[j]].requestId){ 

                        let newRequestId = +parseRequestId(newData[i][valuesToCheck[j]].requestId)[1];
                        let curRequestId = +parseRequestId(currentData[i][valuesToCheck[j]].requestId)[1];

                        if((newRequestId >= curRequestId)) calcLag(newRequestId);

                        if(!proccessedActions.includes(newData[i][valuesToCheck[j]].requestId)){
                            // If this game has not proccessed it and the value is not an old one,
                            // Copy the proccessed peice of data into the current data.
                            if(newRequestId >= curRequestId){ 
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
    
    // Delete new data because it has already been proccessed into the current data
    newData.length = 0;
};

const calcCurRequestId = () => `${Date.now()}-${g.playerId}`;

const dropGem = gem => {
    gem.carrier = -1;
    addRequestId(gem, calcCurRequestId());
    model.saveGem(gem);
};

// Updates the positoin of the gems if they are on a player
const updateGemPosition = () => {
    for(let i = 0; i < gems.length; i++){
        // If the gem is being carried
        if(gems[i].carrier !== -1){
            // Update the positoin based on the player's position
            // If the player is dead, drop the gem.
            let carrier = players.find(player => player.id === gems[i].carrier); // jshint ignore:line
            if(g.isPlayerAlive(carrier)) gems[i].pos = Object.assign({}, carrier.pos);                
            else dropGem(gems[i]);
        }
    }
};


const update = delta => {
    // boxPos += boxVelocity * delta; // velocity is now time-sensitive
    
    updateGemPosition();

    /*
        Controls
    */

    if(isDefined(g.playerId)){

        let player = players.find(player => player.id == g.playerId);
        
        // If the player is dead and deathtime is not set yet
        if(!g.isPlayerAlive(player) && localPlayerStats.deathTime === 0) 
            localPlayerStats.deathTime = Date.now();
        
        if(isDefined(player) && g.isPlayerAlive(player)){

            let requestId = calcCurRequestId();

            let playerUpdateObject = {
                player,
                requestId,
                delta,
                speedMultiplier,
            };

            if(isKeyOn(" ")){
                let selectedTile = findTileInPlayerDir(player);

                if(isDefined(selectedTile)){
                    let targetPlayer = null;

                    for(let i = 0; i < players.length; i++){
                        let otherPlayersTile = g.findTileBelowPlayer(players[i], tiles);

                        // The logic that you find a tile in a direction, which is one away, and you check the attack distance, is convoluted.  This is saying if they are within 1 of the square in front of you.

                        // TODO: Refactor to select the nearest object

                        let objectDistance = g.calcDistance(g.calcTilePos(selectedTile), g.calcTilePos(otherPlayersTile))/g.tileSize;
                        if(objectDistance <= g.attackDistance && players[i].id !== player.id){
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

                        model.savePlayerHealth(targetPlayer).then(data => {
                            countDataReturned ++;
                            calcLag(parseRequestId(data.health.requestId)[1]);
                        });

                    } 
                    // If there is not a player, then mine a block.
                    else {
                        //  If the tile has not been mined
                        if(selectedTile.hard.points >= 0){ 
                            selectedTile.hard.points -= g.mineStrength;
                            localPlayerStats.mined += g.mineStrength;

                            addRequestId(selectedTile.hard, `${requestId}mine`);
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
                if(isDefined(selectedTile)){
                    let gemOnTile = findClosestGem(player);
                    // console.log('gemOnTile', gemOnTile);
                    if(isDefined(gemOnTile) && gemOnTile.carrier === -1 && gemOnTile.team !== player.team){
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
                if(isDefined(selectedTile)){

                    let gemOnTile = getGemOnTile(selectedTile);

                    // if the gem is not on a tile
                    if(!isDefined(gemOnTile)){
                         // If player has gem,
                        let carriedGem = gems.find(x => x.carrier === g.playerId);

                        if(isDefined(carriedGem)){

                            // Drop gems
                            carriedGem.carrier = -1;
                            
                            addRequestId(gems[gems.indexOf(carriedGem)], requestId);

                            if(selectedTile.teamBase === player.team){
                                setWinnerGameState(player.team);
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
            
            // Check if can move, if can move in direction, move, if can't update direction.
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
            }
        }
    }
};

// Adds a request id to the object supplied to it.
const addRequestId = (object, requestId) => {
    proccessedActions.push(requestId);
    object.requestId = requestId;
};

const updatePlayerState = (direction,  changeIn, {player: {pos}, speedMultiplier, delta, requestId, player}) => {

    // If there is movment, set the moving to true.
    pos.isMoving = speedMultiplier !== 0 ? true : false;

    // Set animation direction
    if (direction === "left") pos.animDir = "left";
    else if (direction === "right") pos.animDir = "right";

    // Invert speed multiplier if moving up or left
    if (direction === "up" || direction === "left") speedMultiplier = -speedMultiplier;

    // Move character and set direction
    pos[changeIn] += speedMultiplier * delta;
    pos.dir = direction;

    addRequestId(pos, `${requestId}move`);
    countDataSent ++;

    model.savePlayerPos(player).then(({pos: {requestId}}) => {
        countDataReturned ++;
        calcLag(parseRequestId(requestId)[1]);
    });
};



const mainLoop = (timestamp) => {
    if (g.uid === ""){
        view.showSignIn();
    } else if(initialLobbyLoad){// Loading screen
        view.showLoadingScreen();
    } else if (onlineGameState === 2 && localGameState === 1){ // Winner
        view.viewWinnerScreen(winner);
    } else if(localGameState === 1 && onlineGameState === 1){  // Game Playing
        view.viewGame();
        waitingForGame = false;

        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

        while (delta >= timestep) {
            if(proccessDataThisFrame){
                proccessData(players, newPlayers, ["health", "pos"]);
                proccessData(tiles, newTiles, ["hard"]);
                proccessData(gems, newGems);
                proccessDataThisFrame = false;
            }
            update(timestep);
            delta -= timestep;
        }
        view.printDataCount(countDataReturned, countDataSent);
        view.draw(g.playerId, tiles, players, gems, lag);
    } else if (localGameState === 0){ // Menu
        view.viewMainMenu();
    }  

    if(waitingForGame === true){  // Load screen
        view.showLoadingScreen();
    }
    
    requestAnimationFrame(mainLoop);
};

// Resets variables on whether or not the map has been drawn for the first time or not.
const resetGameState = () => {
    initialTileDraw = true;
    initialPlayerDraw = true;
    initialGemDraw = true;
    initialGameState = true;
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