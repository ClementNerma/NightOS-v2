/*
  This file manage the windows and modal dialogs.
*/

'use strict';

/** The windows and modals container
  * @type {Element} */
// NOTE: Because this file is loaded before 'UI' which created the 'windock'
//       element on the main frame, this variable will have the 'null' content
//       until 'UI' set it. This is why 'wdock' is set as non-constant.
let wdock /* Windows Dock */ = document.body;

/** A counter for windows identifier
  * @type {number} */
let wdock_id = 0;

/** A counter for windows z-index property
  * @type {number} */
let zid = 0; // Z-index Identifier

/** A callback called when a new window is made
  * @type {void|function} */
let onWindowMade;

/** All windows
  * @type {object} */
let Windows = {};

/**
  * The window class
  * @param {object} options
  * @constructor
  */
const NWindow = function(options) {
  // Check the options
  if(typeof options !== 'object')
    error('Illegal argument supplied for NWindow : Needs to be an object');

  // Check the buttons
  if(typeof options.buttons !== 'undefined' && !Array.isArray(options.buttons))
    error('Illegal argument supplied for NWindow : Buttons needs to be an array');

  /** The window ID
    * @type {number} */
  const id = wdock_id++;

  // Register the window
  Windows[id] = this;

  /** The events
    * @type {object} */
  let events = {};

  /** The restore dimensions
    * @type {object} */
  let rest_dim;

  /** The DOM element of the window
    * @type {Element} */
  let win = document.createElement('div');
  win.setAttribute('id', `win-${id}`);
  win.setAttribute('night-role', 'win');
  win.className = 'night-window invisible';

  /** The DOM element for the title bar
    * @type {Element} */
  let title = document.createElement('div');
  title.className = 'night-window-title';
  win.appendChild(title);

  /** The DOM element for the title bar's content
    * @type {Element} */
  let titleContent = document.createElement('span');
  titleContent.className = 'night-window-title-content';
  titleContent.innerText = options.title || tr('Untitled');
  title.appendChild(titleContent);

  /** The DOM element for the title bar's buttons
    * @type {Element} */
  let titleButtons = document.createElement('span');
  titleButtons.className = 'night-window-title-buttons';
  title.appendChild(titleButtons);

  /** The DOM element for the frame
    * @type {Element|NightDocument} */
  let frame;

  // Append the window to the container
  wdock.appendChild(win);

  if(!options.forbidDOM) {
    // Set up the frame
    frame           = document.createElement('div');
    frame.className = 'night-window-frame';
    frame.innerHTML = options.content || '';
    win.appendChild(frame);
  } else {
    /** The frame's NightDocument
      * @type {NightDocument} */
    frame = new NightDocument(frame, 'div', true);
    /** The document's tree
      * @type {NightElement} */
    let tree       = frame.tree;
    tree.className = 'night-window-frame';
    tree.innerHTML = options.content || '';
    tree.appendTo(win);
  }

  // Define a getter for the frame element
  this.__defineGetter__('frameElement', () => frame);

  /**
    * Display the window
    * @returns {void}
    */
  this.show = () => {
    // If the window was not visible...
    if(win.classList.contains('invisible')) {
      // Show it
      win.classList.remove('invisible');
      // Trigger the event
      this.trigger('visible');
    }
  };

  /**
    * Hide the window
    * @returns {void}
    */
  this.hide = () => {
    // If the window was visible...
    if(!win.classList.contains('invisible')) {
      // Hide it
      win.classList.add('invisible');
      // Trigger the event
      this.trigger('hidden');
    }
  };

  /**
    * Check the state of the window
    * @param {string} state
    * @returns {boolean}
    */
  this.is = state => state !== 'night-window' && win.classList.contains(state);

  /**
    * Maximize the window
    * @returns {void}
    */
  this.maximize = () => {
    // If the window was already maximized...
    if(win.classList.contains('maximized'))
      return ;

    // Backup the window's dimensions
    rest_dim = { top: win.style.top, left: win.style.left, right: win.style.right, bottom: win.style.bottom };
    // Remove the old classes
    win.classList.remove('minimized');
    win.classList.remove('restored');
    // Change the window's CSS rules
    win.style.top    = 0;
    win.style.left   = 0;
    win.style.right  = 0;
    win.style.bottom = 0;
    // And for the frame
    (frame.tree || frame).style.bottom = 0;
    // Add a class marker
    win.classList.add('maximized');
    // Trigger the event
    this.trigger('maximized');
  };

  /**
    * Restore the window
    * @returns {void}
    */
  this.restore = () => {
    // If the window was already restored...
    if(win.classList.contains('restored'))
      return ;

    // Remove the old classes
    win.classList.remove('minized');
    win.classList.remove('maximized');
    // Restore the window's dimensions
    win.style.top    = rest_dim.top;
    win.style.left   = rest_dim.left;
    win.style.right  = rest_dim.right;
    win.style.bottom = rest_dim.bottom;
    // And for the frame
    (frame.tree || frame).style.bottom = '';
    // Add a class marker
    win.classList.add('restored');
    // Trigger the event
    this.trigger('restored');
  };

  /**
    * Check if the window is hidden
    * @returns {boolean}
    */
  this.isHidden = () => win.classList.contains('invisible');

  /**
    * Make the window active
    * @returns {void}
    */
  this.foreground = () => {
    // If the window was closed !
    if(!win) return ;

    // If the window is already active...
    if(win.classList.contains('active'))
      // Exit
      return ;

    // Make the active window unactive
    /** The active window
      * @type {void|Element} */
    let active = wdock.querySelector('.night-window.active');
    // Here we use a condition to check if there is an active window
    if(active) {
      active.classList.remove('active');
      // Trigger its 'background' event
      Windows[active.getAttribute('id').substr(4) /* remove 'win-' */].trigger('background');
    }

    // Make the window active
    win.style.zIndex = ++zid;
    win.classList.add('active');
    // Trigger the event
    this.trigger('foreground');
  };

  /**
    * Set the window's title
    * @param {string} title
    * @returns {void}
    */
  this.setTitle = (title) => {
    // If the title is vaild...
    if(typeof title === 'string' || typeof title === 'number') {
      // Change the title
      titleContent.innerText = title;
      // Trigger the event
      this.trigger('title-changed', title);
    }
  };

  /**
    * Get the window's title
    * @returns {string}
    */
  this.getTitle = () => titleContent.innerText;

  /**
    * Set the callback for an event
    * @param {string} name
    * @param {function} callback
    * @returns {number} The callback ID
    */
  this.on = (name, callback) => {
    // Check the arguments
    if(typeof name !== 'string' || typeof callback !== 'function')
      return false;

    // If no callback is set for this event...
    if(!events.hasOwnProperty(name))
      events[name] = [];
    // Set the callback
    events[name].push(callback);
    // Success !
    return events[name].length;
  };

  /**
    * Remove the callback for an event
    * @param {string} name
    * @param {number} [id] ID of the callback, if omitted all callbacks will be deleted
    * @returns {boolean}
    */
  this.off = (name, id = null) => {
    // If no ID was specified...
    if(!id) {
      // Remove all callbacks for this event...
      delete events[name]
      // Success !
      return true;
    }

    // Else, if no callback is set for this event
    // OR if the given identifier does not refer to an existing callback...
    if(!events.hasOwnProperty(name) || !events[name][id - 1])
      // Failed !
      return false;

    // Remove the callback
    // We can't delete it because it's contained into an array
    // But using an object would be too slow so we use this way.
    events[name][id - 1] = null;

    // Success !
    return true;
  };

  /**
    * Trigger an event
    * @param {string} name
    * @param {object} [parameter]
    * @returns {boolean}
    */
  this.trigger = (name, parameter) => {
    // If no callback was set for this event...
    if(!events.hasOwnProperty(name) || !events[name].length)
      return false;

    // For each callback set...
    for(let callback of events[name])
      // If this is a function (that can be the 'null' value is that's a removed
      // callback)...
      if(callback)
        // Run it with the given parameter (if there is one)
        callback(this, parameter);

    // Success !
    return true;
  };

  /**
    * Add a new button
    * @param {string} name
    * @param {string} iconName
    * @param {function} callback
    * @param {string} [title] The title of the button, displayed when the mouse stays on it
    * @param {boolean} [hidden] Hide the button
    * @returns {boolean}
    */
  this.addButton = (name, iconName, callback, title, hidden = false) => {
    // Check the arguments
    if(iconName.split(' ').length > 1 || typeof name !== 'string' ||
       titleButtons.querySelector('[button-name="' + name + '"]') ||
       typeof callback !== 'function' || !/^[a-zA-Z0-9_]+$/.test(name) ||
       (typeof title !== 'undefined' && typeof title !== 'string'))
      return false;

    /** The button's element
      * @type {Element} */
    const button = document.createElement('span');
    button.className = 'fa fa-' + iconName;
    button.addEventListener('click', () => {
      callback(this);
    });
    if(title) button.setAttribute('title', title);
    titleButtons.appendChild(button);

    // If asked, hide the button
    if(hidden)
      this.hideButton(titleButtons.children.length - 1);

    // Success !
    return true;
  };

  /**
    * Show a button
    * @param {number} index
    * @returns {boolean}
    */
  this.showButton = (index) => {
    // Check if the index refers to an existing button element
    if(typeof index !== 'number' || !titleButtons.children[index])
      return false;

    // If the button is not already visible...
    if(titleButtons.children[index].classList.contains('invisible'))
      // Show it
      titleButtons.children[index].classList.remove('invisible');

    // Success !
    return true;
  };

  /**
    * Hide a button
    * @param {number} index
    * @returns {boolean}
    */
  this.hideButton = (index) => {
    // Check if the index refers to an existing button element
    if(typeof index !== 'number' || !titleButtons.children[index])
      return false;

    // If the button is not already hidden...
    if(!titleButtons.children[index].classList.contains('invisible'))
      // Hide it
      titleButtons.children[index].classList.add('invisible');

    // Success !
    return true;
  };

  /**
    * Remove a button
    * @param {string} name
    * @returns {boolean}
    */
  this.removeButton = (name) => {
    // Check the name
    if(typeof name !== 'string' || !/^[a-zA-Z0-9_]+$/.test(name))
      return false;

    /** The button's element
      * @type {Element|void} */
    let element = titleButtons.querySelector('[button-name="' + name + '"]');

    // If the element doesn't exist...
    if(!element)
      return false;

    // Else, remove it
    element.remove();
    // Success !
    return true;
  };

  /**
    * Close the window
    * @returns {void}
    */
  this.close = () => {
    // Remove the element
    win.remove();
    // Unreference all variables
    win          = null;
    title        = null;
    titleContent = null;
    titleButtons = null;
    // Trigger the event
    this.trigger('closed');
    // Success !
  };

  // For each buttons specified in the options...
  for(let button of options.buttons || []) {
    if(typeof button !== 'object' || !button.name || !button.iconName ||
       !button.callback)
      error('Illegal argument supplied for NWindow : Button needs to be an object with "name", "iconName" and "callback" fields');

    this.addButton(button.name, button.iconName, button.callback, button.hidden);
  }

  // If asked, show the window
  if(options.visible)
    this.show();

  // Make the window draggable
  if(options.draggable !== false) {
    title.addEventListener('mousedown', event => {
      // Make the window active
      this.foreground();
      // Set this window as the dragging target
      dragging = win;

      // Run this function when the dragging starts.
      draggingStarts = () => {
        // The window needs to be restored, like Windows do, but only when the
        // dragging starts.
        if(this.is('maximized')) {
          this.restore();
          // Move the windows to adapt to the cursor's position, else the window
          // will move to the cursor's position (the cursor will be at the top
          // left corner of the window).
          win.style.top  = 0;
          win.style.left = 0;
        }
      };

      fromX = event.clientX;
      fromY = event.clientY;

      fromTop    = parseInt(win.style.top.substr(0, win.style.top.length - 2) || '0');
      fromLeft   = parseInt(win.style.left.substr(0, win.style.left.length - 2) || '0');
      fromRight  = parseInt(win.style.right.substr(0, win.style.right.length - 2) || '0');
      fromBottom = parseInt(win.style.bottom.substr(0, win.style.bottom.length - 2) || '0');
    });

    title.addEventListener('mouseup', event => {
      dragging = null;
    });
  }

  // Add a click callback
  title.addEventListener('click', () => {
    // Make the window active
    this.foreground();
  });

  // Make this window active
  if(!options.background)
    this.foreground();

  // Restore the window
  win.classList.add('restored');

  // Freeze this object
  Object.freeze(this);

  // Trigger the 'made' event
  if(onWindowMade)
    onWindowMade(this, win);
};

let fromX, fromY, fromTop, fromLeft, fromRight, fromBottom, dragging,
    draggingStarts;

document.body.addEventListener('mousemove', event => {
  if(dragging) {
    if(draggingStarts) {
      draggingStarts();
      draggingStarts = null;
    }

    dragging.style.top  = (fromTop  + (event.clientY - fromY)) + 'px';
    dragging.style.left = (fromLeft + (event.clientX - fromX)) + 'px';
  }
});
