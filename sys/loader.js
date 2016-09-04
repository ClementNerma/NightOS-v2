/*
  This file is the system loader. It load all the system script files, and
  manage the applications launching.
  That's the most powerful program in NightOS, excepted the Electron launcher
  this is the script that can do the more things, even though it won't do them.
*/

'use strict';

/** The system files to load
  * @type {array} */
let load = [
  // Load the loading screen
  "main-process/loading-screen",
  // Load the debug programming interface
  "debug",
  // Initialize the system resources and the IPC communication
  "jsinit",
  // Define some system constants
  "constants",
  // Load the security manager
  "main-process/security",
  // Load the translation library
  "translate",
  // Load the virtual document parser
  "doc-parser",
  // Load the windows and modals manager
  "main-process/window",
  // Load the main system program
  "night",
  // Load the UI
  "main-process/ui",
  // Load the startup manager
  "main-process/startup"
];

/**
  * Load the next script (from the 'load' array)
  * @returns {void}
  */
function loadScript() {
  // The last file will run this function too when the load will be finished
  // so we check the array's length. If the array is empty...
  if(!load.length)
    return ;

  /** The script's name, needed for the 'error' event's callback
    * @type {string} */
  let current = load.shift();

  // If this is the child process and the current script is a main process' one,
  // ignore it and load the next script.
  if(IS_CHILD && current.startsWith('main-process/'))
    return loadScript(); // no value returned here (loadScript is typed 'void')

  // If this is the main process...
  if(IS_MAIN && typeof loading_text !== 'undefined') {
    // Update the loading text
    loading_text.innerHTML = `Loading file sys/${current}.js`;
  }

  /** The DOM element for the script
    * @type {Element} */
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', current + '.js');
  // When the script's loading is finished, we load the next script
  script.addEventListener('load', loadScript);
  // If the script fails to load...
  script.addEventListener('error', () => {
    // If the system's 'error' function is defined...
    // The child processes don't use the 'error' function to permit the errors
    // translation.
    if(IS_CHILD) {
      // Send a signal to the main process
      require('electron').ipcRenderer.sendToHost('error', 'Failed to read the system file "${current}"', null, {current});
      process.exit();
    } else if(typeof error !== 'undefined')
      // Call it
      error(`Failed to read the system file "${current}"`);
    else // If this function doesn't exist...
      // Send a signal to Electron
      require('electron').ipcRenderer.sendSync('fatal-error', ['Error at load', `Failed to read the system file "${current}"`]);
  });
  // Append the element to the DOM to start the loading
  document.body.appendChild(script);
}

// We define the process type constants here because if we are into the main
// process it will be necessary to declare them into the global scope.
/** Is this the main process ?
  * @type {boolean} */
window.IS_MAIN = !document.body.getAttribute('process-child');

/** Is this a child process ?
  * @type {boolean} */
window.IS_CHILD = !IS_MAIN;

if(IS_CHILD) {
  /** Store the 'childReady' content
    * @type {object} */
  window.childReady = message;
  // Load the 'app-process' file which will run the application
  load.push('app-process');
}

// Load the first script
loadScript();
