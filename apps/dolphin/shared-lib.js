/*
  This is the dolphin shared library. This library permit to make icons or
  clickable items for showing files and folders.
*/

// NOTE: Here a NightDocument is required to make the icons and clickable HTML
//       elements.

'use strict';

/**
  * Load the dolphin library
  * @param {NightDocument} doc
  * @returns {object|NightError}
  */
$export.$ = function(doc) {
  // Check if the document is valid
  if(!(doc instanceof NightDocument))
    return new NightError('A NightDocument instance is required to use the dolphin library');

  // Else, make the library
  // This part will be done in a next NightOS update.
};
