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

let app = angular.module("menuApp", []);

// 0 menu, 1 game, 2 winner

let onlineGameState = 0,
localGameState = 0,
waitingForGame = false;

let winnerTeamId = 0;

let players = [],
tiles = [],
gems = [],
games = [];

let proccessedActions = [],
completedActions = [];

let newPlayers = [],
newTiles = [],
newGems = [];

let speedMultiplier = 0.1;

let localPlayerStats =  {  
    id: 0,
    uid: "",
    damageDelt: 0,
    mined: 0,
    team: 0,
    spawnTime: 0,
    deathTime: 0
},
statsSent = false;


let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false, 
    ArrowDown: false,
    " ": false,
    d: false,
    s: false
};


let initialLobbyLoad = true,
initialTileDraw = true,
initialPlayerDraw = true,
initialGemDraw = true,
initialGameState = true;

let shouldMergeDataThisFrame = false;

let timestep = 1000 / 60,
delta = 0,
lastFrameTimeMs = 0;

let lag = 0; // Time between current timestamp and new peices of data timestamp.
let countDataReturned = 0, // Count of data returned after sending information.
countDataSent = 0, // Count of data sent to  firebase.
totalDataRecieved = 0, // Total data recieved from anywhere
countDataDropped = 0; // Any data that XHR failed

let sentDataRecieved = [];
let allDataRecieved = [];
let allDataRecievedA = [];
let allDataRecievedB = [];
let allDataMerged = [];

let currentDataSending = {};
let dataToSend = [];

const isDefined = obj => typeof obj !== "undefined" && obj !== null;

const toTwoDigits = number => (Math.round(number * 100) / 100);

const isCarryingGem = ({id}) => gems.find(({carrier}) => carrier === id);

// Returns true if one part of smaller is on or within the border of the larger
const isPositionWithinBounds = (smaller, larger) => 
smaller.x >= larger.x 
&& smaller.x <= larger.r 
&& smaller.y >= larger.y 
&& smaller.y <= larger.b;

const willHitOnLeft = (xPos, obj) => ((xPos > obj.x) && (xPos < obj.r));
const willHitOnRight = (rPos, obj) => ((rPos > obj.x) && (rPos < obj.r));
const willHitOnTop = (yPos, obj) => ((yPos > obj.y) && (yPos < obj.b));
const willHitOnBottom = (bPos, obj) => ((bPos > obj.y) && (bPos < obj.b));

const isWithinYAxis = (player, obj) => willHitOnTop(player.y, obj) || willHitOnBottom(player.b, obj);
const isWithinXAxis = (player, obj) =>  willHitOnLeft(player.x, obj) || willHitOnRight(player.r, obj);

