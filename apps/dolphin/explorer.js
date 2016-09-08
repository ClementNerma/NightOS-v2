// Development NOTE: If the <body> tag's innerHTML property is directly modified,
// the DOM access using @querySelectorAll (and maybe other functions) will ends
// the script without any error.

/** The jdom library (as a string)
  * @type {string} */
const jdom_str = require_shared('dolphin-jdom');

/** The jdom library (as an object)
  * @type {object} */
const jdom = eval(jdom_str);

/** The jdom library
  * @type {function} */
const $ = query => jdom.$(query);

// If failed...
if(e(jdom_str))
  debug.error(tr('Failed to load the "dolphin-jdom" shared library'), jdom_str);

/** The window's document
  * @type {Document} */
const document = require('window').document;
