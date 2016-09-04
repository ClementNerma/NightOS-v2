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

  /**
    * Display a context menu
    * @param {object} elements
    * @param {number} [Y]
    * @param {number} [X]
    * @returns {void}
    */
  this.showContextMenu = (elements, Y = null, X = null) => {
    // e.g. elements = { Copy: function() { ... }, Cut: function() { ... }, "Select All": ... }
    // Reset the context menu's content
    ctx_menu.innerHTML = '';

    // For each element in the collection...
    for(let name of Reflect.ownKeys(elements)) {
      /** Element's DOM
        * @type {Element} */
      let div = document.createElement('div');
      div.innerText = name;
      div.addEventListener('click', elements[name]);
      ctx_menu.appendChild(div);
    }

    // Set the menu's position (if asked for)
    if(Y !== null)
      ctx_menu.style.top = Y + 'px';

    if(X !== null)
      ctx_menu.style.left = X + 'px';

    // Show the menu
    ctx_menu.classList.remove('invisible');
  };

  /**
    * Hide the context menu
    * @returns {void}
    */
  this.hideContextMenu = () => {
    // If the context menu is visible...
    if(!ctx_menu.classList.contains('invisible'))
      // Hide it
      ctx_menu.classList.add('invisible');
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

/** The webview container
  * @type {Element} */
let w_container;

/** The webview cover
  * @type {Element} */
let w_cover;

/** The context menu container
  * @type {Element} */
let ctx_menu;

// All the UI code is runned into an IIFE to isolate the local variables.
// These variables are useless for the system and may polluate the global object
// if they are not isolated.

(function() {
  // Load the system stylesheets
  loadStylesheet('font-awesome');
  loadStylesheet('main');
  loadStylesheet('fonts');

  w_container = document.createElement('div');
  w_container.setAttribute('id', 'webview-container');
  document.body.appendChild(w_container);

  w_cover = document.createElement('div');
  w_cover.setAttribute('id', 'webview-cover');
  document.body.appendChild(w_cover);

  ctx_menu = document.createElement('div');
  ctx_menu.setAttribute('id', 'context-menu');
  // Make the context menu invisible by default
  ctx_menu.className = 'invisible';
  document.body.appendChild(ctx_menu);

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
