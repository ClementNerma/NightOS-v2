'use strict';

/**
  * Throw a fatal error
  * @param {string} title
  * @param {string} message
  * @param {boolean} [hideReport] Hide the 'Report' button
  * @returns {void}
  */
function error(title, message, hideReport = false) {
  mainWindow.hide();

  let ans = dialog.showMessageBox({
    type     : 'error',
    buttons  : ['Reload', 'Exit'].concat(!hideReport ? 'Report' : []),
    defaultId: 0,
    cancelId : 1,
    detail   : message,
    title    : 'Error',
    message  : title
  });

  if(ans === 0)
    reload();
  else if(ans === 1)
    mainWindow.close();
  else if(ans === 2) {
    // Report the error through the web
    if(!electron.shell.openExternal('http://nightos.890m.com/mailto.html?to=clement.nerma' + encodeURIComponent('@') + 'gmail.com&subject=NightOS%20Report&message=' + encodeURIComponent(`A critical error occured while running NightOS :\n\n<h2>${title}</h2>\n\n${message}`)))
      dialog.showMessageBox({
        type   : 'error',
        buttons: ['Close'],
        title  : 'Error',
        message: 'Report failed',
        details: 'It seems you have no default browser for opening links.'
      });

    mainWindow.close();
  }
}

/**
  * Reload the system
  * @returns {void}
  */
function reload() {
  const child = require('child_process').spawn(process.argv[0], process.argv.slice(1), {
    detached: true,
    stdio   : 'ignore'
  });

  child.unref();
  mainWindow.close(); // The app will quit automatically
}

// Save the instant when the loading started, and when the loading has finished.
const started  = process.hrtime();
let   startingTime;
// Module to control application life.
const electron = require('electron');
const fs       = require('fs');
const ipc      = electron.ipcMain;
const {app, BrowserWindow, protocol} = electron;
const {dialog} = electron;

const mainFile  = 'sys/framework.html';
let   appLoaded = false;

// Define reserved protocols
let protocols = ['http', 'https'], protocolsRedist = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

app.on('ready', function() {
  // Main application private protocol
  ipc.on('get-startup', (event, arg) => {
    // Send data to the application
    event.returnValue = { argv: process.argv, startingTime: startingTime };
  });

  /* === Define some services === */

  // Protocol reservation
  // e.g. arg = 'http'
  ipc.on('reserve-protocol', (event, arg) => {
    if(typeof arg !== 'string')
      event.returnValue = false;

    if(protocols.includes(arg))
      event.returnValue = false;
    else {
      protocols.push(arg);
      protocol.registerBufferProtocol(arg, (request, callback) => {
      protocolsRedist.unshift(callback);

      event.sender.send(arg + '-protocol-request', {name: arg, request: request});
      }, (error) => {
        if(error)
          event.returnValue = false;
      });

      if(event.returnValue !== false)
        event.returnValue = true;
    }
  });

  // e.g. arg = {mimeType: 'text/html', data: new Buffer('Hello <em>world</em> !')}
  ipc.on('protocol-response', (event, arg) => {
    protocolsRedist.pop()(arg);
  });

  // Display a fatal error on a system's dialog box
  ipc.on('fatal-error', (event, arg) => {
    if(!Array.isArray(arg) || typeof arg[0] !== 'string' || typeof arg[1] !== 'string')
      event.returnValue = false;

    // Show the error dialog
    error(arg[0], `An error occured while running NightOS. Please read the following message and click "OK". The application will close.\n\n${arg[1]}`);
  });

  // Reload the application
  ipc.on('reload', reload);

  // Open/close the developper tools
  ipc.on('devtools', (event, arg) => {
    if(typeof arg !== 'boolean')
      event.returnValue = false;
    else {
      if(arg === true)
        mainWindow.webContents.openDevTools();
      else
        mainWindow.webContents.closeDevTools();

      event.returnValue = true;
    }
  });

  /* === */

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // Remove the menu bar...
  mainWindow.setMenu(null);

  // And go fullscreen !
  mainWindow.setFullScreen(true);

  // Emitted when the page is re-loaded
  mainWindow.webContents.on('did-start-loading', function() {
    // If the application was already loaded
    if(appLoaded) {
      // If reload is not allowed...
      if(!process.argv.includes('--allow-reload'))
        error('Reload is forbidden', 'For security reasons, application cannot be reloaded while still running.\nThe application will be closed. Please run it again.', true);
      else
        reload();
    }

    startingTime = (process.hrtime()[0] * 1000 + process.hrtime()[1] / 1000000) - (started[0] * 1000 + started[1] / 1000000);
    appLoaded    = true;
  });

  // Emitted when the page fails to load
  mainWindow.webContents.on('did-fail-load', function(event, errorCode, errorDescription, validatedURL, isMainFrame) {
    error('Loading failed', 'Failed to load NightOS resources. Please load the application again.\nError : ' + errorCode + ', ' + errorDescription);
  });

  // Load the index.html of the app.
  mainWindow.loadURL('file:///' + (process.argv.includes('--main-frame') ? process.argv[process.argv.indexOf('--main-frame') + 1] : mainFile));

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if(process.platform !== 'darwin')
    app.quit()
});
