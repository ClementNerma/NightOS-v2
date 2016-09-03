/*
  This file contains a lot of security tools, such as Ticket management, HTTP
  restricted access, private protocols...
*/

'use strict';

/** The files that can be read using the 'app://' protocol
  * This is a dynamic array, values can be added while the app is running.
  * @type {array} */
let localAllowed = [];
// Reserve 'app' protocol (local application files) and its IPC events
if(!ipc.sendSync('reserve-protocol', 'app'))
  error('Failed to reserve protocol "app"');

ipc.on('protocol-redist', (event, arg) => {
  event.returnValue = {path: path.normalize(__dirname + '/' + arg.request.url.substr(6))};
});

ipc.on('app-protocol-request', (event, arg) => {
  if(localAllowed.indexOf(arg.request.url.substr(6)) !== -1) {
    ipc.send('protocol-response', {mimeType: 'text/html', data: fs.readFileSync(arg.request.url.substr(6))});
    localAllowed.splice(localAllowed.indexOf(arg.request.url.substr(6)), 1);
  } else
    ipc.send('protocol-response', {mimeType: 'text/plain', data: new Buffer('Forbidden Access')});
});

/* ====================
 * = Enter debug mode =
 * ==================== */

 // If asked, enter debug mode
if(DEBUG_MODE)
  if(!ipc.sendSync('devtools', true))
    error('Failed to open developpers tools');

if(argv['devtron']) {
  try { require('devtron').install(); }
  catch(e) { error('Failed to open the Devtron module', e); }
}
