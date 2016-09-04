/*
  This file is only runned in application processes. It launch the application
  and manage its VM.
*/

'use strict';

// Get the application's launcher
/** The application's main file
  * @type {string} */
let mainFile;

// Normalize the index path, that permit to prevent from "./../sys/...js"
// usage for example
/** The index path
  * @type {string} */
let indexPath = Night.normalize('/' + childReady.runtime.index);

// Try to read the main file
try { mainFile = fs.readFileSync(Night.normalize('/apps/' + childReady.name + indexPath, true), childReady.runtime.package.encoding || SYSTEM_ENCODING); }
// If fail...
catch(e) { error(tr('Can\'t get the application\'s main file for "${name}" (${index})', {name: childReady.name, index: childReady.runtime.index.substr(1)})); }

// Prepare the script's environment

/** The VM module
  * @type {object} */
const vm = require('vm');

/** The VM's sandbox
  * @type {object} */
const sandbox = {
  runtime: childReady.runtime,
  require: name => Night.require(name, childReady.runtime),
  e, n, NighError, NightElement, NightDocument
};

// Freeze the sandbox. The object's freeze is removed when it's passed using
// IPC.
deepFreeze(sandbox);

/** The VM's context
  * @type {object} */
const context = new vm.createContext(sandbox);

// The VM's script
// The script is not declared as a constant because we'll assign its value into
// the try/catch block below. When 'vm.Script' is instanciated with a script
// that contains a Syntax Error, that throws a JavaScript native error which
// stops the script, so we have to catch this error.
let script;

// Make the script's VM encapsulated in an IIFE for better performances, with
// strict mode too.
try { script = new vm.Script(`"use strict";(function(){${mainFile}})();`, { filename: '/apps/' + childReady.name + indexPath }); }
catch(e) {
  ipc.sendToHost('error', 'Syntax error in the "${name}" application\'s main file', {
    message: e.message,
    stack  : e.stack
  }, {name: childReady.name});
}

// Run the script !
script.runInContext(context);
