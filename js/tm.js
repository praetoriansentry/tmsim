"use strict"
var tm;
if(!tm){
    tm = {};
}
(function(){
    tm.manager = {};
    var m = tm.manager;
    m.transitionSpeed = 1000;
    m.setup = function(){
        m.tape = new tm.tape();
        m.numCells = m.countCells();
        m.draw();
    };
    m.countCells = function(){
        return $('#tickerTape div').length;
    };
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
    m.moveLeft= function(){
        var head = m.tape.getHead();
        var newHead = head.getNext();
        m.tape.setHead(newHead);
        $('#tickerTape').animate({'margin-left':'-80px'},m.transitionSpeed,m.resetDivs);
    };
    m.moveRight = function(){
        var head = m.tape.getHead();
        var newHead = head.getPrevious();
        m.tape.setHead(newHead);
        $('#tickerTape').animate({'margin-left':'0px'},m.transitionSpeed,m.resetDivs);
    };
    m.resetDivs = function(){
        m.draw();
        $('#tickerTape').css('margin-left','-40px');
    };
}());
(function(){
    function tape(){
        this.head = new tm.cell(0);
    };
    tm.tape = tape;
    var t = tape.prototype;
    t.getHead = function(){
        return this.head;
    };
    t.setHead = function(cell){
        this.head = cell;
    }

}());

tm.BLANK_SYMBOL = '_';

(function(){
    function cell(idx){
        this.index = idx;
        this.symbol = tm.BLANK_SYMBOL;
        this.symbol = idx; //for testing purposes
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
