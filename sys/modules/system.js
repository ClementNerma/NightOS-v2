/*
  This file is the system module. It can only be used by the applications
  launched with system privileges.
*/

// If the application is not launched with system privileges...
if(runtime.ticket.level < ROOT_LEVEL)
  // Throw an error
  error(tr('System privileges are required to access the "system" module'));

// Give the 'process' access
$export.process = process;
// Give the 'window' access
$export.window = window;
