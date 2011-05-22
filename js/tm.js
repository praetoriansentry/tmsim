"use strict"
var tm;
if(!tm){
    tm = {};
}
/**
 * This is the manager code.  It really just orchestrates all of the user input
 * and animations.  Most of the code will be here I think.  This should be the
 * code that uses jquery and is aware of the dom.  The other code should be 
 * independent of that.
 */
(function(){
    tm.manager = {};
    var m = tm.manager;
    var inMotion = false;// flag to prevent running animations at the same time
    m.transitionSpeed = 1000;
    /**
     * Initial hook into everything
     */
    m.setup = function(){
        m.tape = new tm.tape();
        m.numCells = m.countCells();
        m.draw();
        m.attachListeners();
    };
    /**
     * Attach listeners to all of the buttons
     */
    m.attachListeners = function(){
        $('#loadSymbols').click(m.loadSymbols);
        $('#goBackward').click(m.moveRight);
        $('#goForward').click(m.moveLeft);
    };
    /**
     * Handler for when the user want to load symbols onto the tape
     * @param {event} evt
     */
    m.loadSymbols = function(evt){
        var symbols = $('#initialSymbols').val();
        var len = symbols.length;
        var head = m.tape.getHead();
        for(var i = 0; i < len; i++){
            head.setSymbol(symbols[i]);
            head = head.getNext();
        }
        m.draw();
    };
    /**
     * @return {int} the number of cells on the tape
     */
    m.countCells = function(){
        return $('#tickerTape div').length;
    };
    /**
     * This function will walk forward and backwards up the linked list of 
     * cells and push the symbols into the dom nodes on the tape
     */
    m.draw = function(){
        var head = m.tape.getHead();
        var divHead = $('.tapeCell.headCell');
        divHead.text(head.symbol);
        var fwd = divHead.next();
        var fwdCell = head.getNext();
        while( fwd.length > 0 ){
            fwd.text(fwdCell.symbol);
            fwdCell = fwdCell.getNext();
            fwd = fwd.next();
        }

        var pre = divHead.prev();
        var preCell = head.getPrevious();
        while( pre.length > 0 ){
            pre.text(preCell.symbol);
            preCell = preCell.getPrevious();
            pre = pre.prev();
        }
    };
    /**
     * This moves the head to the next element.  It also animates the
     * transtition
     */
    m.moveLeft= function(){
        if(inMotion){
            return;
        }
        inMotion = true;
        var head = m.tape.getHead();
        var newHead = head.getNext();
        m.tape.setHead(newHead);
        $('#tickerTape').animate({'margin-left':'-80px'},m.transitionSpeed,m.resetDivs);
    };
    /**
     * This moves the head to the previous element.  It also animates the
     * transtition
     */
    m.moveRight = function(){
        if(inMotion){
            return;
        }
        inMotion = true;
        var head = m.tape.getHead();
        var newHead = head.getPrevious();
        m.tape.setHead(newHead);
        $('#tickerTape').animate({'margin-left':'0px'},m.transitionSpeed,m.resetDivs);
    };
    /**
     * Sets the divs back to their default position and redraws.
     */
    m.resetDivs = function(){
        m.draw();
        $('#tickerTape').css('margin-left','-40px');
        inMotion = false;
    };
}());
/**
 * The tape class is really simple.  It holds a pointer to the head cell 
 */
(function(){
    /**
     * Create a new tape.  This will create a tape with one cell at index 0
     */
    function tape(){
        this.head = new tm.cell(0);
    };
    tm.tape = tape;
    var t = tape.prototype;
    /**
     * @return {object} the head cell
     */
    t.getHead = function(){
        return this.head;
    };
    /**
     * @param {object} cell the cell to use as the new head of the tape
     */
    t.setHead = function(cell){
        this.head = cell;
    }

}());

tm.BLANK_SYMBOL = '_';

/**
 * This is the class that represents a cell on the tape.  Its essentially a
 * node within a linked list.  Each cell has an index.  It's not necessary
 * right now, but i think it will when i need to specify starting tapes
 */
(function(){
    /**
     * Create a new cell with the blank symbol
     * @param {int} idx the index of the cell
     */
    function cell(idx){
        this.index = idx;
        this.symbol = tm.BLANK_SYMBOL;
        //this.symbol = idx; //for testing purposes
    };

    tm.cell = cell;

    var c = cell.prototype;
    
    /**
     * Gets the next element in the list.  If it doesn't exist, we create it
     * @return {object}
     */
    c.getNext = function(){
        if(!this.next){
            this.next = new cell(this.index + 1);
            this.next.setPrevious(this);
        }
        return this.next;
    };
    
    /**
     * Gets the previous element in the list.  If it doesn't exist, we create it
     * @return {object}
     */
    c.getPrevious = function(){
        if(!this.previous){
            this.previous = new cell(this.index - 1);
            this.previous.setNext(this);
        }
        return this.previous;
    };
    /**
     * @param {object} next the next cell on the tape
     */
    c.setNext = function(next){
        this.next = next;
    };

    /**
     * @param {object} previous the previous cell on the tape
     */
    c.setPrevious = function(previous){
        this.previous = previous;
    };
    /**
     * Get the symbol for this current cell
     * @return {object}
     */
    c.getSymbol = function(){
        return this.symbol;
    };
    /**
     * Sets the symbol for the current cell
     * @param {string} a symbol
     */
    c.setSymbol = function(sym){
        this.symbol = sym;
    };
}());

/**
 * Actions are the objects that control the transitions and state changes.
 * The manager will have an array of actions that it will search in order to
 * decide how to act
 */
(function(){
    function action(currentState, currentSymbol, 
            newState, newSymbol, movement){
        this.currentState = currentState;
        this.currentSymbol = currentSymbol;
        this.newState = newState;
        this.newSymbol = newSymbol;
        this.movement = movement;
    };
    action.MOVE_LEFT = 'L';
    action.MOVE_RIGHT = 'R';
    action.STAY_STILL = 'N';
    var a = action.prototype;
    tm.action = action;
}());
