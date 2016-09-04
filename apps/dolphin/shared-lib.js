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
