var tm,$,document,window;
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
    "use strict";
    tm.manager = {};
    var m = tm.manager;
    var inMotion = false;// flag to prevent running animations at the same time
    m.transitionSpeed = 1000;
    m.state = 'N';
    m.isRunning = false;
    m.runHandle = null;
    m.actionMap = null;
    /**
     * Initial hook into everything
     */
    m.setup = function(){
        m.tape = new tm.Tape();
        m.numCells = m.countCells();
        m.draw();
        m.attachListeners();
    };
    /**
     * Attach listeners to all of the buttons
     */
    m.attachListeners = function(){
        $('#loadSymbols').click(m.loadSymbols);
        $('#goBackward').click(m.moveLeft);
        $('#goForward').click(m.moveRight);
        $('#curState').click(m.editState);
        $('#loadInstructions').click(m.loadInstructions);
        $('#startButton').click(m.startRunning);
        $('#stopButton').click(m.stopRunning);
        $('#resetButton').click(m.reset);
    };
    /**
     * Handler for when the user want to load symbols onto the tape
     */
    m.loadSymbols = function(){
        var symbols = $('#initialSymbols').val();
        var len = symbols.length;
        var head = m.tape.getHead();
        var i;
        for(i = 0; i < len; i++){
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
    m.moveRight = function(){
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
    m.moveLeft = function(){
        if(inMotion){
            return;
        }
        inMotion = true;
        var head = m.tape.getHead();
        var newHead = head.getPrevious();
        m.tape.setHead(newHead);
        $('#tickerTape').animate({'margin-left':'0px'},m.transitionSpeed,m.resetDivs);
    };
    m.stayStill = function(){
        if(inMotion){
            return;
        }
        inMotion = true;
        window.setTimeout(m.resetDivs,m.transitionSpeed);
    };
    /**
     * Sets the divs back to their default position and redraws.
     */
    m.resetDivs = function(){
        m.draw();
        $('#tickerTape').css('margin-left','-40px');
        inMotion = false;
        if(m.runHandle){
            $.publish('/animation/complete');
        }
    };
    /**
     * This function allows for the user to manually edit the state of the
     * machine
     */
    m.editState = function(){
        var input = $(document.createElement('input'));
        input.attr('type','text');
        input.val(m.state);
        function saveState(){
            // todo maybe check to see that the state is 1 character
            var state = input.val();
            m.state = state;
            // take it out of the dom
            input.remove();
            $('#curState').text(state);
        }
        input.blur(saveState);
        input.keypress(function(evt){
            if(evt.which === 13){
                saveState();
            }
        });
        $('#curState').html(input);
        input.focus();
    };
    /**
     * Function reads the instructions and loads them into an objec for
     * running
     */
    m.loadInstructions = function(){
        var instructs = $('#tmInstructions')
            .val().split('\n')
            .filter(function(ele){
                if($.trim(ele).length === 0){
                    return false;
                }
                return true;
            });
        // todo make this more restrictive
        var re = /\{(.),(.)\}->\{(.),(.),(.)\}/;
        var actions = instructs.map(function(ele){
            // Remove spaces
            ele = ele.replace(" ","","g");
            if(!re.test(ele)){
                throw "Rule: " + ele + " does not fit the grammar.";
            }
            var pieces = ele.match(re);
            return new tm.Action(pieces[1],pieces[2],pieces[3],
                pieces[4],pieces[5]);
        });
        var actionMap = {};
        var len = actions.length;
        var i,action,key;
        for(i = 0;i<len;i++){ // reindex the actions;
            action = actions[i];
            key = m.makeKey(action.getCurrentState(),action.getCurrentSymbol());
            actionMap[key] = action;
        }
        m.actionMap = actionMap;
    };
    /**
     * This function is meant to just reset the turing machine tape
     */
    m.reset = function(){
        m.tape = new tm.Tape();
        m.state = 'N';
        $('#curState').text('N');
        m.draw();
    };
    /**
     * Send the turing machine off running
     */
    m.startRunning = function(){
        if(!m.checkIfReady()){
            alert('Turing Machine Not Started');
            return;
        }
        m.runHandle = $.subscribe('/animation/complete',m.doStep);
        m.doStep();
    };
    /**
     * Check to see if the turing machine is ready to run
     */
    m.checkIfReady = function(){
        if(m.isRunning){
            return false;
        }
        var actionsLoaded = false;
        var action;
        for( action in m.actionMap ){
            if(m.actionMap.hasOwnProperty(action)){
                actionsLoaded = true;
                break;
            }
        }
        if(!actionsLoaded){
            return false;
        }
        return true;
    };
    /**
     * Stop the turing machine
     */
    m.stopRunning = function(){
        m.isRunning = false;
        $.unsubscribe(m.runHandle);
        delete m.runHandle;
    };
    /**
     * Does one step on the machine
     */
    m.doStep = function(){
        var action = m.getAction();
        m.performAction(action);
    };
    /**
     * Gets an action corresponding to the current state and symbol
     * @return {object} the matched action
     */
    m.getAction = function(){
        var currentState = m.state;
        var currentSymbol = m.tape.getHead().getSymbol();
        var key = m.makeKey(currentState, currentSymbol);
        var action = m.actionMap[key];
        if(!action){
            alert('Action ' + key + ' not found!');
            throw 'Action not found';
        }
        return action;
    };
    /**
     * Applies the action to the tape and state
     */
    m.performAction = function(action){
        m.state = action.newState;
        $('#curState').text(m.state);
        m.tape.head.setSymbol(action.newSymbol);
        m.draw();
        if(action.movement === tm.Action.MOVE_LEFT){
            m.moveLeft();
        }else if(action.movement === tm.Action.MOVE_RIGHT){
            m.moveRight();
        }else if(action.movement === tm.Action.STAY_STILL){
            m.stayStill();
        }else{
            throw 'Invalid Movement Option';
        }
    };
    /**
     * @param {string} state 
     * @param {string} symbol
     * @return {string} the key for this configuration
     */
    m.makeKey = function(state, symbol){
        return state + '-' + symbol;
    };
}());
/**
 * The tape class is really simple.  It holds a pointer to the head cell 
 */
(function(){
    "use strict";
    /**
     * Create a new tape.  This will create a tape with one cell at index 0
     */
    function Tape(){
        this.head = new tm.Cell(0);
    }

    tm.Tape = Tape;
    var t = Tape.prototype;
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
    };

}());

