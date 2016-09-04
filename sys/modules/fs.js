/*
  This file is the FileSystem module. It contains a lot of useful functions for
  accessing and managing files and folders.

  NOTE: This module never causes a fatal error when something went wrong, it
        simply returns a <NightError> instance.
*/

'use strict';

// NOTE: No permission is needed to use @fileExists, @dirExists and @exists
//       functions.

/**
  * Check if the ticket can perform an action on the filesystem
  * @param {string} action
  * @param {string} path
  * @returns {string|NightError} Returns a <NightError> instance of the given path
  */
function can(action, path) {
  if(perms === '*')
    return path;

  // Normalize the path and use the CWD
  path = n(path, false, cwd);

  if(!perms.includes(action))
    return new NightError('Ticket doesn\'t have the permission "${action}"', {action});

  for(let folder of perms.foldersAccess)
    if(Night.isParent(folder, path))
      return path;

  return new NightError('Ticket can\'t access to the following path "${path}"', {path});
}

if(typeof runtime !== 'object' || typeof runtime.ticket !== 'object')
  error('"fs" module was initialized without a runtime context or without a ticket');

/** The ticket FileSystem permissions
  * @type {array|string} */
let perms = (!runtime.ticket['*'] ?
              (runtime.ticket.file ? [''].concat(runtime.ticket.file).join(',file/').split(',').slice(1) : []).concat(
              (runtime.ticket.folder ? [''].concat(runtime.ticket.folder).join(',folder/').split(',').slice(1) : []))
            : '*');

/** The accessible folders
  * @type {array} */
let folders = runtime.ticket.foldersAccess || [];

/** The current working directory
  * @type {string} */
let cwd = n(runtime.path, false);

// This step is ignored for all-powerful tickets
// OR if there is no accessible folders (which is a stupid thing)
if(perms !== '*' || !folders.length) {
  // Remove all folders that can't be accessed
  for(let folder of folders)
    if(Night.requiredLevel(folder) > runtime.ticket.level)
      folders.splice(folders.indexOf(folder), 1);
}

/** The system's encoding
  * @type {string} */
$export.ENCODING = SYSTEM_ENCODING;

/** The base directory
  * @type {string} */
$export.BASE_DIR = BASE_DIR;

/** The directory separator symbol
  * @type {string} */
$export.DIR_SEP = DIR_SEP;

/** The NoAccess level
  * @type {number} */
this.NOACCESS_LEVEL = 1;

/** The guest level
  * @type {number} */
this.GUEST_LEVEL = 2;

/** The standard user level
  * @type {number} */
this.USER_LEVEL = 3;

/** The administrator level
  * @type {number} */
this.ADMIN_LEVEL = 4;

/** The system (root) level
  * @type {number} */
this.ROOT_LEVEL = 5;

// Import some Night functions
$export.getExtension = Night.getExtension;
$export.isParent     = Night.isParent;
$export.parse        = Night.parse;

/**
  * Format a path
  * @param {string} path The path to format
  */
// NOTE: Absolute paths is not allowed here
$export.normalize = (path) => n(path, true, cwd);

/**
  * Make a path absolute to the system's root
  * @param {string} path
  * @returns {string}
  */
$export.makeAbsolute = path => '/' + n(path, true, cwd).substr(BASE_DIR.length + 1).replace(SEP_REGEXP, '/');

/**
  * Set the current working directory
  * @param {string} path
  * @returns {void|NightError}
  */
$export.chdir = (path) => {
  try {
    if(!fs.lstatSync(n(path, true, cwd)).isDirectory())
      return new NightError('This is not a directory', {path});

    // Set the new CWD
    cwd = n(path, false, cwd);
  }

  catch(e) { return new NightError('Failed to open directory', {path}); }
};

/**
  * Get the current working directory
  * @returns {string}
  */
$export.cwd = () => cwd;

/**
  * Check if an item exists
  * @param {string} path The file's path
  * @returns {boolean|NightError}
  */
