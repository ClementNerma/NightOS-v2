/*
  This is the dolphin shared library. This library permit to make icons or
  clickable items for showing files and folders.
*/

// NOTE: Here a NightDocument is required to make the icons and clickable HTML
//       elements.

'use strict';

/** The filesystem module
  * @type {object} */
const fs = require('fs');

// If the filesystem module failed to load...
if(e(fs))
  // Error
  return new NightError('Failed to load the "fs" module');

/** The registry module
  * @type {object} */
const reg = require('registry');

// If the registry module failed to load...
if(e(reg))
  // Error
  return new NightError('Failed to load the "registry" module');

/** A <NightDocument> instance for work
  * @type {NightDocument} */
const doc = new NightDocument();

/**
  * Get the registry extension of an item
  * @param {string} path
  * @returns {string}
  */
$export.getExtension = (path) => {
  // If the item doesn't exist...
  if(fs.exists(path) === false)
    return 'unknown';

  // If that's a folder...
  if(fs.dirExists(path) === true)
    return 'directory';

  // If that's a file...
  if(fs.fileExists(path) === true) {
    /** The file's extension
      * @type {string|void} */
    let ext = Night.getExtension(path);

    // If an extension was found...
    if(ext)
      return '.' + ext;
    else // Else...
      return 'unknown';
  }

  // Unknown file type (maybe a bug)
  return 'unknown';
};

/**
  * Get the filename of a path
  * @param {string} filename
  * @returns {string}
  */
$export.getFilename = (path) => {
  /** The position of the last directory separator
    * @type {number} */
  let index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

  // If there is no separator...
  if(index === -1)
    // Return the entire path as the filename
    return path;
  else // Else...
    // Return the last part which is the filename
    return path.substr(index + 1);
};

/**
  * Get informations about a file type
  * @param {string} filetype
  * @returns {object|void}
  */
$export.getFileType = filetype => reg.read(`files-type/${filetype}`);

/**
  * Get the icon of a file type
  * @param {string} filetype
  * @returns {string|void}
  */
$export.getIcon = filetype => ($export.getFileType(filetype) || {}).icon;

/**
  * Get the description of a file type
  * @param {string} filetype
  * @returns {string|void}
  */
$export.getDescription = filetype => ($export.getFileType(filetype) || {}).descriptor;

/**
  * Open a file
  * @param {string} path
  * @returns {boolean|NightError} True if succeed
  */
$export.open = path => Night.openFile(path);

/**
  * Make a clickable icon for an item
  * @param {string} path
  * @returns {NightElement|boolean}
  */
$export.makeIcon = (path) => {
  /** Informations about the file
    * @type {object} */
  let infos = $export.getFileType($export.getExtension(path)) || $export.getFileType('unknown');

  /** The element
    * @type {NightElement} */
  let element = doc.createElement('div');
  element.className = 'dolphin-shortcut';

  /** The icon
    * @type {NightElement} */
  let icon = doc.createElement('img');
  icon.className = 'dolphin-shortcut-icon';
  icon.setAttribute('src', 'data:image/png;base64,' + reg.read('files-type/' + $export.getExtension(path) + '/icon') || reg.read('files-type/unknown/icon'));
  element.appendChild(icon);

  /** The filename
    * @type {NightElement} */
  let filename = doc.createElement('span');
  filename.className = 'dolphin-shortcut-filename';
  filename.innerHTML = $export.getFilename(path);
  element.appendChild(filename);

  // Add an event listener
  element.addEventListener('click', () => Night.openFile(path));

  // Return the element
  return element;
};
