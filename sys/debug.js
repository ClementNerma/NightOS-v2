/*
  This file contains the debug library, which permit to manage errors and
  debugging messages.
  This file also permit to check the type of the given arguments for every
  functions. It's like the TypeScript features, but in pure JavaScript. Also,
  it prevent some JavaScript code to give any bad argument to a system function.
  The point of that is to prevent the errors due to a bad argument, and
  display some errors that says "this argument is incorrect, we're expecting
  that".
*/

'use strict';

// TODO: There is a syntax error into 'night.js', this error is caught by
//       process.on(...) and transmitted to 'error' but nothing is displayed
//       on the DOM.

/** Is there an error running ?
  * @type {boolean} */
let isErrorRunning = false;

/**
  * Throw a fatal error
  * @param {string} message
  * @param {Error} [error] A JavaScript native error
  * @returns {void}
  */
const error = (message, error) => {
  // If this is the child process...
  if(IS_CHILD) {
    require('electron').ipcRenderer.sendToHost('error', message, error ? { message: error.message, stack: error.stack } : undefined, true);
    process.exit();
  }

  // If an error is running...
  if(isErrorRunning)
    // Just display the error
    throw new Error(message);

  // Indicates that an error is running
  isErrorRunning = true;

  // Close the developper tools (if opened),
  // excepted if the '--force-debug' argument was specified.
  if(!argv['force-debug'])
    ipc.sendSync('devtools', false);

  // Remove a potential #error_cover element
  /** @type {void|Element} */
  let cover;

  // While any element with an error-reserved id is found...
  while(cover = (document.getElementById('error_cover') || document.getElementById('restart') || document.getElementById('cooldown')))
    // Remove it
    cover.remove();

  /** Define the stack's output (default: nothing)
    * @type {string} */
  let stack = '';

  // If an error was specified...
  if(error) {
    // Format the error's stack
    stack = error.stack.split('\n').slice(1);

    // For each line...
    for(let i = 0; i < stack.length; i++)
      stack[i] = stack[i]
                  .replace(/^ *at (file\:\/\/\/|)(.*)\:([0-9]+)\:([0-9]+)$/, String.fromCharCode(160).repeat(2) + 'at $2 : $3,$4')
                  .replace(/^ *at (.*) \((file\:\/\/\/|)(.*):([0-9]+):([0-9]+)\)$/, String.fromCharCode(160).repeat(2) + 'at $3 : $4,$5')
                  .replace(BASE_DIR, '');

    // Add the formatted stack to the message
    stack = tr('Stack') + ' :\n\n' + error.message + '\n' + stack.join('\n') + '\n\n';
  }

  // Log the error
  if(typeof Night !== 'undefined')
    Night.logError(message + ' ' + stack.replace(/\n/g, '\\'), true);

  // Inject the stylesheet
  let style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = `
  @font-face   { font-family: "Free Mono"; src: url("fonts/freemono.ttf"); }
  #error_cover { background-color: #1800F4; color: white; font-family: "Free Mono";
                 position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 10px; z-index: 99999999999; }
  a            { padding: 2px; color: red; text-decoration: underline; }
  a:hover      { cursor: pointer;  }`;
  document.body.appendChild(style);

  // Inject the cover element
  cover = document.createElement('div');
  cover.setAttribute('id', 'error_cover');
  cover.innerText  = tr('NightOS encountered a critical error and must restart. Please read the following message') + ' :\n\n' + message + '\n\n' + stack;
  cover.innerHTML += '<span id="restart">' + tr('The system will restart in') + ' <span id="cooldown">10</span> ' + tr('seconds') + '...&nbsp;</span>';

  // [Debug mode feature] Add a cancel link
  if(DEBUG_MODE) {
    let cancel = document.createElement('a');
    cancel.innerText = tr('Cancel');
    cancel.addEventListener('click', (event) => {
      // Cancel the cooldown
      clearInterval(interval);
      // Change the cooldown text
      document.getElementById('restart').innerHTML = tr('Restart was canceled') + '.';
      // Cancel the click
      event.preventDefault();
    });
    cover.querySelector('#restart').appendChild(cancel);
  }

  document.body.appendChild(cover);

  /** Define the cooldown
    * @type {number} */
  let cooldown = 10;

  /** Was the cooldown canceled ?
    * @type {boolean} */
  let canceled = false;

  // Define a cooldown callback
  let interval = setInterval(function() {
    // Decrease the cooldown
    cooldown -= 1;

    // Update the cover element
    document.getElementById('cooldown').innerText = cooldown.toString();

    // If the cooldown is over, restart NightOS.
    if(!cooldown)
      ipc.sendSync('reload');
  }, 1000);

  // Indicates to the error catcher to DON'T catch this one
  catchErrors = false;
  // Throw an error
  throw new Error(message);
};

/** Can errors be catched ?
  * @type {boolean} */
let catchErrors = true;

// Catch all error on the process
process.on('uncaughtException', function(err) {
  // If allowed to catch errors...
  if(catchErrors)
    // Redistribuate it to the 'error' function
    error((typeof tr !== 'undefined' ? tr('System crashed due to a runtime error') : 'System crashed due to a runtime error') + '.', err);
  else // Else, display it as an error into the console
    console.error(err);
});

/**
  * Debug interface
  * @constructor
  * @param {string} [message] The error message
  * @param {object} [args] The arguments
  * NOTE: Here we use a standard function instead of an arrow because arrow
  *       functions cannot be constructors.
  */
const NightError = function(message, args = {}) {
  // Declare some local variables
  /** The error stack
    * NOTE: The two removed lines are 'Error' and this line into the stack
    * @type {string} */
  let stack = (new Error()).stack.split('\n').slice(2).join('\n');

  // If only arguments were supplied, but no message...
  if(typeof message === 'object') {
    args    = message;
    message = 'An error occured';
  } else
  // Parse the error with the arguments
  if(args)
    message = message.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, $1) => args[$1]);

  // Protect the arguments
  Object.freeze(args);

  // If set in debug mode, log the error
  // The 'true' argument permit to have silent errors
  // Else the function will make a NightError in case of error, and that will
  // cause an infinite loop -> crash.
  if(DEBUG_MODE)
    Night.logError(message + (Reflect.ownKeys(args).length ? ' Details ' + JSON.stringify(args) : ''), true);

  /**
    * Get the error message
    * @returns {string}
    */
  this.__defineGetter__('message', () => message);

  /**
    * Get the error arguments
    * @returns {array|void}
    */
  this.__defineGetter__('arguments', () => args);

  /**
    * Get the execution stack
    * @returns {string}
    */
  this.__defineGetter__('stack', () => stack);

  // Freeze the instance
  Object.freeze(this);
};