$export.exists = (path) => {
  try { return fs.existsSync(n(path, true, cwd)); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Check if a file exists
  * @param {string} path The file's path
  * @returns {boolean|NightError}
  */
$export.fileExists = (path) => {
  try { return fs.lstatSync(n(path, true, cwd)).isFile(); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Check if a folder exists
  * @param {string} path The folder's path
  * @returns {boolean}
  */
$export.dirExists = (path) => {
  try { return fs.lstatSync(n(path, true, cwd)).isDirectory(); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Write a file
  * @param {string} path The file's path
  * @param {string} content The content to write
  * @param {string} [encoding] The encoding to use (default: system's encoding)
  * @returns {void|NightError}
  */
$export.writeFile = (path, content, encoding = SYSTEM_ENCODING) => {
  if(e(path = can('file/write', path)))
    return path;

  try { fs.writeFileSync(n(path, true, cwd), content, encoding); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Append a content to a file
  * @param {string} path The file's path
  * @param {string} content The content to write
  * @param {string} [encoding] The encoding to use (default: system's encoding)
  * @returns {void|NightError}
  */
$export.appendFile = (path, content, encoding = SYSTEM_ENCODING) => {
  if(e(path = can('file/write', path)))
    return path;

  try { fs.appendFileSync(n(path, true, cwd), content, encoding); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Read a file
  * @param {string} path The file's path
  * @param {string} [encoding] The encoding to use (default: system's encoding)
  * @returns {string|NightError}
  */
$export.readFile = (path, encoding = SYSTEM_ENCODING) => {
  if(e(path = can('file/read', path)))
    return path;

  try { return fs.readFileSync(n(path, true, cwd), encoding); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Remove a file
  * @param {string} path The file's path
  * @returns {void|NightError}
  */
$export.removeFile = (path) => {
  if(e(path = can('file/remove', path)))
    return path;

  try { fs.unlinkSync(n(path, true, cwd)); }
  catch(e) { return new NightError({path, jsError: e}); }
}

/**
  * Make a folder
  * @param {string} path The folder's path
  * @returns {void|NightError}
  */
$export.makeFolder = (path) => {
  if(e(path = can('folder/make', path)))
    return path;

  try { fs.mkdirSync(n(path, true, cwd)); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Read a folder
  * @param {string} path The folder's path
  * @returns {array|NightError}
  */
$export.readFolder = (path) => {
  if(e(path = can('folder/read', path)))
    return path;

  try { return fs.readdirSync(n(path, true, cwd)); }
  catch(e) { return new NightError({path, jsError: e}); }
};

/**
  * Rename an item
  * @param {string} path
  * @param {string} newName
  * @param {boolean} [strict] Check for the right permission. This is slower but
  *                           if omitted the system will have to check for the
  *                           "file/rename" AND the "folder/rename" permission
  * @returns {void|NightError}
  */
/*
$export.rename = (path, newName, strict = false) => {
  // NOTE: Because checking if the item is a file or a folder takes a lot of time,
  //       this function consider that the ticket must have the "file/rename"
  //       and the "folder/rename" permissions. The 'strict' argument permit to
  //       check if the item is a file or a folder, which is slower, but only
  //       requires one of these permissions.

  if(!strict) { // Non-strict mode, check for two permissions
    if(e(path = can('file/rename', path)))
      return path;

    if(e(path = can('folder/rename', path)))
      return path;
  } else { // Strict mode, check the item type and ask only for one permission
    // Get the item's type
    let type;

    try { type = fs.lstatSync(n(path, true, cwd)).isDirectory(); }
    catch(e) { return new NightError('Failed to check the item\'s type', {path, jsError: e}); }

    // Check for the correct permission
    if(type === true) // folder
      path = can('folder/rename', path);
    else // file
      path = can('file/rename', path);

    // If an error was returned...
    if(e(path))
      // Return it
      return path;
  }

  // Now we can perform the name changing !
  try { fs.renameSync(n(path, null, true), n(newName, null, true)); }
  catch(e) { return new NightError({path, jsError: e}); }
};
*/
