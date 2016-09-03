'use strict';

// Require some Node.js modules
const electron = require('electron');
const child_process = require('child_process');

// Spawn a new process for running electron
child_process.spawn(electron, ['.'].concat(process.argv.slice(2)), {
  cwd: __dirname
});
