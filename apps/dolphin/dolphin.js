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

/** The web page's document
  * @type {Document} */
const document = require('system').window.document;

/** The translation function
  * @type {function} */
const tr = translate.translate;

/** The translation package path
  * @type {string} */
let tr_path = fs.makeAbsolute('translations/' + translate.language + '.ntp');

// If the translation was not loaded and a package exists for this language...
if(!translate.loaded(tr_path) && fs.fileExists(tr_path) === true) {
  // Load the translation package
  error = translate.load(tr_path);
  // If an error occured
  if(e(error))
    // Make it fatal
    debug.error(`Failed to load the translation package for "${translate.language}"`, error);
}

// If the application was loaded as a launcher...
// This part will be done in a next NightOS update
