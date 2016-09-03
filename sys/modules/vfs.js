/*
  This file is from one of my ancient projects, called "VFS". This permit to
  make a virtual filesystem in the RAM. The main point of this library in
  NightOS is to have a fully-functionnal filesystem for sandboxed applications.

  NOTE: This libary is used here without credits (needed if we read the license)
        because I made this library myself, so I haven't to say I'm the author
        here.

  NOTE: Here the system `keys()` function is not used because the library have
        to have the best performances as possible.
*/

// Observation notes :
// The Virtual FileSystem cannot be used for large virtual storages, due to all files and folders are stored in the RAM
// If storage has too many data, interpreter will throws a fatal error due to RAM exceed. The limit depends of the computer's RAM.
// The better would be to write all files in a temporary subfolder (all writing requests (and reading if needed) would be adressed not the root but to a subfolder)
// The VFS solution is only interesting if a totally virtual filesystem is needed, or if there is no way to write to the disk (e.g. into a browser)
// NOTE: This module can also be used via an interface which have the same functions that Node.JS.

// Flags for the FST (File System Table) :
// 'h' : hidden
// 'r' : read-only   (NOTE: This flag is ignored if a parent folder is deleted)
// 'u' : undeletable (NOTE: This flag is ignored if a parent folder is deleted)

'use strict';

/**
  * VFS class
  * @constructor
  * @param {function} [securityAgent]
  */
