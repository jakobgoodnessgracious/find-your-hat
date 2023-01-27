const term = require('terminal-kit').terminal;
const setTimeout = require('timers/promises').setTimeout;
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
const hat = '^R^^';
const hole = '^cO';
const fieldCharacter = '^Y░';
const pathCharacter = '^B*';
const activePathCharacter = '^W*';
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';
const UP = 'UP';
const DOWN = 'DOWN';


class Field {
    constructor(field = [], opts) {
        const  {hardMode = false, randomStart = false, simulate = false} = opts || {};
        this._field = field;
        this.hardMode = hardMode;
        if (randomStart) {
            const [xStart, yStart] = Field.getEmptyLoc(this._field, this.getHeight(), this.getWidth());
            this._xPlayerLocation = xStart;
            this._yPlayerLocation = yStart;
            this._xLastPlayerLocation = xStart;
            this._yLastPlayerLocation = yStart;
        } else {
            this._xPlayerLocation = 0;
            this._yPlayerLocation = 0;
            this._xLastPlayerLocation = 0;
            this._yLastPlayerLocation = 0;
        }
        this._simulate = simulate;
        this.isGameOver = false;
    }

    static isHatChar(char) {
        return char === hat;
    }

    static isHoleChar(char){
        return char === hole;
    }

    toString() {
        return this._field.join('\n').split(',').join(''); 
    }

    print() {
        // probably remove . . . or figure out how to not reprint?
        let newlines = '';
        for (let i = 0; i < 100; i+=1 ){
            newlines += '\n';
        }
        // process.stdout.write('\u001B[2J\u001B[0;0f');
        // process.stdout.cursorTo(0);
        // term(newlines);
        term.reset();
        term(this.toString());
    }

    static getEmptyLoc(field, height, width) {
        const isHatOrHoleOrStartOrPath = (location) => {
            const [x,y] = location;
            const value = field[y][x];
            return value === hole || value === hat || value === pathCharacter || value === activePathCharacter || (!x && !y);
        }

        let holeX = 0;
        let holeY = 0;
        while (isHatOrHoleOrStartOrPath([holeX, holeY])) {
            holeX = Math.floor(Math.random() * width);
            holeY = Math.floor(Math.random() * height);
        }
        return [holeX, holeY];
    }

    static generateField(height = 10, width = 5, percentageHoles = 20) {
        const percentHolesFloat = percentageHoles / 100;
        let numHoles = Math.floor(height * width * percentHolesFloat);
        
        // a field is an array of many row arrays
        const field = [];
        // draw empty field
        // height
        for (let y = 0; y < height; y+=1){
            // width
            let row = [];
            for (let x = 0; x < width; x+=1){   
                row.push(fieldCharacter);
            }

            field.push(row);
        }

        // locate hat
        const [hatX, hatY] = Field.getEmptyLoc(field, height, width);
        field[hatY][hatX] = hat;
        // locate holes
        
        for (numHoles; numHoles > 0; numHoles-=1) {
            const [holeX, holeY] = Field.getEmptyLoc(field, height, width);
            field[holeY][holeX] = hole;
        }

        // console.log('this.height', Field.height);

        return field;
    }

    endGame(gameOverText) {
        this.gameOverText = '\n' + gameOverText;
        this.isGameOver = true;
    }
    
    getCurrentChar(){
        if (!this._field[this._yPlayerLocation]){
            return null;
        }
        if (!this._field[this._yPlayerLocation][this._xPlayerLocation]){
            return null;
        }

        return this._field[this._yPlayerLocation][this._xPlayerLocation];
    }

    checkAtHat(){
        if (Field.isHatChar(this.getCurrentChar())){
            this.endGame('You found the hat! Congratulations!')
        }
    }

    checkInHole(){
        if (Field.isHoleChar(this.getCurrentChar())){
            this.endGame('Sorry, you fell down a hole. Please try again.')
        }
    }

    checkOutOfBounds(){
        if (!this.getCurrentChar()){
            this.endGame('Sorry, you\'ve fallen out of bounds. Please try again.')
        }
    }

    getHeight(){
        return this._field.length;
    }

    getWidth() {
        return this._field[0].length;
    }

    reGenerateField() {
        const height = this.getHeight();
        const width = this.getWidth();
        const getNumHolesPercent = () => {
            let numHoles = 0;
            this._field.forEach((row)=>{
                row.forEach((char) => {
                    if (char === hole) {
                        numHoles+=1;
                    }
                })
            });
            return Math.floor(numHoles * 100 / (height * width));
        }
        // 5/25 = x/100 numholes * 100 / total
        this._field = Field.generateField(height, width, getNumHolesPercent());
    }

