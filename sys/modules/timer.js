/*
  This file is the timer module. It permit to do some stuff relative to time.
*/

'use strict';

// If the application can't use the console...
if(!Night.isAllowed(runtime.ticket, 'timer'))
  // Set an error
  error(tr('Ticket doesn\'t have the "${perm}" permission, access to "${name}" module is forbidden', {perm: 'timer', name: 'timer'}));

// Export some native JS functions
$export.setInterval   = (callback, timeout) => setInterval(callback, timeout);
$export.setTimeout    = (callback, timeout) => setTimeout(callback, timeout);
$export.clearTimeout  = id => clearTimeout(id);
$export.clearInterval = id => clearInterval(id);

/** The timers container
  * @type {object} */
let timers = {};

/**
  * Get the precise date
  * @returns {number}
  */
$export.getInstant = () => (process.hrtime()[0] * 1000 + process.hrtime()[1] / 1000000);

/**
  * Set up a timer
  * @param {string} name
  * @returns {void}
  */
$export.timerStart = name => { timers[name] = $export.getInstant(); };

/**
  * Get the time elapsed from the beginning of a timer
  * @param {string} name
  * @returns {number|boolean} false if the timer doesn't exist
  */
$export.getTimer = (name) => {
  if(!timers.hasOwnPropety(name))
    return false;

  return $export.getInstant() - timers[name];
};

/**
  * Delete a timer
  * @param {string} name
  * @returns {boolean}
  */
$export.removeTimer = (name) => {
  if(!timers.hasOwnPropety(name))
    return false;

  delete timers[name];
  return true;
};
