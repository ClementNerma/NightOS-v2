/*
  This file is the system module. It can only be used by the applications
  launched with system privileges.
*/

// If the application is not launched with system privileges...
if(runtime.ticket.level < ROOT_LEVEL)
  // Throw an error
  error(tr('System privileges are required to access the "system" module'));

// Give the 'process' access
$export.process = process;
// Give the 'window' access
$export.window = window;

/** Loading scripts
  * @type {object} */
let scripts = {};

/**
  * Load a script into the main process
  * @param {string} path
  * @param {function} [errorCallback] Runned when the script failed to load
  * @param {function} [loadCallback] Runned when the script loaded successfully
  * @returns {void}
  */
$export.loadScript = (path, errorCallback, loadCallback) => {
  scripts[path] = [errorCallback, loadCallback];
  ipc.sendToHost('load-script', path);
};

// When a script is loaded
ipc.on('script-loaded', (event, path, state) => {
  /*// If the script failed to load
  if(!state) {
    // Run the error callback
    if(scripts[path][0])
      scripts[path][0]();
  } else { // If the script loaded successfully
    // Run the success callback
    if(scripts[path][1])
      scripts[path][1]();
  }*/

  if(scripts[path][state ? 1 : 0])
    scripts[path][state ? 1 : 0]();

  delete scripts[path];
});
