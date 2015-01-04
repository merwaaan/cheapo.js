# Cheapo.js

Cheapo is a CHIP-8 emulator written in JavaScript.

![Maze](https://raw.githubusercontent.com/merwaaan/cheapo.js/master/maze.png)
![Space Invaders](https://raw.githubusercontent.com/merwaaan/cheapo.js/master/invaders.png)
![Brix](https://raw.githubusercontent.com/merwaaan/cheapo.js/master/brix.png)

Currently, most games seem to work without issues. Some parts that still need a bit of work:
* There is a lot of screen flickering because of the constant CLS calls (some kind of software double buffering could help?)
* Binary XmlHttpRequests used to get ROMs retrieve wrong data on Chrome (but this works well locally, or with Firefox)