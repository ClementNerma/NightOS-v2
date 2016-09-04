'use strict';

(function() {
  /*
   * =======================================
   * =====                             =====
   * =====          Launcher           =====
   * =====                             =====
   * =======================================
   */

  /** The dolphin's path
    * @type {string} */
  let path = document.currentScript // Get the current <script> element
              .getAttribute('src')  // Get it's source (e.g. /apps/dolphin/launcher.js)
              .split(SEP_REGEXP)    // Split by separators
              .slice(0, -1)         // Remove the last part (the launcher's name)
              .join('/');           // Join by slah (result e.g. /apps/dolphin)

  // Load the launcher's stylesheet
  /** The windows stylesheet
    * @type {string} */
  let stylesheet;

  // Try to read the file
  try { stylesheet = fs.readFileSync(n(path + '/' + 'launcher.css', true), SYSTEM_ENCODING); }
  // If the opening fails...
  catch(e) { error(tr('Failed to load the launcher stylesheet'), e); }

  // Make a DOM element
  /** The windows stylesheet DOM element
    * @type {Element} */
  let style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = stylesheet;
  document.body.appendChild(style);

  // Make the windows container visible
  wdock.style.display = 'block';

  // Load the translation
  /** The translation package path
    * @type {string} */
  let tr_path = n(path + '/translations/' + language + '.ntp', true);

  // Try to check if the file exists...
  try {
    // If the file exists...
    if(fs.lstatSync(tr_path).isFile()) {
      // Load the translation package
      let err = Night.require('translate', { ticket: { '*': true } }).load(language, tr_path);
      // If an error occured
      if(e(err))
        // Make it fatal
        // This sentence is translated in the system's native translations
        // packages because it permit applications to display a loading error
        // for their own packages.
        error(tr('Failed to load the translation package for "${language}"', {language}), err);
    }
  } catch(e) {}

  /* =====================
   * = Launcher elements =
   * ===================== */

  /** The launcher element
    * @type {ELement} */
  let launcher = document.createElement('div');
  launcher.setAttribute('id', 'launcher');
  document.body.appendChild(launcher);

  /** The task bar
    * @type {ELement} */
  let taskbar = document.createElement('div');
  taskbar.setAttribute('id', 'taskbar');
  document.body.appendChild(taskbar);

  /** The notifications area
    * @type {Element} */
  let notifications = document.createElement('div');
  notifications.setAttribute('id', 'notifications');
  taskbar.appendChild(notifications);

  /** The desktop view button
    * @type {Element} */
  let desktopView = document.createElement('span');
  desktopView.setAttribute('id', 'desktop-view');
  desktopView.setAttribute('title', tr('View the desktop'));
  // View the desktop by minimizing all windows when the desktop viewer
  // button is clicked.
  desktopView.addEventListener('click', () => {
    // If all windows are minimized...
    let minimized = true;

    for(let id of Reflect.ownKeys(Windows))
      if(!Windows[id].is('minimized')) {
        minimized = false;
        break;
      }

    for(let id of Reflect.ownKeys(Windows))
      // ... display them all ...
      if(minimized)
        Windows[id].foreground();
      else
      // ... else minimize them all
        Windows[id].minimize();
  });

  notifications.appendChild(desktopView);

  /** The clock element
    * @type {Element} */
  let clock = document.createElement('span');
  clock.setAttribute('id', 'clock');
  notifications.appendChild(clock);

  /** Update the clock
    * @returns {void} */
  let updateClock = () => clock.innerText = (new Date()).toLocaleTimeString() + '\n' + (new Date()).toLocaleDateString();

  // Update the clock
  updateClock();

  // Set a time interval for the clock
  setInterval(updateClock, 1000);

  // Put an event when a new window is made...
  onWindowMade = ($win, el) => {
    el.style.top  = '60px';
    el.style.left = '40px';

    // Make a <div> element in the taskbar for this window
    /** The taskbar element
      * @type {Element} */
    let task = document.createElement('div');

    /** Was the window closed ?
      * @type {boolean} */
    let closed = false;

    // When the task is clicked...
    task.addEventListener('click', () => {
      // If the window was removed...
      if(closed)
        return ;

      // If the window is the active one...
      if($win.is('active'))
        // Minimize it
        $win.minimize();
      else // Else...
        // Make it the active window
        $win.foreground();
    });

    // When the task is "right-clicked"...
    task.addEventListener('contextmenu', event => {
      // Make a context menu
      /** The context menu elements
        * @type {object} */
      let menu = {};

      // NOTE: Here the usage of 'NOT' conditions permit to put the buttons that
      //       make the window in a new state. The 'maximize' button have to
      //       appear when the window is restored but also when the window is
      //       minimized !

      // If the window is NOT restored...
      if(!$win.is('restored'))
        // Add a 'restore' button
        menu['Restore'] = () => $win.restore();

      // If the window is NOT maximized...
      if(!$win.is('maximized'))
        // Add a 'maximize' button
        menu['Maximize'] = () => $win.maximize();

      // If the window is NOT minimized...
      if(!$win.is('minimized')) {
        // Add a 'minimize' button...
        menu['Minimize'] = () => $win.minimize();
        // And a 'highlight' button
        menu['Highlight'] = () => {
          // Make the window visible
          $win.foreground();
          // Change the titlebar's background color
          el.children[0].style.backgroundColor = '#0059B3';
          // WHen the 'backgroundColor' property is reset, the browser uses the
          // defined CSS rules, so the original background color is restored.
          setTimeout(() => el.children[0].style.backgroundColor = '', 3000);
        };
      }

      // Add a 'close' button
      menu['Close'] = () => $win.close();

      // Show the context menu
      UI.showContextMenu(menu, event.screenY, event.screenX);
    });

    task.className = 'task';
    taskbar.appendChild(task);

    /** The content element
      * @type {Element} */
    let content = document.createElement('span');
    content.setAttribute('title', $win.getTitle());
    content.innerText = $win.getTitle();
    content.className = 'content';
    task.appendChild(content);

    /** The close element
      * @type {Element} */
    let close = document.createElement('span');
    close.setAttribute('title', tr('Close the window'));
    close.className = 'fa fa-times close';
    task.appendChild(close);

    // Close the window when the close button is clicked
    close.addEventListener('click', () => $win.close());

    // Mark the task when the window is minimized...
    $win.on('minimized', () => task.classList.add('minimized'));

    // Change the element's appearance when the window is made active...
    $win.on('foreground', () => {
      // Mark the task as active
      task.classList.add('active');
      // Unmark the task
      task.classList.remove('minimized');
    });

    // or inactive
    $win.on('background', () => task.classList.remove('active'));

    // Update the element when the title changes
    $win.on('title-changed', ($win, title) => {
      // Update the title in the taskbar
      content.innerText = title;
      // Update the title in the task's tooltip
      content.setAttribute('title', title);
    });

    // Remove the element when the window is closed
    $win.on('closed', () => { task.remove(); closed = true; });

    // Hide the task when the window is hidden...
    $win.on('hidden', () => task.classList.add('invisible'));

    // And show it when the window is shown
    $win.on('shown', () => task.classList.remove('invisible'));

    // If the window is visible...
    if(!$win.is('invisible'))
      // Trigger the 'foreground' event
      $win.trigger('foreground');
    else // Else... (invisible)
      // Trigger the 'hidden' event
      $win.trigger('hidden');
  };

  // Display the desktop
  launcher_cover.remove();

  /*
   * =======================================
   * =====                             =====
   * =====           Desktop           =====
   * =====                             =====
   * =======================================
   */

  /** The 'dolphin' library code
    * @type {string|NightError} */
  const lib = Night.requireSharedLibrary('dolphin');

  // If the reading failed...
  if(e(lib))
    error(tr('Failed to open the dolphin\'s shared library'), lib);

  // Run the library
  // Make a 'require' function with all-powerful ticket
  eval('let require=(name)=>Night.require(name,{ticket:{"*":true}});' + lib);
})();
