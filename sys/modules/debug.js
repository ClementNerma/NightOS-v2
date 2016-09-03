/*
  This file is the debug module. It permit to applications to display their
  content into the developper's tools. This is a simple reference to the global
  'console' object, with some extra functions.
*/

'use strict';

// If the application can't use the console...
if(!Night.isAllowed(runtime.ticket, 'debug'))
  // Set an error
  error(tr('Ticket doesn\'t have the "${perm}" permission, access to "${name}" module is forbidden', {perm: 'debug', name: 'debug'}));

// Assign the 'console' object to the library
$export.log = (message) => {
  // Make the message a string variable
  if(['number', 'boolean'].includes(typeof message))
    message = message.toString();
  else if(typeof message === 'function')
    message = message.toString().replace(/function *(.*)\((.*)\) *\{((.|\n)*)\}/, '$3');
  else if(typeof message === 'object' && message)
    message = JSON.stringify(message);
  else if(message === undefined)
    message = 'undefined';
  else if(message === null)
    message = 'null';
  else if(typeof message.toString === 'function')
    message = message.toString();
  else if(typeof message !== 'string' && typeof message !== 'object')
    message = '<unknown content>';

  console.log(message);
};

// Add the 'error' function
$export.error = error;
