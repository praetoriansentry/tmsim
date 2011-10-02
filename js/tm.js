var tm,$;
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
        $('#goBackward').click(m.updateTransitionSpeed);
        $('#goForward').click(m.updateTransitionSpeed);
        $('#goBackward').click(m.moveLeft);
        $('#goForward').click(m.moveRight);
        $('#curState').click(m.editState);
        $('#loadInstructions').click(m.loadInstructions);
        $('#startButton').click(m.startRunning);
        $('#startButton').click(m.updateTransitionSpeed);
        $('#stopButton').click(m.stopRunning);
        $('#resetButton').click(m.reset);
        $('#showInstructions').click(m.toggleInstructions);
        $('#runDemo').click(m.runDemo);
    };
    /**
     * This is a small function to run a demo for a user to see how the turing
     * machine works
     */
    m.runDemo = function(){
        m.stopRunning();
        m.reset();
        var instructions = "{1,_}->{1,_,R}\n{1,1}->{1,1,R}\n{1,-}->{1,-,R}\n{1,=}->{2,_,L}\n{2,1}->{3,=,L}\n{2,-}->{H,_,L}\n{3,1}->{3,1,L}\n{3,-}->{4,-,L}\n{4,_}->{4,_,L}\n{4,1}->{1,_,R}";
        var symbols = '1111-111=';
        $('#tmInstructions').text(instructions);
        m.loadInstructions();
        $('#initialSymbols').val(symbols);
        m.loadSymbols();
        m.state = 1;
        $('#curState').text(1);
        m.startRunning();
    };
    /**
     * Small function to update the transtion speed.  This should be called
     * before starting a new run.
     */
    m.updateTransitionSpeed = function(){
        if($('#transpeed').val().match('^(0|[1-9][0-9]*)$')){
            m.transitionSpeed = parseInt($('#transpeed').val(), 10);
        }else{
            m.transitionSpeed = 1000; // Default to 1000
        }
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
    m.countCells = function(){ // Default to 1000
        return $('#tickerTape div').length;
    };
    /**
     * Small function to show/hide the instructions
     */
    m.toggleInstructions = function(){
        var ins = $('#instructions');
        if(ins.hasClass('hidden')){
            $('#showInstructions').text('Hide Instructions');
            ins.removeClass('hidden');
        }else{
            $('#showInstructions').text('Show Instructions');
            ins.addClass('hidden');
        }

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
        var re = /\{(.),(.)\}->\{(.),(.),([LRN])\}/;
        var actions = instructs.map(function(ele){
            // Remove spaces
            ele = ele.replace(" ","","g");
            if(!re.test(ele)){
                tm.notify("Rule: " + ele + " does not fit the grammar.");
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
        tm.notify('Instructions successfully loaded');
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
            return;
        }
        m.runHandle = $.subscribe('/animation/complete',m.doStep);
        tm.notify('Turing machine started');
        m.doStep();
    };
    /**
     * Check to see if the turing machine is ready to run
     */
    m.checkIfReady = function(){
        if(m.isRunning){
            tm.notify('Turing machine already running');
            return false;
        }
        if(m.runHandle){
            tm.notify('Turing machine already running');
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
            tm.notify('No instruction set loaded');
            return false;
        }
        return true;
    };
    /**
     * Stop the turing machine
     */
    m.stopRunning = function(){
        m.isRunning = false;
        try{
            $.unsubscribe(m.runHandle);
            delete m.runHandle;
        }catch(ex){
        }
        tm.notify('Turing machine stopped');
    };
    /**
     * Does one step on the machine
     */
    m.doStep = function(){
        if(m.state === 'H'){
            m.stopRunning();
            return;
        }
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
            tm.notify('No instruction found for state: '+ currentState 
                + ' and symbol: ' + currentSymbol);
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
 * The point of this code is just to control the messages that get show to the
 * user.  Rather than using alerts, I would rather use this
 */
(function(){
    tm.notify = function(msg,color){
        var div = $(document.createElement('div'));
        div.attr('class','notification');
        if(color){
            div.css('background-color',color);
        }
        div.text(msg);
        div.bind('click', function() {
            $(this).slideUp('fast',function(){
                div.remove();
            });
        });
        $(document.body).append(div);
        div.slideDown("slow");
        setTimeout(function() { div.slideUp('fast',function(){div.remove()}) }, 3000);
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