tm.BLANK_SYMBOL = '_';

/**
 * This is the class that represents a cell on the tape.  Its essentially a
 * node within a linked list.  Each cell has an index.  It's not necessary
 * right now, but i think it will when i need to specify starting tapes
 */
(function(){
    "use strict";
    /**
     * Create a new cell with the blank symbol
     * @param {int} idx the index of the cell
     */
    function Cell(idx){
        this.index = idx;
        this.symbol = tm.BLANK_SYMBOL;
        //this.symbol = idx; //for testing purposes
    }

    tm.Cell = Cell;

    var c = Cell.prototype;
    
    /**
     * Gets the next element in the list.  If it doesn't exist, we create it
     * @return {object}
     */
    c.getNext = function(){
        if(!this.next){
            this.next = new Cell(this.index + 1);
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
            this.previous = new Cell(this.index - 1);
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
    "use strict";
    function Action(currentState, currentSymbol, 
            newState, newSymbol, movement){
        this.currentState = currentState;
        this.currentSymbol = currentSymbol;
        this.newState = newState;
        this.newSymbol = newSymbol;
        this.movement = movement;
    }
    Action.MOVE_LEFT = 'L';
    Action.MOVE_RIGHT = 'R';
    Action.STAY_STILL = 'N';
    var a = Action.prototype;
    tm.Action = Action;
    /**
     * @return {string} the current state
     */
    a.getCurrentState = function(){
        return this.currentState;
    };
    /**
     * @return {string} the current symbol 
     */
    a.getCurrentSymbol = function(){
        return this.currentSymbol;
    };
}());
