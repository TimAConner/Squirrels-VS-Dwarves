# Squirrels-VS-Dwarves: 
## The Primordial Feud: Dwirrel Wars
Squirrels VS Dwarves, a realtime, multiplayer, team based game, is my front-end capstone made at the [Nashville Software School](http://nashvillesoftwareschool.com/).

## Motivation
I enjoy building software from the ground up and understanding each building block, especially when I can build tools to help others and me along the way.  Combined with the majority of my previous programming experience being in the Unity 3D game engine, I decided to build an app to fuze togethor my enjoyment of building tools and games.

### A Dwirrel, you say?
> Dwirrel \
> /dwʌ'ɹ̩'(ə)l/  \
> *noun* a fictitious word to be used when Squirrel and Dwarf should occur next to each other, but they sound bad in said sentence.


## My Goals - Why I made furry forest dwellers and mythical mine dwellers murder eachother for my pleasure
My previous programming experience was making little games in Unity 3D, so I decided that I wanted to make the foundations of one of those games, but I wanted to do it purely in JavaScript.  My goals (listed in the MVP defenition at the bottom of the Readme) were to make a real time multiplayer game in pure Javascript using Firebase Realtime Database.

## How To Contribute - The mysterious ways to be a cool Dwirrel
1. Clone down locally
1. Run: npm init
1. Run: npm install
1. Run: grunt
1. Start local sever
    1. If you are using my firebase, then you will need to be added to it, othwerise you can create your own.
    1. If using your own firebase,
        1. Add apiKey.json file in js/
            1. Fill in your api key and sender id
            ```
            {
                "apiKey": "Your api key",
                "messagingSenderId": "Your msi"
            }
            ```
        1. To be able to use Google login, it must be enabled under Sign In providers Sign In Methods in Authentication.  
            1. Your ip must be added to the list of acceptable ips in Authorized Domains under Sign In Methods in Authentication.
1. You're ready to starting editing!

## Debugging Tips - How to ram your face into a brick wall
1. If something is not happening that should be happening:
    1. Check if firebase is being updated, if it is, the issue is most likely in view or mergeData().
        1. Enjoy punching the brick wall.  I'm not a sadist, but you might be.
    1. If firebase is not being updated, check in model or checkInput().

## How It Runs - A Day In The Life of A Dwirrel
1. main.js executes automatically, triggering startGame() in controller.js
1. startGame() activates the listeners of the firbase realtime server and begains the mainLoop()
1. mainLoop() checks for which screen the player is on (loading, login, main menu, game, etc.)
    1. If the game is being displayed, 
        1. Check if the game should be updated this frame and calculate how many steps must be taken to  keep the game at 60 fps.
            1. shouldMergeDataThisFrame checks if new data has been sent form the listeners,
                1. If so, merge the data (tiles, gems, and players) with current data, making sure only to use NEW data and not data already integrated into the game.
            1. updateGemPosition checks if gems are being carried and updates their pos
            1. checkInput checks for player input, calculates if they can do it, and excecutes it.
        1. Once the amount of times this frame the game should be run to maintain 60 fps is completed,
            1. view.printDataCount prints lag and other extra data on the screen.
            1. view.draw draws the players, tiles, gems, and healthbars.
        1. requestAnimationFrame(mainLoop) is called to run the loop again.
### The Files
* main.js
    * Triggers controller
* controller.js
    * Deals with bulk of game logic
    * Calls view and model
* view.js
    * Draws game onto screen
* model.js
    * Interacts with firebase
* game.js
    * Holds globally used functions and variables
* animationController.js
    * Deals with choosing the correct animation for a player
    * Displays the animation
* apiKey.json
    * Holds the firebase api key
* gameMaker.js
    * Creates the lobby, tiles, players, gems, and gameState tables on firebase.
* mapMaker.js
    * Creates the tiles for the map
* login.js
    * Logic for google login and logout.





## Version Goals
### Version 3.0 Goals
- [x] Health Bars
- [ ] Can't move through allies
- [x] Create player and join through Google
- [x] Block being destroyed animation
- [x] Player Animation?
- [x] Lobbies for multiple Games?
- [x] Refactor to use auth.currentUser()
- [x] Implement logout
- [ ] ? Health regen or..?

### Version 2.0 Goals
- [x] Restrict movement to map
- [x] Streamline adding a player and starting game as player
- [x] Ability to kill enemey
- [x] Player lobby
- [x] Smaller Modules / Refactor code
- [x] See vision around ally
    - [x] Only see enemy player if can see their tile.
- [x] Squirrel & Nut image
- [x] See direction player is facing
- [x] Face direction of keys even if cant move

### MVP Goals
- [x] Pickup enemy gem and move it
- [x] Drop enemy gem
- [x] Mine through blocks
- [x] Only see your team and team base
- [x] See squares around you
- [x] Can't pick up your own gem
- [x] Move around with arrow keys
- [x] Spacebar to mine through object