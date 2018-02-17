# Squirrels-VS-Dwarves
This is the testing ground for my front end capstone at the [Nashville Software School](http://nashvillesoftwareschool.com/)



## How To Contribute
1. Clone down locally
1. Run: npm init -y
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

## Debugging Tips
1. If something is not happening that should be happening:
    1. Check if firebase is being updated, if it is, the issue is most likely in view or mergeData().
    1. If firebase is not being updated, check in model or checkInput().

## How It Runs -- A Day In The Life of A Dwarf or Squirrel
1. main.js executes automatically, triggering startGame() in controller.js
1. startGame() activates the listeners of the firbase realtime server and begains the mainLoop()
1. mainLoop() checks for which screen the player is on (loading, login, main menu, game, etc.)
    1. If on the game, 
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





## Version 3.0 Goals
- [x] Health Bars
- [ ] Can't move through allies
- [x] Create player and join through Google
- [x] Block being destroyed animation
- [x] Player Animation?
- [x] Lobbies for multiple Games?
- [ ] Refactor to use auth.currentUser()
- [ ] Implement logout
- [ ] ? Health regen or..?

## Version 2.0 Goals
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

## MVP Goals
- [x] Pickup enemy gem and move it
- [x] Drop enemy gem
- [x] Mine through blocks
- [x] Only see your team and team base
- [x] See squares around you
- [x] Can't pick up your own gem
- [x] Move around with arrow keys
- [x] Spacebar to mine through object