    addRandomNumHoles() {
        const possibleNumHoles = [0,1,2];
        let numHolesToAdd = possibleNumHoles[Math.floor(Math.random() * possibleNumHoles.length)];
        for (numHolesToAdd; numHolesToAdd > 0; numHolesToAdd-=1) {
            const [holeX, holeY] = Field.getEmptyLoc(this._field, this.getHeight(), this.getWidth());
            this._field[holeY][holeX] = hole;
        }
    }

    getHatLocation() { // maybe just set it in the beginning
            let rowX;
            let rowY;
            this._field.forEach((row, rowIndex) => {
                if (row.includes(hat)) {
                    rowX = row.indexOf(hat);
                    rowY = rowIndex;
                }
            });
            return [rowX, rowY];
    }

    
    getCurrentLRUDLocInfo(xPlayerLocation, yPlayerLocation) {
        const [leftX, leftY] = [xPlayerLocation - 1, yPlayerLocation];
        const leftChar = this._field[leftY] ? this._field[leftY][leftX] : null;
        const [rightX, rightY] = [xPlayerLocation + 1, yPlayerLocation];
        const rightChar = this._field[rightY] ? this._field[rightY][rightX] : null;
        const [upX, upY] = [xPlayerLocation, yPlayerLocation - 1];
        const upChar = this._field[upY] ? this._field[upY][upX] : null; 
        const [downX, downY] = [xPlayerLocation, yPlayerLocation + 1];
        const downChar = this._field[downY] ? this._field[downY][downX] : null;

        return {
            LEFT: [leftChar, leftX, leftY],
            RIGHT: [rightChar, rightX, rightY],
            UP: [upChar, upX, upY],
            DOWN: [downChar, downX, downY] 
        }
    }

    getDirectionsOfHat() {
        let lrDirection = '';
        let udDirection = '';
        const [hatX, hatY] = this.getHatLocation();
        if (hatX > this._xPlayerLocation) {
            lrDirection = RIGHT;
        }

        if (hatX < this._xPlayerLocation) {
            lrDirection = LEFT;
        }

        if (hatY > this._yPlayerLocation) {
            udDirection = DOWN;
        }

        if (hatY < this._yPlayerLocation) {
            udDirection = UP;
        }

        return [lrDirection, udDirection];
    }

    get LRUD() {
        return [RIGHT, LEFT, UP, DOWN];
    }

    storeLastLocation(){
        this._xLastPlayerLocation = this._xPlayerLocation;
        this._yLastPlayerLocation = this._yPlayerLocation;
    }

