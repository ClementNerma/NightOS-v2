/*
  The dolphin application. It includes a file explorer and a system launcher.
*/

// This declaration is useless because NightOS enable the strict mode in all
// applications, but that's a conventionnal way. Please note that the strict
// mode may be disabled by default in the future.
'use strict';

/** An object to store temporarily some errors
  * @type {void|NightError} */
let error;

/** The debug interface
  * @type {object} */
const debug = require('debug');

/** The filesystem interface
  * @type {object} */
const fs = require('fs');

/** The translation interface
  * @type {object} */
const translate = require('translate');

/** The timer interface
  * @type {object} */
const timer = require('timer');

/** The system module
  * @type {object} */
const system = require('system');

/** The web page's document
  * @type {Document} */
const document = system.window.document;

/** The translation function
  * @type {function} */
const tr = translate.translate;

// If the application was loaded as a launcher...
if(runtime.arguments.launcher) {
  debug.log('Running dolphin launcher...');

  // Run the launcher's file in the global's context
  system.loadScript(runtime.path + '/launcher.js', () => {
    debug.error(tr('Failed to load the launcher file'));
  });
} else {
  /** The translation package path
    * @type {string} */
  // NOTE: We load the translation only here because the launcher will have
  //       to load it by itself (translations are not synchronous between
  //       main and child processes)
  let tr_path = fs.makeAbsolute('translations/' + translate.language + '.ntp');

  // If the translation was not loaded and a package exists for this language...
  if(!translate.loaded(tr_path) && fs.fileExists(tr_path) === true) {
    // Load the translation package
    error = translate.load(translate.language, tr_path);
    // If an error occured
    if(e(error))
      // Make it fatal
      debug.error(`Failed to load the translation package for "${translate.language}"`, error);
  }

  /** The dolphin's explorer file
    * @type {string|NightError} */
  let content = fs.readFile('explorer.js');

  // If the reading failed...
  if(e(content))
    // Make it fatal
    debug.error(tr('Failed to load the explorer script'), content);
}