$export.VFS = function(securityAgent) {

  let _storage = {},
      _table   = {},
      _forbiddenChars        = ':*?<>|',
      _readOnlyIsUndeletable = true,  // If true, when you add the 'r' flag the file is undeletable (excepted if the parent folder is deleted)
      _strictCharsForbid     = false, // If true, all request with a path containing forbidden characters will fail. If false, only 'write' requests will fail (default: false)
      _agent  = securityAgent || false, // Security agent
      _locked = false,
      _cwd    = '/',
      _sep    = '/'; // If true, parameters will not be changeable again

  /**
    * Perform an action on the filesystem
    * @param {string} path If this is the only argument, function will return if the path's content (the path will be normalized)
    * @param {string} [type] Expected content type ("string" for files, "object" for folders)
    * @param {string|object} [write] Content to write (if it's not a string or an object, the request will fail)
    * @param {boolean} [deleteIt] Delete the item
    * @returns {boolean} true on success, false on fail
    */
  function _fs(path, type, write, deleteIt) {
    // Normalize and get an array, permit to don't have to split the array next
    path = _normalize(path, true);
    // Remove the head separator symbol
    path.splice(0, 1);

    // Fail if the path is an object-reserved name
    if(({})[path])
      return false;

    // Get the full normalized path as a single string
    let joined = _sep + path.join(_sep);

    // Check for forbidden characters only if the request is writing
    // ...or if the program is in 'strict' forbid
    if((write && write.length) || _strictCharsForbid) {
      // Fail if the path contains forbidden chars
      for(let fC of _forbiddenChars) { // fC for 'forbidden Char'
        if(joined.includes(fC))
          return false;
      }
    }

    // If 'path' is the root
    if(!path.length)
      // Return true if path is the only argument, false if trying to write or delete the path (because you can't write a folder and can't delete the root)
      return ((write === undefined && !deleteIt) && (!type || type === 'object')) ? _storage : false;

    // If write is defined but that's not a string : that's a bad argument, the request fails
    if(write !== undefined && typeof write !== 'string' && (typeof write !== 'object' || Array.isArray(write) || !write))
      return false;

    let _s = _storage;

    // For each folder in the path (excepted the last item, file or folder)
    for(let i = 0; i < path.length - 1; i++) {
      // Fail if the folder doesn't exist
      if(!_s.hasOwnProperty(path[i]))
        return false;

      _s = _s[path[i]];
    }

    // Get the last part of the path (after the last _sep)
    let last = path[path.length - 1];

    // Fail if the item's type is not the expected type
    if(type && _s[last] !== undefined && typeof _s[last] !== type)
      return false;

    // If the request is 'exist'
    if(write === undefined && !deleteIt) {
      // Check if the path exists
      return _s.hasOwnProperty(last) ? _s[last] : false;
    }

    // If the request is 'write'
    if(!deleteIt) { // By elimination, this is faster than (write !== undefined)
      // If that's the first writing of this path...
      if(!_table[joined])
        _table[joined] = [ Date.now() /* Creation date */, Date.now() /* Last writing date */ , '' /* flags */];
      // ... else, if the file is read-only and 'r' flags set to 'undeletable' OR if the file is undeletable, the request fails
      else if(_table[joined][2].includes('u') || (_table[joined][2].includes('r') && _readOnlyIsUndeletable))
        return false;
      // ... else just update the last writing date
      else
        _table[joined][1] = Date.now();

      // Then write the data
      _s[last] = write;

      // Success
      return true;
    }

    // If the request is 'delete' (the last possible)
    // There is no 'if' condition because we're sure that the request is 'delete'

    // Fail if the item doesn't exist
    if(!_s.hasOwnProperty(last))
      return false;

    // Else delete it on the table
    delete _table[joined];
    // And on the storage
    delete _s[last];
  }

  /**
    * Normalize a path
    * @param {string} path
    * @param {boolean} returnArray Returns an array instead of a string
    * @returns {string|array} Normalized path
    */
  function _normalize(path, returnArray) {
    let out = [];

    // Support for 'undefined' given as a path
    path = path || '';

    // Split the path by seperators (here, slashes)
    // The '' part permit to work even if there is no path specified, else it would cause a fatal error
    path = ((path.startsWith(_sep) ? '' : _cwd + _sep) + path).split(_sep);

    for(let part of path) {
      if(part === '..')
        out.pop();
      else if(part && part !== '.')
        out.push(part);
    }

    if(!out.length)
      out.push(_sep);
    else if(out[0])
      out.unshift('');

    return returnArray ? out : out.join(_sep);
  }

  /**
    * Clone a value (only works with some kind of values)
    * @param {array|object} source
    * @returns {array|object}
    */
  function _clone(source) {
    function recursive(source) {
      let out = {};

      for(let key of Reflect.ownKeys(source))
        out[key] = (typeof source[key] === 'object' ? recursive(source[key]) : source[key]);
        /**if(typeof sub[keys[i]] === 'object')
          out[keys[i]] = recursive(source[keys[i]]);
        else
          out[keys[i]] = source[keys[i]];**/ // Unoptimized method

      return out;
    }

    return recursive(source);
  };

  /**
    * Clone any value
    * @param {*} oReferance Value to clone
    * @returns {*} Cloned value
    */
  function _cloneAll(oReferance) {
    var aReferances = new Array();
    var getPrototypeOf = function(oObject) {
      if(typeof(Object.getPrototypeOf)!=="undefined")
        return Object.getPrototypeOf(oObject);

      var oTest = new Object();

      if(typeof(oObject.__proto__)!=="undefined" && typeof(oTest.__proto__)!=="undefined" && oTest.__proto__===Object.prototype)
        return oObject.__proto__;

      if(typeof(oObject.constructor)!=="undefined" && typeof(oTest.constructor)!=="undefined" && oTest.constructor===Object && typeof(oObject.constructor.prototype)!=="undefined")
        return oObject.constructor.prototype;

      return Object.prototype;
    };

    var recursiveCopy = function(oSource) {
      if(typeof(oSource)!=="object")
        return oSource;

      if(oSource===null)
        return null;

      for(var i = 0; i < aReferances.length; i++)
        if(aReferances[i][0]===oSource)
          return aReferances[i][1];

      if(Array.isArray(oSource)) {
        var oCopy = [];
        oCopy.prototype = getPrototypeOf(oSource);
        aReferances.push([oSource, oCopy]);

        for(var k in oSource)
          oCopy[k] = recursiveCopy(oSource[k]);
      } else {
        var Copy = new Function();
        Copy.prototype = getPrototypeOf(oSource);
        var oCopy = new Copy();
        aReferances.push([oSource,oCopy]);

        for(var sPropertyName in oSource) {
          if(oSource.hasOwnProperty(sPropertyName))
            oCopy[sPropertyName] = recursiveCopy(oSource[sPropertyName]);
        }
      }

      return oCopy;
    };

    return recursiveCopy(oReferance);
  };

  /**
    * Send a request to agent
    * @param {string} request
    * @param {string} path
    * @returns {boolean}
    */
  function agent(request, path) {
    return (_agent.apply(this, [request, _normalize(path)]) !== false);
  }

  /**
    * Check if a path exists
    * @param {string} path
    * @returns {boolean} Exists
    */
  this.exists = function(path) {
    if(_agent && !agent('*/exist', path))
      return false;

    return this.fileExists(path) || this.dirExists(path);
  };

  /**
    * Check if a file exists
    * @param {string} path
    * @returns {boolean} Exists
    */
  this.fileExists = function(path) {
    if(_agent && !agent('file/exist', path))
      return false;

    return !!_fs(path, 'string');
  };

  /**
    * Check if a folder exists
    * @param {string} path
    * @returns {boolean} Exists
    */
  this.dirExists = function(path) {
    if(_agent && !agent('folder/exist', path))
      return false;

    return !!_fs(path, 'object');
  };

  /**
    * Make a folder
    * @param {string} path
    * @returns {boolean} Success
    */
  this.makeDir = function(path) {
    if(_agent && !agent('folder/make', path))
      return false;

    // Fail if the folder already exists
    if(this.dirExists(path))
      return false;

    // Contains the success of the writing request
    /** @type {boolean} */
    let ret = _fs(path, 'object', {});

    // If the writing has succeed, put an entry into the table
    // NOTE: A folder can only have the 'h' flag, just a creation date. The writing date is constant and equals to the creation date.
    if(ret)
      _table[path] = [ Date.now() /* Creation date */, Date.now() /* Writing date */, ''];

    // Success
    return ret;
  };

  /**
    * Check if a folder contains sub-folders
    * @param {string} path
    * @returns {boolean} Success & has sub-folders
    */
  this.hasSubFolders = function(path) {
    if(_agent && !agent('folder/has-sub-folders', path))
      return false;

    let read = _fs(path = _normalize(path), 'object');

    // Fail if the folder can't be read (maybe it doesn't exist at all)
    if(!read)
      return false;

    for(let item of Reflect.ownKeys(read))
      // If it's a sub-folder
      if(_fs(path + _sep + item, 'object'))
        return true;

    return false;
  };

  /**
    * List content of a folder
    * @param {string} path
    * @param {boolean} [showHidden] Show hidden items
    * @returns {array|boolean} False if fails
    */
  this.readDir = function(path, showHidden) {
    if(_agent && !agent('folder/read', path))
      return false;

    let dir = _fs(path = _normalize(path), 'object');

    if(!dir)
      return false;

    let out = [], full;

    for(let key of Reflect.ownKeys(dir)) {
      if(showHidden || !(_table[full = path + (path !== _sep ? _sep : '') + key] && _table[full][2].includes('h')))
        out.push(key);
    }

    return out;
  };

  /**
    * Delete a folder
    * @param {string} path
    * @param {boolean} recursive Delete the folder even if it contains items
    * @returns {boolean} Success
    */
  this.removeTree = function(path, recursive) {
    if(_agent && !agent('folder/remove', path))
      return false;

    let dir = _fs(path = _normalize(path), 'object');

    // Fail if the folder doesn't exist
    if(!dir)
      return false;

    // Fail if the folder isn't empty and the removing is not set as 'recursive'
    if(Reflect.ownKeys(dir).length && !recursive)
      return false;

    function recurse(obj, path) {
      for(let key of Reflect.ownKeys(obj)) {
        delete _table[path + _sep + key];

        if(typeof obj[key] === 'object')
          recurse(obj[key], path + _sep + key);
      }
    }

    // If the folder contains items, delete all the entries in the table associated to those items
    if(Reflect.ownKeys(dir).length)
      recurse(dir, path);

    delete _table[path];

    // Delete the folder from its parent
    path = path.split(_sep);
    let last = path.pop();
    delete _fs(path.join(_sep))[last];

    // Success !
    return true;
  };

  /**
    * Import a folder
    * @param {object} folder
    * @param {string} [path] Import location
    * @param {boolean} force Force importation, even if a folder already exists at this location
    * @returns {boolean} Import succeed
    */
  this.importFolder = function(folder, path, force) {
    if(_agent && !agent('folder/import', folder, path, force))
      return false;

    if(typeof folder !== 'object' || !folder || Array.isArray(folder)
    || typeof folder.path !== 'string' || typeof folder.folder !== 'object' || !folder.folder || Array.isArray(folder)
    || typeof folder.table !== 'object' || !folder.table || Array.isArray(folder.table))
       return false;

    /**
      * Check a folder object, recursively
      * @param {object} obj
      * @returns {boolean} Object is valid
      */
    function checkRecursive(obj) {
      for(let key of Reflect.ownKeys(obj)) {
        if(typeof key === 'object') {
          if(Array.isArray(obj[key]) || !obj[key])
            return false;
          else if(typeof obj[key] === 'object') {
            if(!checkRecursive(obj[key]))
              return false;
          } else if(typeof obj[key] !== 'string')
            return false;
        }
      }

      return true;
    }

    // Fail if the folder's content is not valid
    if(!checkRecursive(folder.folder))
      return false;

    let tableKeys = Reflect.ownKeys(folder.table);

    for(let tableKey of tableKeys)
      if(!Array.isArray(folder.table[tableKey]) || folder.table[tableKey].length !== 3)
        return false;

    path = (path !== undefined ? _normalize(path) : _normalize(_sep + folder.path));

    if(this.dirExists(path)) {
      if(!force)
        return false;
      // Fail if can't remove the folder
      else if(!this.removeTree(path, true))
        return false;
    } else if(this.fileExists(path)) {
      if(!force)
        return false;
      // Fail if can't remove the file
      else if(!this.removeFile(path))
        return false;
    }

    let success = _fs(path, 'object', _clone(folder.folder));

    // Fail if the folder writing failed
    if(!success)
      return false;

    for(let tableKey of tableKeys)
      _table[path + _sep + tableKey] = [folder.table[tableKey][0], folder.table[tableKey][1], folder.table[tableKey][2]];

    return true;
  };

  /**
    * Export a folder
    * @param {string} path
    * @returns {object|boolean}
    */
  this.exportFolder = function(path) {
    if(_agent && !agent('folder/export', path))
      return false;

    let folder = _fs(path = _normalize(path), 'object');

    // Fail if the folder can't be read
    if(!folder)
      return false;

    let table = {};

    for(let key of Reflect.ownKeys(_table))
      if(key.substr(0, path.length + 1) === path + _sep)
          table[key.substr(path.length + 1)] = [_table[key][0], _table[key][1], _table[key][2]];

    return {
      path  : path,
      folder: _clone(folder),
      table : table
    };
  };

  /**
    * Create an empty file
    * @param {string} path
    * @returns {boolean} Success
    */
  this.touchFile = function(path) {
    if(_agent && !agent('file/make', path))
      return false;

    // Fail if the file already exists
    if(this.fileExists(path))
      return false;

    return _fs(path, 'string', '');
  };

  /**
    * Write a file
    * @param {string} path
    * @param {string} content
    * @returns {boolean} Success
    */
  this.writeFile = function(path, content) {
    if(_agent && !agent('file/write', path))
      return false;

    // Fail if the file is read-only
    if(_table[path = _normalize(path)] && _table[path][2].includes('r'))
      return false;

    return _fs(path, 'string', content);
  };

  /**
    * Append a content to a file
    * @param {string} path
    * @param {string} content
    * @param {boolean} [noNewLine] If true, no new line will be added to the file (default: false)
    * @returns {boolean} Success
    */
  this.appendFile = function(path, content, noNewLine) {
    if(_agent && !agent('file/append', path))
      return false;

    // Fail if the file is read-only
    if(_table[path = _normalize(path)] && _table[path][2].includes('r'))
      return false;

    // Get the current file's content
    let str = _fs(path, 'string');

    // If the file doesn't exist, create it
    // NOTE: Here the '===' operator is used because the file's content can be an empty string (and '' == false in javascript)
    if(str === false)
      return _fs(path, 'string', content);
    // If the file already exist, append the given string
    else
      return _fs(path, 'string', str + (noNewLine ? '' : '\n') + content);
  };

  /**
    * Read a file
    * @param {string} path
    * @returns {string|boolean}
    */
  this.readFile = function(path) {
    if(_agent && !agent('file/read', path))
      return false;

    return _fs(path, 'string');
  };

  /**
    * Read a file and parse as JSON
    * @param {string} path
    * @returns {object|boolean}
    */
  this.readJSON = function(path) {
    if(_agent && !agent('file/read', path))
      return false;

    let read = _fs(path, 'string');

    // Fail if the file can't be read
    if(read === false)
      return false;

    try { return JSON.parse(read); }
    catch(e) { return false; }
  };

  /**
    * Copy a file to another location
    * @param {string} source
    * @param {string} dest
    * @returns {boolean} Success
    */
  this.copyFile = function(source, dest) {
    if(_agent && !agent('file/copy', source, dest))
      return false;

    // Fail if the source doesn't exist
    if(!this.fileExists(source))
      return false;

    // Fail if the destination already exists
    if(this.exists(dest))
      return false;

    let read = _fs(source, 'string');

    // Fail if the source can't be read
    if(read === false)
      return false;

    return _fs(dest, 'string', read);
  };

  /**
    * Move a file to another location
    * @param {string} source
    * @param {string} dest
    * @returns {boolean}
    */
  this.moveFile = function(source, dest) {
    if(_agent && !agent('file/move', source, dest))
      return false;

    // Fail if the source doesn't exist
    if(!this.fileExists(source))
      return false;

    // Fail if the destination already exists
    if(this.exists(dest))
      return false;

    // Fail if the source has the undeletable flag
    // ..or the read-only flag and read-only set as undeletable
    if(_table.hasOwnProperty(source = _normalize(source)) && (_table[source][2].includes('u') || (_table[source][2].includes('r') && _readOnlyIsUndeletable)))
      return false;

    let read = _fs(source, 'string');

    // Fail if the source can't be read
    if(read === false)
      return false;

    // Fail if the copy failed
    if(!_fs(dest, 'string', read))
      return false;

    return this.removeFile(source);
  };

  /**
    * Remove a file
    * @param {string} path
    * @returns {string|boolean}
    */
  this.removeFile = function(path) {
    if(_agent && !agent('file/remove', path))
      return false;

    // Fail if the file doesn't exist
    if(!this.fileExists(path = _normalize(path)))
      return false;

    // Fail if the file is undeletable or if the file is read-only and 'r' flag is set as undeletable
    if(_table[path] && (_table[path][2].includes('u') || (_table[path][2].includes('r') && _readOnlyIsUndeletable)))
      return false;

    delete _table[path];

    // Delete the file from its parent
    path = path.split(_sep);
    let last = path.pop();
    delete _fs(path.join(_sep))[last];

    return true;
  };

  /**
    * Get a folder as a tree object
    * @param {string} path Path to the folder
    * @returns {object|boolean}
    */
  this.getTree = function(path) {
    if(_agent && !agent('folder/tree', path))
      return false;

    let dir = _fs(path, 'object');

    // Fail if the specified folder doesn't exist
    if(!dir)
      return false;

    return _clone(dir);
  };

  /**
    * Get the FST entry of an item
    * @param {string} path
    * @returns {array|boolean}
    */
  this.getTableEntry = function(path) {
    if(_agent && !agent('*/getTableEntry', path))
      return false;

    // Fail if the item doesn't exist or if there is no table entry for this item
    if(_fs(path = _normalize(path)) === false || !_table.hasOwnProperty(path))
      return false;

    // [SECURITY] The table entry array is cloned to remove all reference between the returned array and the original array
    return [_table[path][0], _table[path][1], _table[path][2]];
  };

  /**
    * Add a flag to an item
    * @param {string} path
    * @param {string} flags One or more flag(s)
    * @returns {boolean} Success
    */
  this.addFlag = function(path, flags) {
    if(_agent && !agent('flag/write', path, flags))
      return false;

    if(!_fs(path = _normalize(path)))
      return false;

    for(let flag of flags)
      if(!_table[path][2].includes(flag))
        _table[path][2] += flag;

    return true;
  };

  /**
    * Remove a flag to an item
    * @param {string} path
    * @param {string} flags One or more flag(s)
    * @returns {boolean} Success
    */
  this.removeFlag = function(path, flags) {
    if(_agent && !agent('flag/remove', path, flags))
      return false;

    if(!_fs(path = _normalize(path)))
      return false;

    for(let flag of flags)
      if(_table[path][2].includes(flag))
        _table[path][2] = _table[path][2].replace(flag, '');

    return true;
  };

  /**
    * Check if an item has a flag
    * @param {string} path
    * @param {string} flag
    * @returns {boolean} Success & has flag
    */
  this.hasFlag = function(path, flag) {
      if(_agent && !agent('flag/has', path))
      return false;

    return _fs(path = _normalize(path)) ? (_table.hasOwnProperty(path) && _table[path][2].includes(flag)) : false;
  };

  /**
    * Get all flags on an item
    * @param {string} path
    * @returns {boolean} Success & has flag
    */
  this.getFlags = function(path) {
    if(_agent && !agent('flag/read', path))
      return false;

    return (_fs(path = _normalize(path)) && _table.hasOwnProperty(path) ? _table[path][2] : false);
  };

  /**
    * Get forbidden characters
    * @returns {string}
    */
  this.getForbiddenChars = function() {
    return _forbiddenChars;
  };

  /**
    * Check if a character is forbidden
    * @param {string} char
    * @returns {boolean} Found
    */
  this.isForbidden = function(char) {
    return _forbiddenChars.includes(char);
  };

  /**
    * Add one or more forbidden character(s)
    * @param {string} chars
    * @returns {boolean} Success
    */
  this.forbid = function(chars) {
    // Fail if in locked mode
    if(_locked)
      return false;

    // Fail if the given characters is not a string
    // ..or if the string is empty
    if(typeof chars !== 'string' || !chars.length)
      return false;

    // The separator symbol cannot be forbidden
    if(chars.includes(_sep))
      return false;

    // Add one char by one char to see duplicates
    for(let char of chars)
      if(!_forbiddenChars.includes(char))
        _forbiddenChars += char;

    return true;
  };

  /**
    * Remove a forbidden character (will fail if the character is not forbidden)
    * @param {string} char
    * @returns {boolean} Success
    */
  this.unforbid = function(char) {
    // Fail if in locked mode
    if(_locked)
      return false;

    // Fail if the character is not forbidden
    if(!_forbiddenChars.includes(char))
      return false;

    _forbiddenChars = _forbiddenChars.replace(char, '');
    return true;
  };

  /**
    * Check if strict forbid mode is enabled
    * @returns {boolean}
    */
  this.isStrictForbid = function() {
    return _strictCharsForbid;
  };

  /**
    * Enable the strict forbid mode
    * @returns {boolean} Success
    */
  this.enableStrictForbid = function() {
    if(!_locked)
      _strictCharsForbid = true;

    return !_locked;
  };

  /**
    * Disable the strict forbid mode
    * @returns {boolean} Success
    */
  this.disableStrictForbid = function() {
    if(!_locked)
      _strictCharsForbid = false;

    return !_locked;
  };

  /**
    * Lock settings (can't be canceled)
    */
  this.lock = function() {
    _locked = true;
  };

  /**
    * Check if settings are locked
    * @returns {boolean}
    */
  this.isLocked = function() {
    return _locked;
  };

  /**
    * Check if there is an agent
    * @returns {boolean}
    */
  this.isAgent = function() {
    return (_agent ? _agent('agent/exist') !== false : false);
  };

  /**
    * Get or change the current working directory (CWD)
    * @param {string} [path] If specified, change the CWD
    * @returns {string} CWD
    */
  this.chdir = function(path) {
    if(_agent && !agent('folder/cwd', path))
      return false;

    if(typeof path === 'string') {
      // Fail if the folder doesn't exist
      if(!this.dirExists(path = _normalize(path)))
        return false;

      _cwd = path;
    }

    return _cwd;
  };

  /**
    * Get or change the server's separator symbol
    * @param {string} [char]
    * @returns {string} Separator
    */
  this.separator = function(char) {
    if(_agent && !agent('folder/separator', char))
      return false;

    if(char !== undefined) {
      // Fail if the string is not a single symbol
      if(typeof char !== 'string' || char.length !== 1 || _forbiddenChars.includes(char))
        return false;

      _sep = char;
    }

    return _sep;
  };

  /**
    * Export the entire storage
    * @returns {object}
    */
  this.export = function() {
    if(_agent && !agent('*/export'))
      return false;

    return {
      storage: _clone(_storage),
      table  : _cloneAll(_table),
      sep    : _sep,
      cwd    : _cwd,
      locked : _locked,
      agent  : _agent,

      strictCharsForbid    : _strictCharsForbid,
      forbiddenChars       : _forbiddenChars,
      readOnlyIsUndeletable: _readOnlyIsUndeletable
    };
  };

  /**
    * Import the entire storage
    * @param {object} storage
    * @returns {boolean} Success
    */
  this.import = function(storage) {
    if(typeof storage.storage !== 'object' || typeof storage.table !== 'object' || typeof storage.sep !== 'string' ||
       typeof storage.cwd !== 'string' || typeof storage.locked !== 'boolean' || storage.agent === undefined ||
       typeof storage.strictCharsForbid !== 'string' && typeof storage.forbiddenChars !== 'string' ||
       typeof storage.readOnlyIsUndeletable !== 'boolean')
      return false;

    _storage = _clone(storage.storage);
    _table   = _cloneAll(storage.table);
    _sep     = storage.sep;
    _cwd     = storage.cwd;
    _locked  = storage.locked;
    _agent   = storage.agent;

    _strictCharsForbid     = storage.strictCharsForbid;
    _forbiddenChars        = storage.forbiddenChars;
    _readOnlyIsUndeletable = storage.readOnlyIsUndeletable;

    return true;
  };

  /**
    * Normalize a path
    * @param {string} path
    * @param {boolean} returnArray Returns an array instead of a string
    * @returns {string|array} Normalized path
    */
  this.normalize = function(path, returnArray) {
    return _normalize(path, returnArray);
  };

  /**
    * Check if a path is into a parent
    * @param {string} path
    * @param {string} parent
    * @returns {boolean} Success & path is into the parent
    */
  this.into = function(path, parent) {
    return _normalize(path).substr(0, (parent = _normalize(parent)).length) === parent;
  };

  Object.freeze(this);
};
