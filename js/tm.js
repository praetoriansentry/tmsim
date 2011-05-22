"use strict"
var tm;
if(!tm){
    tm = {};
}
(function(){
    tm.manager = {};
    var m = tm.manager;
    m.setup = function(){
        m.tape = new tm.tape();
        m.numCells = m.countCells();
    };
    m.countCells = function(){
        return $('#tickerTape div').length;
    };
}());
(function(){
    function tape(){
        this.head = new tm.cell(0);
    };
    tm.tape = tape;
}());

tm.BLANK_SYMBOL = '_';

(function(){
    function cell(idx){
        this.index = idx;
        this.symbol = tm.BLANK_SYMBOL;
    };

    tm.cell = cell;

    var c = cell.prototype;

    c.getNext = function(){
        if(!this.next){
            this.next = new cell(this.index + 1);
            this.next.setPrevious(this);
        }
        return this.next;
    };
    
    c.getPrevious = function(){
        if(!this.previous){
            this.previous = new cell(this.index - 1);
            this.previous.setNext(this);
        }
        return this.previous;
    };

    c.setNext = function(next){
        this.next = next;
    };

    c.setPrevious = function(previous){
        this.previous = previous;
    };
    
    c.getSymbol = function(){
        return this.symbol;
    };
    
    c.setSymbol = function(sym){
        this.symbol = sym;
    };
}());

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
