/*
  This is the main NightOS file. It contains a lot of system functions, manage
  the windows, the entire interface, the processes, the filesystem, the
  applications, and a lot of other things.

  The 'Night' object cannot be accessed by the applications, only by the system
  and by the modules. The modules can use it to access to some system parts
  safely and do some system stuff like modify the registry.
*/

'use strict';

/** Counter for the application process ID
  * @type {number} */
let AID = -1

/** The application processes instances (ChildProcess instances)
  * @type {array} */
let processes = [];

/** Define the NightOS variables
  * @type {object} */
let shell_vars = {
  SYSTEM_ENCODING: SYSTEM_ENCODING,
  DS             : DS,
  BASE_DIR       : BASE_DIR,
  FIRST_RUN      : FIRST_RUN
};

/**
  * The main NightOS programming interface
  * @type {object}
  */
const Night = (new (function() {
  /**
    * Load a system module
    * @param {string} path
    * @param {object} runtime
    * @param {boolean} [ignoreCache] Force to load the module without cache
    * @returns {object}
    */
  this.require = (path, runtime, ignoreCache = false) => {
    // Backup the original path
    let o_path = path;

    // Format the path with Node.js native module, and with the NightOS function
    path = this.normalize('/sys/modules/' + path + '.js', true);

    /** The module's content
      * @type {string} */
    let content;

    // Read the cache (if not ignored)
    if(!ignoreCache && modules_cache.hasOwnProperty(path))
      // Use the cached content
      content = modules_cache[path];
    else {
      // Read the module's file
      try { content = fs.readFileSync(path, SYSTEM_ENCODING); }
      catch(e) { error(tr('Failed to load module "${path}"', {path: o_path}), e); }
    }

    // Cache the module, if it's not too big for the cache
    if(content.length <= MAX_MODULE_CACHE_LENGTH)
      modules_cache[path] = content;

    /** The module's 'this' object
      * @type {object} */
    let $export = {};

    // Run the module
    // NOTE: The module is runned in the global context, so it has a full access
    //       on the system (FileSystem, windows management)....
    //       That's a reason of why modules are contained in the /sys folder
    try {
      (function($export) {
        eval(content);
      }).apply($export, [$export])
      //new Function(['runtime'], content).apply(self, [runtime]);
      return $export;
    }

    catch(e) { return new NightError(tr('Error while running module "${path}"', {path: o_path}), e); }
  }

  // Define some local variables

  /** Cache for modules
    * @type {object} */
  let modules_cache = {};

  /** Make a system ticket (also called 'all-powerful ticket')
    * @type {object} */
  //let ticket = {'*': true};

  /** The registry's content
    * @type {object} */
  let registry;

  /* ===========================
   * = Define system functions =
   * =========================== */

  /**
    * Format a path
    * @param {string} path The path to format
    * @param {boolean|string} [systemBase] Add the system path (e.g. C:\...)
    * @param {string} [cwd] The current working directory for relative path normalization
    * @returns {string} The formatted path
    */
  this.normalize = (path, systemBase = false, cwd = null) => {
    // NOTE: The system separator is replaced by the '/' separator, excepted if
    //       the 'systemBase' argument is defined.

    /** The path to output
      * @type {array} */
    let out = [];

    // Support for 'undefined' given as a path
    path = path || '';
    // Convert all directory separators into slashes
    path = path.replace(SEP_REGEXP, '/');

    /** The system's path
      * @type {string} */
    let systemPath = (typeof systemBase === 'boolean' ? BASE_DIR : systemBase).replace(SEP_REGEXP, '/');

    /** Is it using the system path ?
      * @type {boolean} */
    let isSystem = systemBase && path.substr(0, systemPath.length) === systemPath;

    // Put the system path (if asked)
    // Split the path by seperators (here, slashes)
    // The '' part permit to work even if there is no path specified, else it would cause a fatal error
    path = ((systemBase && !isSystem ? systemPath + '/' : '') + (!path.startsWith('/') && typeof cwd === 'string' && !isSystem ? cwd + '/' : '') + path).split('/');
    //path = ((isSystem ? systemPath + '/' : '') + (!path.substr(0, 1).match(SEP_REGEXP) && typeof cwd === 'string' && !isSystem ? cwd : '') + path).split(SEP_REGEXP);

    for(let part of path) {
      if(part === '..')
        out.pop();
      else if(part && part !== '.')
        out.push(part);
    }

    if(!out.length)
      out.push('');
    else if(out[0] && !systemBase)
      out.unshift('');

    return out.join(systemBase ? DIR_SEP : '/');
  };

  /**
    * Parse a path with system variables and normalize it
    * @param {string} path The path to format
    * @param {boolean} [systemBase] Add the system path (e.g. C:\...)
    * @returns {string} The formatted path
    */
  this.parse = (path, systemBase = false) => {
    // Don't parse if the path is empty or if it's an 'undefined' value (null...)
    // We can use here a ternary condition and make the code of this function in
    // a single line, but that's really ugly to read, so I put here a condition.
    if(path)
      path = path.replace(/(#|\$)\{([a-zA-Z0-9_]+)\}/g, (m, h, name) => {
        return shell_vars.hasOwnProperty(name) ? shell_vars[name] : m;
      });

    return this.normalize(path, systemBase);
  };

  /**
    * Check if a folder is the parent of another
    * @param {string} parent The parent folder
    * @param {string} path The path supposed to be a child of the parent
    * @param {boolean} [acceptSame] Return true if the two paths are identicals
    * @returns {boolean}
    */
  this.isParent = (parent, path, acceptSame = false) => {
    parent = n(parent);
    path   = n(path);

    return path.substr(0, parent.length + 1) === parent + '/' || (acceptSame ? false : parent === path);
  };

  /**
    * Check if a ticket can perform an action
    * @param {object|string} ticket
    * @param {string} action
    * @param {string} [path] For HTTP/FS actions
    * @returns {boolean}
    */
  this.isAllowed = (ticket, action, path) => {
    if(typeof ticket !== 'object')
      return false;

    // The super-power ticket
    if(ticket['*'])
      return true;

    // Check the permission
    // Define some variables
    let slashIndex = action.indexOf('/'), group = action.substr(0, slashIndex),
        name = action.substr(group.length);

    // Check if the ticket has the permission
    let can = (ticket[group] && ticket[group].includes(name));

    // If the ticket doesn't have the permission, returns the result
    if(!can)
      return false;

    // We know at this point that the ticket has the asked right
    // If we're talking about the filesystem...
    if(group === 'file' || group === 'folder') {
      for(let folder of ticket.foldersAccess)
        if(this.isParent(folder, path) && this.requiredLevel(path) <= ticket.level)
          return true;

      return false;
    }
    // If we're talking about the HTTP communications...
    else if(group === 'http' || group === 'ftp') {
      for(let domain of ticket.domainsAccess)
        if(this.isParentDomain(domain, path))
          return true;

      return false;
    } else
      return true;
  };

  /**
    * Check the required running level for accessing a path
    * @param {string} path
    * @returns {number} The required level
    */
  this.requiredLevel = (path) => {
    path = this.normalize(path);

    // If it's into the /users/common folder
    if(this.isParent('/users/common', path) || this.isParent('/tmp', path))
      return GUEST_LEVEL;

    // If it's into the /users/$USERNAME folder
    if(username && this.isParent('/users/' + username, path))
      return USER_LEVEL;

    // If it's into the /users folder, or into the /apps folder
    if(this.isParent('/users', path) || this.isParent('/apps', path))
      return ADMIN_LEVEL;

    // Else...
    return ROOT_LEVEL;
  };

  /* ========
   * = Logs =
   * ======== */

  /**
    * Load an error
    * @param {string} message
    * @param {boolean} [silent] Don't make a <NightError>
    * @returns {NightError|boolean|void}
    */
  this.logError = (message, silent = false) => {
    // Try to append the message to the log file
    try { fs.appendFileSync(this.normalize('/sys/data/debug.log', true), `${Date.now()} [ERROR] ${message}\n`, SYSTEM_ENCODING); }
    // If fail...
    catch(e) { return !silent ? new NightError('Failed to write the log file', {jsError: e}) : false; }

    // Success !
    return !silent ? undefined : true;
  };

  /* ================
   * =   Registry   =
   * ================ */

  /**
    * Write the registry
    * @param {string} key
    * @param {string|number|boolean} value
    * @param {boolean} [recursive] Make inexistant branches
    * @returns {boolean} True if the operation worked
    */
  this.writeRegistry = (key, value, recursive = true) => {
    // If the given value is not valid...
    if(typeof key !== 'string' || !['string', 'number', 'boolean'].includes(typeof value))
      return false;

    /** The loop subject
      * @type {object} */
    let lp = registry;

    // Split the key into slashes
    key = key.split('/');

    // For each part (excepted the last)...
    for(let part of key.slice(0, -1)) {
      // If the branch doesn't exist...
      if(typeof lp[part] !== 'object') {
        // If set to recursive mode and that's an undefined value...
        // Because if it's a string or a number for example, that's a value, so
        // the program has failed.
        if(recursive && typeof lp[part] === 'undefined')
          lp[part] = {};
        else
          // Else, that's an error.
          return false;
      }

      // Get the new sub-object
      lp = lp[part];
    }

    // Write the entry
    // This part is not attached to the loop because here we write the object,
    // which is attached to 'registry'.
    lp[key.last()] = value;
    // Write the registry
    try { fs.writeFileSync(this.parse('/sys/data/registry.json', true), !DEBUG_MODE ? JSON.stringify(registry) : JSON.stringify(registry, null, 4), SYSTEM_ENCODING); }
    // If fail...
    catch(e) {
      if(DEBUG_MODE)
        this.showError('Failed to write the disk', 'Failed to write the registry file. Details :\n\n' + e.message);

      this.logError('Failed to write registry file', {error: e.message, stack: e.stack});
      return false;
    }

    // Success !
    return true;
  };

  /**
    * Read the registry
    * @param {string} key
    * @returns {string|number|boolean|void}
    */
  this.readRegistry = (key) => {
    /** The loop subject
      * @type {object} */
    let lp = registry;

    // Split the key into slashes. For each part...
    for(let part of key.split('/')) {
      // Get the new sub-object
      lp = lp[part];

      // If this part doesn't exist...
      if(typeof lp === 'undefined')
        return undefined;
    }

    // Return the result
    // Even if it's an object, we don't clone it here because modules can modify
    // the registry file.
    return lp;
  };

  /**
    * Reload the registry from the disk
    * @returns {void}
    */
  this.reloadRegistry = () => {
    // Load the registry
    try { registry = fs.readFileSync(this.parse('/sys/data/registry.json', true), SYSTEM_ENCODING); }
    // If fail...
    catch(e) { error(tr('Failed to load the registry file'), e); }
    // Parse the registry
    try { registry = JSON.parse(registry); }
    // If fail...
    catch(e) { error(tr('Registry is not a valid JSON file, parsing failed.\nPlease fix the registry file or run NightOS in recovery mode.'), e); }
  };

  /* ================
   * = Applications =
   * ================ */

  /**
    * Check if an application exists
    * @param {string} name
    * @returns {boolean}
    */
  this.appExists = (name) => {
    try { return JSON.parse(fs.readFileSync(this.normalize('/sys/data/apps.json', true), SYSTEM_ENCODING)).hasOwnProperty(name.toLowerCase()); }
    catch(e) { return false; }
  };

  /**
    * Launch an application
    * @param {string} name
    * @param {object} runtime
    * @param {boolean} [critical] If the application encounters an error, make a system crash
    * @returns {NightError|void}
    */
  this.launchApplication = (name, runtime, critical = false) => {
    // If no running level was specified...
    if(!runtime.level)
      return new NightError(tr('Running level is missing for "${name}"', {name}));

    // Lower-case the application's name
    name = name.toLowerCase();

    // Open the applications catalog
    // Here we don't use the @appExists function because we want to have details
    // if an error happens, and we also want to check if the application can be
    // runned as a system app (if asked by context.level === 5)

    /** The applications catalog
      * @type {string|object} */
    let catalog;

    // Try to open the catalog
    try { catalog = fs.readFileSync(this.normalize('/sys/data/apps.json', true), SYSTEM_ENCODING); }
    // If fail...
    catch(e) { return new NightError(tr('Failed to open the applications catalog'), {jsError: e}); }
    // Try to parse it
    try { catalog = JSON.parse(catalog); }
    // If fail...
    catch(e) { return new NightError(tr('Failed to parse the applications catalog : Not a valid JSON file'), {jsError: e}); }

    // Check if the application exists
    if(!catalog.hasOwnProperty(name))
      return new NightError(tr('This application does not exist "${name}"', {name}));

    // If system rights were asked, check if the application can be runned with
    // these rights.
    if(runtime.level >= 5 && !catalog[name].systemAllowed)
      return new NightError(tr('Application "${name}" cannot be runned with system privileges', {name}));

    /** The application's package
      * @type {string|object} */
    let pkg;

    // Try to open the package
    try { pkg = fs.readFileSync(this.normalize('/apps/' + name + '/package.json', true), SYSTEM_ENCODING); }
    // If fail...
    catch(e) { return new NightError(tr('Can\'t open the application\'s package for "${name}"', {name}), {jsError: e}); }
    // Try to parse it
    try { pkg = JSON.parse(pkg); }
    // If fail...
    catch(e) { return new NightError(tr('Can\'t parse the application\'s package for "${name}" : Not a valid JSON file', {name}), {jsError: e}); }

    // Get the application's launcher
    /** The application's main file
      * @type {string} */
    let mainFile;

    // Normalize the index path, that permit to prevent from "./../sys/...js"
    // usage for example
    /** The index path
      * @type {string} */
    let indexPath = this.normalize('/' + pkg.index);

    // Try to read the main file
    try { mainFile = fs.readFileSync(this.normalize('/apps/' + name + indexPath, true), pkg.encoding || SYSTEM_ENCODING); }
    // If fail...
    catch(e) { return new NightError(tr('Can\'t get the application\'s main file for "${name}" (${index})', {name, index: pkg.index})); }

    // Format the 'context' object
    // Set the ticket
    runtime.package = pkg;
    // Set the permissions
    runtime.ticket = runtime.ticket || pkg.permissions;
    // Set the running level
    runtime.ticket.level = runtime.level;
    // Set the arguments
    runtime.arguments = runtime.arguments || {};
    // Set the timestamp
    runtime.timestamp = Math.floor(window.performance.now());
    // Set the application's launching path
    runtime.path = `/apps/${name}`;
    // Add the main file path
    runtime.index = indexPath;
    // Add the AID to the runtime
    runtime.AID = ++AID;
    // Freeze the context object
    deepFreeze(runtime);

    // Make a <webview> element to run a new process
    // NOTE : <webview> are invisibles. If the webview become visible it will be
    // displayed as a window.
    let webview = document.createElement('webview');
    // Allow the Node.js modules usage into the child process
    webview.setAttribute('nodeintegration', '');
    // Load the HTML page, and add a child indicator
    // That allow the page to know it is runned into a child proces
    webview.setAttribute('src', 'framework.html?child=true');
    // If the webview fails to load...
    webview.addEventListener('did-fail-load', () => {
      // Remove the <webview> and stop the process
      webview.remove();

      /** The error message
        * @type {string} */
      let message = tr('Failed to load system resources for application "${name}". Please try again.', {name});

      // Display it
      if(critical)
        error(message);
      else
        this.makeErrorModal(tr('Application "${name}" crashed', {name}), message);
    });
    // When a console message is received from the webview...
    webview.addEventListener('console-message', e => {
      console.log('[GUEST] ' + e.message);
    });
    // When the webview loaded successfully...
    webview.addEventListener('did-stop-loading', () => {
      webview.send('ready', {
        name: name,
        argv: argv,
        systemEncoding: SYSTEM_ENCODING,
        runtime: runtime
      });
    });
    // When an IPC message is received from the webview...
    webview.addEventListener('ipc-message', event => {
      // Consider it
      switch(event.channel) {
        // If it's an error message...
        case 'error':
          // Remove the <webview> and stop the process
          webview.remove();
          // Throw the error
          if(critical)
            error(event.args[2] ? tr(event.args[0], event.args[2]) : event.args[0], event.args[1]);
          else
            this.makeErrorModal(tr('Application "${name}" crashed', {name}), tr('The application "${name}" stopped due to an error.\nPlease read informations below.') + '\n\n' + event.args[2] ? tr(event.args[0], event.args[2]) : event.args[0], event.args[1]);
          break;

        // If it's a load script request
        case 'load-script':
          /** The script's DOM element
            * @type {Element} */
          let script = document.createElement('script');
          script.setAttribute('type', 'text/javascript');
          script.setAttribute('src', event.args[0]);

          // If the script failed to load...
          script.addEventListener('error', () => {
            webview.send('script-loaded', event.args[0], false);
          });
          // If the script loaded successfully...
          script.addEventListener('load', () => {
            webview.send('script-loaded', event.args[0], true);
          });

          // Start the script's loading
          document.body.appendChild(script);

          break;

        default:
          error(`Unknown request "${event.channel}" from child "${name}"`);
          break;
      }
    });

    // Append the <webview> to the container
    document.getElementById('webview-container').appendChild(webview);
    webview.style.backgroundColor = 'white';
  };

  // Load some modules - removed because NightOS only use the native Node.js modules
  // this.fs = require('fs', {ticket}, true);

  // Load the registry
  this.reloadRegistry();

  // Freeze the system object
  deepFreeze(this);
})());

// Define some useful functions

const n = Night.normalize;

/**
  * Check if a value is a <NightError> instance
  * @param {*} value The value to check
  * @returns {boolean} Is the value a <NightError> instance
  */
const e = val => val instanceof NightError;

// Load the translation package (if asked)
if(argv['language'])
  load_translation(argv['language'], true);
