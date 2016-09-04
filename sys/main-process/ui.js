/*
  This file loads the main frame and manage all the User Interface (UI).
  It also makes a library to use the main frame's content (DOM).
*/

'use strict';

/**
  * The UI class
  * @type {UI}
  */
const UI = (new (function() {

  /**
    * Display an error as a dialog box
    * @param {string|NightError} title
    * @param {string} [message] Can be omitted if 'title' is a <NightError>
    * @returns {void}
    */
  this.showError = (title, message) => {
    if(title instanceof NightError) {
      message = title.message;
      title   = tr('An error has occured');
    }

    // TODO: Show the dialog box
    console.error('ERROR BOX' + '\n' + title + '\n' + message);
  };

})());

/**
  * Load a stylesheet
  * @param {string} name
  * @returns {void}
  */
function loadStylesheet(name) {
  /** The windows stylesheet
    * @type {string} */
  let stylesheet;

  // Try to load it
  try { stylesheet = fs.readFileSync(n('/sys/style/' + name + '.css', true), SYSTEM_ENCODING); }
  // If fail...
  catch(e) { error(tr('Failed to load the ' + name + ' stylesheet'), e); }

  // Make a DOM element
  /** The windows stylesheet DOM element
    * @type {Element} */
  let style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = stylesheet;
  document.body.insertBefore(style, document.body.firstChild);
}

// All the UI code is runned into an IIFE to isolate the local variables.
// These variables are useless for the system and may polluate the global object
// if they are not isolated.

(function() {
  // Load the system stylesheets
  loadStylesheet('font-awesome');
  loadStylesheet('fonts');
  loadStylesheet('main');

  /** The webview container
    * @type {Element} */
  let w_container = document.createElement('div');
  w_container.setAttribute('id', 'webview-container');
  document.body.appendChild(w_container);

  /** The webview cover
    * @type {Element} */
  let w_cover = document.createElement('div');
  w_cover.setAttribute('id', 'webview-cover');
  document.body.appendChild(w_cover);

  // Find the launcher
  let launcher = Night.readRegistry('ui/launcher');

  // If no launcher was specified
  if(typeof launcher !== 'object' || !launcher.application)
    error(tr('No launcher defined. Please define one and restart NightOS.'));

  // Run the launcher with its arguments
  /** The launch's result
    * @type {void|NightError} */
  let result = Night.launchApplication(launcher.application, {
    ticket: {'*': true},
    arguments: launcher.arguments || {},
    level: ROOT_LEVEL
  }, true);

  // If launch failed...
  if(e(result))
    error(result.message, result.arguments.jsError);
})();