    async canSolve(simulate) {
        // this need to be redone
        const visitedLocationsInfo = {};
        let simXPlayerLocation = this._xPlayerLocation;
        let simYPlayerLocation = this._yPlayerLocation;
        let canSolve = false;
        let arrived = false;
        while (!arrived) {         
            if (this.hardMode && this.moved && simulate) {
                this.addRandomNumHoles();
               }   
            // console.log('simXPlayerLocation', simXPlayerLocation, 'simYPlayerLocation',simYPlayerLocation)
            let prioritizedDirs = this.getDirectionsOfHat().filter((val)=> val);
            if (!visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation]){
                visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation] = this.getCurrentLRUDLocInfo(simXPlayerLocation, simYPlayerLocation);
            }
            visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation] = {...visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation], ...this.getCurrentLRUDLocInfo(simXPlayerLocation, simYPlayerLocation)};
            const directionInfo = visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation];
            // gather possible directions to try, prioritized by hat direction, not out of bounds, not a hole, 
            // and not attempted direction from location before
            this.LRUD.forEach((direction) => {
                const [dirChar, dirX, dirY] = directionInfo[direction];
                // ban this direction now and in the future
                if (!visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs) {
                    visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs = [];
                }
                if (dirChar === hole || !dirChar) {
                    if (!visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs.includes(direction)){
                        visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs.push(direction);
                    }
                }
                const bannedDirs = visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs || [];
                if (prioritizedDirs.includes(direction) && bannedDirs.includes(direction)) {
                    prioritizedDirs.splice(prioritizedDirs.indexOf(direction), 1);
                }
                if (!prioritizedDirs.includes(direction) && !bannedDirs.includes(direction)) {
                    prioritizedDirs.push(direction);
                }
            });
            if (this._field[simYPlayerLocation][simXPlayerLocation] === hat) {
                arrived = true;
                canSolve = true;
                // console.log('can solve!!!!');
            }
            // console.log('prioritizedDirs', prioritizedDirs);
            if (prioritizedDirs.length) {
                // sort based off of next direction not visited being priority
                const sortedPrioritizedDirs = prioritizedDirs.sort((a,b) => {
                    const [, nextXLocA, nextYLocA ] = directionInfo[a];
                    const [, nextXLocB, nextYLocB ] = directionInfo[b];
                    if (visitedLocationsInfo[nextXLocA + '-' + nextYLocA] && !visitedLocationsInfo[nextXLocB + '-' + nextYLocB]) {
                        return 1;
                    } else if (!visitedLocationsInfo[nextXLocA + '-' + nextYLocA] && visitedLocationsInfo[nextXLocB + '-' + nextYLocB]) {
                        return -1;
                    } 
                    return 0;

                });
                // console.log('sortedPri', sortedPrioritizedDirs);
                const nextDirection = sortedPrioritizedDirs[0];

                if (!visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs.includes(nextDirection)){
                    visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation].bannedDirs.push(nextDirection);
                }
                // console.log('nextDirection', nextDirection, 'info', visitedLocationsInfo[simXPlayerLocation + '-' + simYPlayerLocation]);
                const [, nextXLoc, nextYLoc ] = directionInfo[nextDirection];
                simXPlayerLocation = nextXLoc;
                simYPlayerLocation = nextYLoc;
                // clean this up by making this more reusable
                if (simulate) {
                    this.markFieldLocation();
                    this.print();
                 //    const direction = prompt('\nUse the arrow keys to move the cursor.');
                    term('\nUse the arrow keys to move the cursor.')
                    this.storeLastLocation();
                    this.updateLocation(nextDirection);
                    this.checkOutOfBounds();
                    this.checkInHole();
                    this.checkAtHat();
                    await setTimeout(500);
                }
                // console.log('next  simXPlayerLocation', simXPlayerLocation, 'simYPlayerLocation', simYPlayerLocation);
            } else {
                // console.log('cant solve');
                if (simulate){
                    this.endGame('No possible solution!')
                }
                break;
            }
        }

        // return 2 or 1 dirs dirs either x + y, x, or y, e.g., ['left', 'down'], ['right'], ['down']
        
        // console.log('dir of hat', this.getDirectionsOfHat());
        // console.log('getCurrentLRUDLocInfo', this.getCurrentLRUDLocInfo());
        return canSolve;
       
    }

    get moved() {
        return this._xPlayerLocation || this._yPlayerLocation;
    }

    updateLocation(lrud) {
        if (lrud === LEFT) {
            this._xPlayerLocation -= 1;
        } else if (lrud === RIGHT) {
            this._xPlayerLocation += 1;
        } else if (lrud === UP) {
            this._yPlayerLocation -= 1;
        } else if (lrud === DOWN) {
            this._yPlayerLocation += 1;
        } else {
            this.endGame('Incorrect character. Please use the arrow keys: \'LEFT\', \'RIGHT\', \'UP\', or \'DOWN\'');
        }

    }

    static terminate() {
        process.exit();
    }

    termPrompt() {
        const prom = new Promise((resolve, reject)=>{
            term.grabInput();
            term.on( 'key' , function( name , matches , data ) {
                resolve(name);
                if ( name === 'CTRL_C' ) { Field.terminate(); }
            } );
        });
        return prom;
    }

    async play(){
        while (!await this.canSolve()) {
            this.reGenerateField();
        }
        if (this._simulate) {
            await this.canSolve(true);
        } else {
            while (!this.isGameOver){
               this.markFieldLocation();
               if (this.hardMode && this.moved) {
                this.addRandomNumHoles();
               }
               this.print();
            //    const direction = prompt('\nUse the arrow keys to move the cursor.');
               term('\nUse the arrow keys to move the cursor.')
               const direction = await this.termPrompt();
               this.storeLastLocation();
               this.updateLocation(direction);
               this.checkOutOfBounds();
               this.checkInHole();
               this.checkAtHat();
            }
        }
        console.log(this.gameOverText);
        Field.terminate();
    }

    markFieldLocation(){
        this._field[this._yLastPlayerLocation][this._xLastPlayerLocation] = pathCharacter;
        this._field[this._yPlayerLocation][this._xPlayerLocation] = activePathCharacter;
    }
}
new Field(Field.generateField(60, 120, 20),{ randomStart: true, hardMode: true, simulate: true}).play();
// new Field(Field.generateField(5, 10)).play();