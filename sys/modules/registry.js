/*
  This is the registry module. It permit to access the registry.
*/

'use strict';

/**
  * Read a registry entry
  * @param {string} key
  * @returns {object|number|boolean|void}
  */
$export.read = (key) => {
  /** The returned result
    * @type {object|number|boolean|void} */
  let content = Night.readRegistry(key);

  // Return the result, clone it if it's an object
  return (typeof content === 'object' ? cloneObject(content) : content);
};

if(runtime.ticket.level >= ROOT_LEVEL) {
  /**
    * Write the registry
    * @param {string} key
    * @param {string|number|boolean} value
    * @param {boolean} [recursive] Make inexistant branches
    * @returns {boolean} True if the operation worked
    */
  $export.write = (key, value, recursive = false) => Night.write(key, value, recursive);
}

/**
  * Reload the registry
  * @returns {void}
  */
this.reload = () => Night.reloadRegistry();