const canPlayerMove = (direction, delta) => {
    let player = players.find(({id}) => id === g.playerId);
    let playerPos = g.calcObjBounds(player, g.playerSize, true);
    let increment = isCarryingGem(player) ? speedMultiplier*g.playerWithGemSpeed*delta : speedMultiplier*g.playerSpeed*delta;

    for(let tile of tiles){
        let tilePos = g.calcObjBounds(tile, g.tileSize);
        // Can't move through objects that are still tough or if -2 (unbrekable)
        if(tile.tough.points > 0 || tile.tough.points === -2){ 
            /* 
            Functions in isObjectInDirection check if on x or y axis of object, 
            and if the next movement in that direction will run into the object
            */
            const isObjectInDirection = {
              left: () => isWithinYAxis(playerPos, tilePos) && willHitOnLeft(playerPos.x-increment, tilePos),
              right: () => isWithinYAxis(playerPos, tilePos) && willHitOnRight(playerPos.r+increment, tilePos),
              up: () => isWithinXAxis(playerPos, tilePos) && willHitOnTop(playerPos.y-increment, tilePos),
              down: () => isWithinXAxis(playerPos, tilePos) && willHitOnBottom(playerPos.b+increment, tilePos)
            };

            if(isObjectInDirection[direction]()) return false;
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


// Returns the gem touching or on a specific tile that is not picked up
const getGemOnTile = tile => 
    gems.find(gem => gem.carrier === -1 && isPositionWithinBounds(gem.pos, g.calcObjBounds(tile, g.tileSize)));

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
const parseRequestId = requestId => requestId.match("(.*)-(-.*)")[1];

// Calculates lag and sets lag variable that is used by view
const calcLag = miliseconds => {
    if(+miliseconds !== 0) lag = Date.now() - +miliseconds;
};

const resendDroppedToughnessData = tile => {
    let sentData = sentDataRecieved.filter(({id}) => id === tile.id);

    // // Remove duplicate
    // for(let tileA in sentData){
    //     for(let tileB in sentData){
    //         if(tileA.id !== tileB.id && tileA.pos === tileB.pos){
    //             _.remove(sentData, ({id}) => id === tileB.id);
    //         }
    //     }
    // }


    // for(let i = 0; i < sentData.length; i++){
        if(sentData.length > 1){
            let maxIndex = sentData.length-1;
            let secondFromMaxIndex = sentData.length-2;
            if(sentData[maxIndex].tough.points > sentData[secondFromMaxIndex].tough.points){
                addRequestId(sentData[secondFromMaxIndex].tough, calcCurRequestId());
                console.log('sentData[maxIndex].tough.points ', sentData[maxIndex].tough.points );
                console.log('sentData[secondFromMaxIndex].tough.points', sentData[secondFromMaxIndex].tough.points);
                countDataSent++;

                model.saveTileTough(sentData[secondFromMaxIndex])
                .then(data => {
                    console.log('successful data resend', data);
                    sentDataRecieved.push(Object.assign({}, data));
                    sentDataRecieved.length = 0;
                    countDataReturned ++;
                    calcLag(parseRequestId(data.tough.requestId));
                })
                .catch(data => {
                    console.log('not sent');
                    countDataDropped++;
                });
            }
        }
    // }
};

const updateCurrentDataSending = () => {
    if(dataToSend.length !== 0){
    let distinctIds = [];
    // console.log('dataToSend', [...dataToSend]);
    
    // Create distinct list of tile ids
    for(let data of dataToSend){
        if(!distinctIds.includes(data.obj.id)){
            distinctIds.push(data.obj.id);
        }
    }
    
    for(let id of distinctIds){
        let objectData = dataToSend.filter(data => data.obj.id === id);
        if(!isDefined(currentDataSending[id]) && objectData.length !== 0){
            countDataSent++;

            let mostRecentObjData = objectData[objectData.length-1];

            currentDataSending[id] = mostRecentObjData.func(mostRecentObjData.obj)
            .then(obj => {
                console.log('sent currentDataSending[id]', obj.id,  obj[mostRecentObjData.stat].points);    
                countDataReturned ++;

                calcLag(parseRequestId(obj[mostRecentObjData.stat].requestId));
                dataToSend = dataToSend.filter(x => {
                    if(x.obj.id !== obj.id || (x.obj.id === obj.id && +parseRequestId(x.obj[mostRecentObjData.stat].requestId) > +parseRequestId(obj[mostRecentObjData.stat].requestId))){
                        return x;
                    }
                });
                
                // console.log('dataToSend', [...dataToSend]);
                currentDataSending[id] = undefined;
                })
                .catch(err => console.log("updateCurrentDataSending Error",  err));
            }
        }
    }
};

// Merges currentData and newData where there are differences not caused by local player.
const mergeData = (currentData, newData, valuesToCheck) => {
    if(newData !== null && isDefined(newData) && newData.length !== 0){

        // Create an array of new and olds ids
        let curIdList = currentData.map(({id}) => id),
        newIdList = newData.map(({id}) => id);

        // Add or remove values not present
        if(newIdList.length !== 0){
            // Find differences between new and old data
            let valuesToAdd =  _.difference(newIdList, curIdList),
            valuesToDelete =  _.difference(curIdList, newIdList);
            
            // Remove values not present in new data
            for(let toDelete of valuesToDelete){
                _.remove(currentData, val => val === toDelete);
            }

            // Add values present in new data
            for(let toAdd of valuesToAdd){
                currentData.push(newData.find(({id}) => id === toAdd));
            }
        }

        // Change existing values
        for(let newPiece of newData){
            newPiece.debug = 1;
            // If no specific value should be proccessed, update the whole object
            if(!isDefined(valuesToCheck)){
                let curPiece = currentData.find(({id}) => id === newPiece.id);
                
                if(isDefined(newPiece.requestId) ){
                    if(newPiece.requestId !== curPiece.requestId){
                        let newRequestId = +parseRequestId(newPiece.requestId);
                        let curRequestId = +parseRequestId(curPiece.requestId);
                        
                        if(newRequestId >= curRequestId) calcLag(newRequestId);

                        // If newPiece has not been proccessed
                        if(!proccessedActions.includes(newPiece.requestId)){
                            if((newRequestId >= curRequestId)){ 
                                // Copy the whole object into the current newPiece

                                currentData[currentData.indexOf(curPiece)] = Object.assign({}, newPiece);

                                proccessedActions.push(newPiece.requestId);
                            }
                        }
                    }
                }
            }
            // If specific values should be proccesed, update only those values. 
            else { 
                for(let value of valuesToCheck){
                    newPiece.debug = 2;
                    // if(value == "tough" && newPiece[value] == "0.000"){
                    //     console.log('newPiece[value]', newPiece[value]);
                    // }
                    // if(value === "tough"){
                    //     allDataRecieved.push(Object.assign({}, newPiece));
                    // }
                    let curPiece = currentData.find(({id}) => id === newPiece.id);
                    if(isDefined(newPiece[value]) && newPiece[value].requestId !== curPiece[value].requestId){ 
                        // if(value === "tough"){
                            newPiece.debug = 3;
                        //     allDataRecievedA.push(Object.assign({}, newPiece));
                        // }
                        let newRequestId = +parseRequestId(newPiece[value].requestId);
                        let curRequestId = +parseRequestId(curPiece[value].requestId);

                        if((newRequestId >= curRequestId)) calcLag(newRequestId);

                        if(!proccessedActions.includes(newPiece[value].requestId)){
                            newPiece.debug = 4;
                            // if(value === "tough"){
                            //     allDataRecievedB.push(Object.assign({}, newPiece));
                            // }
                            // If this game has not proccessed it and the value is not an old one,
                            // Copy the proccessed piece of data into the current data.
                            // if(newRequestId < curRequestId){
                            //     console.log('curPiece', curPiece);
                            // }
                            console.log('A curPiece[value]', curPiece[value]);
                            if(newRequestId >= curRequestId){ 
                                // if(value === "tough"){
                                    newPiece.debug = 5;
                                //     allDataMerged.push(Object.assign({}, newPiece));
                                // }
                                proccessedActions.push(newPiece[value].requestId);
                                curPiece[value] = Object.assign({}, newPiece[value]);
                                console.log('update curPiece[value]', curPiece[value]);

                                //TODO: Fix issue where older piece of data is replacing newer data.
                                // Is move being replaced by mine?  Didin't pick up a move.
                                // Is move replacing mine?  Only a move of same timestamp, not a mine.
                                // console.log('newRequestId, lag', newRequestId, lag);
                            }
                        } else {
                            newPiece.debugComments = [...proccessedActions];
                            newPiece.debugInfo = newPiece[value].requestId;
                            newPiece.debugBool = !proccessedActions.includes(newPiece[value].requestId);
                            newPiece.indexOf = proccessedActions.indexOf(newPiece[value].requestId);
                        }
                    }
                }
            }
        }
    }
    console.log('newData', [...newData]);
    // Delete new data because it has already been proccessed into the current data
    newData.length = 0;
};

// playerId is not being set correctly??
const calcCurRequestId = () => `${Date.now()}-${g.playerId}`;

const dropGem = gem => {
    gem.carrier = -1;
    addRequestId(gem, calcCurRequestId());
    model.saveGem(gem);
};

// Updates the positoin of the gems if they are on a player
const updateGemPosition = () => {
    for(let gem of gems){
        // If the gem is being carried
        if(gem.carrier !== -1){
            // Update the positoin based on the player's position
            let carrier = players.find(player => player.id === gem.carrier); // jshint ignore:line
            if(isDefined(carrier) && g.isPlayerAlive(carrier)){
                gem.pos.x = carrier.pos.x;
                gem.pos.y = carrier.pos.y;
            }              
            // If the player is dead, drop the gem.
            else dropGem(gem);
        }
    }
};

const checkInput = delta => {
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
                console.log('g.playerId', g.playerId);
                let selectedTile = findTileInPlayerDir(player);

                if(isDefined(selectedTile)){
                    let targetPlayer = null;

                    for(let aPlayer of players){
                        let otherPlayersTile = g.findTileBelowPlayer(aPlayer, tiles);

                        // The logic that you find a tile in a direction, which is one away, and you check the attack distance, is convoluted.  This is saying if they are within 1 of the square in front of you.

                        // TODO: Refactor to select the nearest object

                        let objectDistance = g.calcDistance(g.calcObjBounds(selectedTile, g.tileSize), g.calcObjBounds(otherPlayersTile, g.tileSize))/g.tileSize;
                        if(objectDistance <= g.attackDistance && aPlayer.id !== player.id){
                            targetPlayer = aPlayer;
                            break;
                        }
                    }
                    
                    // If there is a player in the direction within 1, then attack.
                    if(targetPlayer !== null && targetPlayer.id !== player.id && targetPlayer.team !== player.team && g.isPlayerAlive(targetPlayer)){
                        targetPlayer.health.points -= g.attackStrength;
                        targetPlayer.health.points = (targetPlayer.health.points).toFixed(3);
                        localPlayerStats.damageDelt += g.attackStrength;

                        addRequestId(targetPlayer.health, `${requestId}atk`);
                        countDataSent++;

                        model.savePlayerHealth(targetPlayer).then(data => {
                            countDataReturned ++;
                            calcLag(parseRequestId(data.health.requestId));
                        });

                    } 
                    // If there is not a player, then mine a block.
                    else {
                        //  If the tile has not been mined
                        if(selectedTile.tough.points >= g.mineStrength){ 
                            selectedTile.tough.points -= g.mineStrength;
                            selectedTile.tough.points = (selectedTile.tough.points).toFixed(3);
                            

                            // Rounding it does not fix it.  Meaning???  The data is not being proccessed or not being  sent?

                            // THe player destroying it, it says 0.00 toughness
                            // Local request id "1519341127625--L5zmNAkv0Su9EDrlKFwmine"

                            
                            // The server and other players have 0.04 toughness
                            // Server request id "1519341127616--L5zmNAkv0Su9EDrlKFwmine"
                            
                            // Meaning local request id was saved but the id never got to the server. 

                            // Could it be the send order? B is arriving before A, and then A arrives, setting it to 0.

                            localPlayerStats.mined += g.mineStrength;

                            addRequestId(selectedTile.tough, `${requestId}mine`);

                           

                            // if(isDefined(dataToSend[selectedTile.id])){
                            //     dataToSend[selectedTile.id].push(Object.assign({}, selectedTile));
                            //     console.log('dataToSend', [...dataToSend]);
                            //     console.log('dataToSend[selectedTile.id]', dataToSend[selectedTile.id]);
                            //     console.log('a');
                            // } else {
                            //     dataToSend[selectedTile.id] = [];
                                dataToSend.push(Object.assign({}, {
                                    obj: selectedTile,
                                    stat: "tough",
                                    func: model.saveTileTough
                                }));
                            //     console.log('dataToSend[selectedTile.id]', dataToSend[selectedTile.id]);
                            //     console.log('dataToSend', [...dataToSend]);
                            //     console.log('b');
                            // }

                            
                            // model.saveTileTough(selectedTile)
                            // .then(data => {
                            //     sentDataRecieved.push(Object.assign({}, data));
                            //     // resendDroppedToughnessData(selectedTile);
                            //     countDataReturned ++;
                            //     calcLag(parseRequestId(data.tough.requestId));
                            // })
                            // .catch(data => {
                            //     console.log('not sent');
                            //     countDataDropped++;
                            // });
                        }
                    }
                    
                }
                
            } else if(isKeyOn("s")){
                let selectedTile = g.findTileBelowPlayer(player, tiles);
                if(isDefined(selectedTile)){
                    let gemOnTile = findClosestGem(player);
                    if(isDefined(gemOnTile) && gemOnTile.carrier === -1 && gemOnTile.team !== player.team){
                        gemOnTile.carrier = player.id;
                        addRequestId(gemOnTile, `${requestId}gem`);
                        countDataSent ++;
                        model.saveGem(gemOnTile).then(data => {
                            countDataReturned ++;
                            calcLag(parseRequestId(data.requestId));
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
                            
                            addRequestId(carriedGem, `${requestId}win`);

                            if(selectedTile.teamBase === player.team){
                                setWinnerGameState(player.team);
                                model.deleteCurrentMap();
                            }
                            countDataSent ++;
                            model.saveGem(carriedGem).then(data => {
                                countDataReturned++;
                                calcLag(parseRequestId(data.requestId));
                            }); 
                        }
                    }
                }      
            } 
            
            // Check if can move, if can move in direction, move, if can't update direction.
            if(isKeyOn("ArrowUp") && canPlayerMove("up", delta)){
                updatePlayerState("up", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowUp") && player.pos.dir !== "up"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("up", "y", playerUpdateObject);
            } else if (isKeyOn("ArrowDown") && canPlayerMove("down", delta)){

                updatePlayerState("down", "y", playerUpdateObject);

            } else if(isKeyOn("ArrowDown") && player.pos.dir !== "down"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("down", "y", playerUpdateObject);
            } else if(isKeyOn("ArrowLeft") && canPlayerMove("left", delta)){
                updatePlayerState("left", "x", playerUpdateObject);

            } else if(isKeyOn("ArrowLeft") && player.pos.dir !== "left"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("left", "x", playerUpdateObject);
            } else if(isKeyOn("ArrowRight") && canPlayerMove("right", delta)){

                updatePlayerState("right", "x", playerUpdateObject);
            
            } else if(isKeyOn("ArrowRight") && player.pos.dir !== "right"){
                playerUpdateObject.speedMultiplier = 0;
                updatePlayerState("right", "x", playerUpdateObject);
            } else {// If nothing is being pressed, tell the server that the player is not moving and use the animation direction as the direction to set the player.
                if(!isDefined(playerUpdateObject.player.pos.isMoving) || playerUpdateObject.player.pos.isMoving){
                    playerUpdateObject.player.pos.isMoving = false;
                    playerUpdateObject.speedMultiplier = 0;
                    updatePlayerState(playerUpdateObject.player.pos.animDirHorizontal, "x", playerUpdateObject);
                }
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
    if (direction === "left") {
        pos.animDirHorizontal = "left";
        pos.animDirVertical = "none";
    }
    else if (direction === "right"){
        pos.animDirHorizontal = "right";
        pos.animDirVertical = "none";
    } 
    else if (direction === "up"){
        pos.animDirVertical = "up";
    }
    else if (direction === "down"){
        pos.animDirVertical = "down";
    }

    // Invert speed multiplier if moving up or left
    if (direction === "up" || direction === "left"){
        speedMultiplier = -speedMultiplier;
    } 

    // Move character and set direction
    pos[changeIn] += isCarryingGem(player) ? speedMultiplier*g.playerWithGemSpeed*delta : speedMultiplier*g.playerSpeed*delta;
    pos.dir = direction;


    
    // console.log('pos.dir', pos.dir);
    addRequestId(pos, `${requestId}move`);
    
    countDataSent ++;
    
    model.savePlayerPos(player).then(({pos: {requestId}}) => {
        countDataReturned ++;
        calcLag(parseRequestId(requestId));
    });
};



const mainLoop = (timestamp) => {
    if (g.uid === ""){ // Login screen
        view.showSignIn();
    } else if(initialLobbyLoad){ // Loading screen
        view.showLoadingScreen();
    } else if (onlineGameState === 2 && localGameState === 1){ // Winner screen
        resetInitialDraw();
        view.viewWinnerScreen(winnerTeamId);
    } else if(localGameState === 1 && onlineGameState === 1){  // Game playing screen
        // Show game canvas
        view.viewGame();

        if(waitingForGame) waitingForGame = false;

        // Update delta, the time that hasn't been simulated left.
        delta += timestamp - lastFrameTimeMs;
        lastFrameTimeMs = timestamp;

        // Runs update as many times until it catches up with the current time.
        while (delta >= timestep) {
            // console.log('delta, timestep', delta, timestep);

            // Merge new data with current data stored
            if(shouldMergeDataThisFrame){
                mergeData(players, newPlayers, ["health", "pos"]);
                mergeData(tiles, newTiles, ["tough"]);
                mergeData(gems, newGems);
                shouldMergeDataThisFrame = false;
                // resendDroppedToughnessData();
            }
            
            // Updates gem position if a player is carrying one
            updateGemPosition();    
            // console.log('gems', gems);
            
            // Check input and execute it
            checkInput(timestep);

            // Check if patch to server is done, if so, send next.
            updateCurrentDataSending();

            // Update delta
            delta -= timestep;
        }
        
        // Updates lag & data sent / returned ui
        view.printDataCount(countDataReturned, countDataSent, totalDataRecieved, countDataDropped);
        // view.printGemInfo(gems);
        // Draws the game on the canvas
        view.draw(g.playerId, tiles, players, gems, lag);
    } else if (localGameState === 0){ // Menu
        view.viewMainMenu();
    }  

    if(waitingForGame === true){  // Load screen
        view.showLoadingScreen();
    }
    
    // Requests browser to call this before next painting of the page.
    requestAnimationFrame(mainLoop);
};

// Resets variables on whether or not the map has been drawn for the first time or not.
const resetInitialDraw = () => {
    initialTileDraw = true;
    initialPlayerDraw = true;
    initialGemDraw = true;
    initialGameState = true;

    countDataDropped = 0;
    countDataReturned = 0;
    countDataSent = 0;
    totalDataRecieved = 0;

    tiles = [];
    players = [];
    gems = [];
};

const resetGameState = () => {
    localGameState = 0;
    onlineGameState = 0;
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

const activateDebugListeners = () => {
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
            let t = g.calcObjBounds(data, g.tileSize);
            return x > t.x && x < t.r && y > t.y && y < t.b;
        });

        view.setTileDebugId(tile.id);
    
        console.log(tile);
        // console.log("sentDataRecieved", sentDataRecieved.filter(data => data.id === tile.id));
        // console.log("allDataRecieved", allDataRecieved.filter(data => data.id === tile.id));
        // console.log("allDataRecievedA", allDataRecievedA.filter(data => data.id === tile.id));
        // console.log("allDataRecievedB", allDataRecievedB.filter(data => data.id === tile.id));
        // console.log("allDataMerged", allDataMerged.filter(data => data.id === tile.id));
    });
};

const activateServerListeners = () => {
    
    // Update the list of gems in the current game
    g.c.addEventListener("serverUpdateGems", ({detail: gemData}) => {
        let filteredGems = _.compact(gemData);
        if(initialGemDraw === true){
            gems = filteredGems;
            initialGemDraw = false;
        } else {
            totalDataRecieved++;
            newGems = filteredGems;
        }        
        shouldMergeDataThisFrame = true;
    });

    // Updates the list of lobbies
    g.c.addEventListener("serverUpdateGames", ({detail:  lobbyData}) => {
        games = lobbyData;
        initialLobbyLoad = false;
        shouldMergeDataThisFrame = true;
    });

    // Updat the list of players in the current game
    g.c.addEventListener("serverUpdatePlayer", ({detail: playerData}) => {
        if(playerData !== null){
            
        // Filter the results, because firebase will return empty values if there are gaps in the array.
        let filteredPlayers = Object.keys(playerData).map(key => {
            let player = playerData[key];
            player.id = key;
            return player;
        }); 

          
            if(initialPlayerDraw === true || localGameState === 0){
                players = filteredPlayers;
            } else {
                totalDataRecieved++;
                newPlayers = filteredPlayers;
            }
        }
        

        initialPlayerDraw = false;
        shouldMergeDataThisFrame = true;
    });

    // Update the list of tiles in the current game
    g.c.addEventListener("serverUpdateTiles", ({detail: tileData}) => {
        let filteredTiles = _.compact(tileData);

        for(let i = 0; i < filteredTiles.length; i++){
            filteredTiles[i].id = i;
        }

        if(initialTileDraw === true){
            tiles = filteredTiles;
            initialTileDraw = false;
        } else {
            totalDataRecieved++;
            newTiles = filteredTiles;
        }

        shouldMergeDataThisFrame = true;

    });

    // Update game state of the current game
    g.c.addEventListener("serverUpdateGameState", ({detail: gameStateData}) => {
        initialGameState = false;
        if(isDefined(gameStateData)) {

            totalDataRecieved++;

            onlineGameState = gameStateData.gameState; 
            winnerTeamId = gameStateData.winningTeam;
            
            // If the game has been won by a player online, 
            // then send states and finish the game locally.
            if(onlineGameState === 2 && statsSent === false){
                statsSent = true;
                model.savePlayerStats(localPlayerStats);
                model.finishGame(Date.now(), winnerTeamId);
            }
            shouldMergeDataThisFrame = true;
        }
    });

};

// Prevent key defaults
window.addEventListener("keydown", e => {
    if(isDefined(keys[e.key])) e.preventDefault();
}, false);

// When a key is pressed, set it to true.
window.onkeydown = ({key: input}) => {
    for(let key in keys) if(key == input) keys[key] = true;
};

// When a key is up, set it to false.
window.onkeyup = ({key: input}) => {
    for(let key in keys) if(key == input) keys[key] = false;
};

app.controller("menuCtrl", ['$scope', function($scope) {
    
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
                    // Add dwarf players    
                    $scope.dwarfPlayers = Object.keys(players)
                    .filter(id => players[id].team == 0)
                    .map(dwarfId => {
                        let playerObj = players[dwarfId];
                        let owned = playerObj.uid === g.uid;
                        let alive = g.isPlayerAlive(players[dwarfId]);
                            
                        let dwarfObj = {
                            id: dwarfId,
                            uid: playerObj.uid,
                            owned,
                            alive
                        };

                        return dwarfObj;
                    });

                    // Add squirrel players
                    $scope.squirrelPlayers = Object.keys(players)
                    .filter(id => players[id].team == 1)
                    .map(squirrelId => {
                        let playerObj = players[squirrelId];
                        let owned = playerObj.uid === g.uid;
                        let alive = g.isPlayerAlive(players[squirrelId]);
                            
                        let squirrelObj = {
                            id: squirrelId,
                            uid: playerObj.uid,
                            owned,
                            alive
                        };

                        return squirrelObj;
                    });

                } else {
                    $scope.dwarfPlayers = [];
                    $scope.squirrelPlayers = [];
                }
            });
        });
    });

    $("#game-canvas").on("serverUpdatePlayer", ({detail: playerData}) => {
        // Apply players so angular ui can update with amount of players in game
        _.defer(function(){ 
            $scope.$apply(function(){
                if(isDefined(playerData)){
                    $scope.playersInGame = Object.keys(playerData).map(player => {
                        return {
                            uid: playerData[player].uid, 
                            team: playerData[player].team
                        };
                    });
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

                        //Add game winner information
                        if(isDefined(lobby.winner)){
                            lobby.winner = g.getTeamName(lobby.winner);
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

    $scope.selectGame = (id, name) => {
        model.detachGameListeners(); // Detach previous game listeners
        resetInitialDraw();
        model.setGameId(id);
        $scope.lobbyName = name;
        if(isDefined(id) && id !== "") {
            model.listenToCurGame();// Listen to new game data
        }
    };

    $scope.deleteGame = () => {
        let id = model.getGameId();
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
    

    $scope.isSignedIn = () => g.uid !== "" ? true  : false;

    $scope.getUserId = () => g.uid;

    $scope.isLobbySelected = () => model.getGameId() !== "" ? true : false;
    
    $scope.isThisLobbySelected = id => model.getGameId() === id;

    const addPlayer = teamId => {
        let player = players.find(({uid, team}) => uid === g.uid && team === teamId);
        // If player exists, join as player.
        if(isDefined(player)){
            $scope.selectPlayer(player.id);
        } 
        // If player does not exists, create player.
        else {
            gameMaker.addPlayer(teamId, tiles, players.length)
            .then(playerId => {
                $scope.selectPlayer(playerId);
            });
        }
    };

    $scope.addDwarf = () => {
        addPlayer(0);
    };

    $scope.addSquirrel = () => {
        addPlayer(1);
    };

    // $scope.isAlive = playerId => g.isPlayerAlive(players.find(({id}) => id === playerId));

    $scope.isFinished = gameEnd => isDefined(gameEnd) ? true : false;

    $scope.isObjectEmpty = obj => !isDefined(obj) || Object.keys(obj).length === 0;

    // Add a lobby and map to the lobby and listen to that game once it is done.
    $scope.addGame = () =>  {
        let gameName = generateBattleName();
        model.addLobby(Date.now(), gameName)
        .then(gameId => {
            model.setGameId(gameId);
            gameMaker.addGame()
            .then(() => {
                $scope.selectGame(gameId, gameName);
            });
        });
    };

    $scope.goToMainMenu = () => {
        $scope.selectGame("");// Selects no game
        resetGameState();// Goes to menu 
    };

    $scope.signOut = () => {
        if(countDataSent === countDataReturned){
            login.signOut().then(data => {
                location.reload();
            });
        } else {
            alert("Please wait until all player data has been sent.");
        }
    };

    $scope.signIn = (testingWithoutGoogle = true) => {
        model.initFirebase().then(() => {
            // Commented out for testing purpose.  Comment back in to test with multiple users.
            if(testingWithoutGoogle){
                login.signIn().then(({email, displayName}) => {
                    g.uid = email;
                    g.fullName = displayName;
                    model.listenToLobbys();
                    // Initialize firebase and start listening to the list of lobbys
                    view.showSignIn();
                });
            } else {
                g.uid = "timaconner1@gmail.com";
                g.fullName = "Tim Conner";
                model.listenToLobbys();
                view.showSignIn();
            }
        });
    };
}]);

module.exports.startGame = () => {
    activateServerListeners();
    activateDebugListeners();
    requestAnimationFrame(mainLoop);
};