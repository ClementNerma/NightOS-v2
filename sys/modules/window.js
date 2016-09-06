/*
  This is the windows module. It permit applications to make windows and modals.
*/

// TODO: Grant the access to the application's window

'use strict';

// If the application can't use the console...
if(!Night.isAllowed(runtime.ticket, 'windows/use-own'))
  // Set an error
  error(tr('Ticket doesn\'t have the "${perm}" permission, access to "${name}" module is forbidden', {perm: 'windows', name: 'windows'}));

// Remove the critical 'defaultView' property that permit to get the 'window'
// object from the 'document' one. This removing permit to fix a critical issue
// because the access of 'window' permit the application to access also 'require'
// or 'process', 'ipc' and all Node.js variables.
// NOTE: A simple deletion by 'document.defaultView = null' doesn't work because
// this property is set read-only, so we assign a getter that will permit to
// remove definitely the property.
document.__defineGetter__('defaultView', () => null);

/** The application's own window
  * @type {Window} */
$export.document = document;
