/*
  This file is the setup manager. It consider the command-line options and will
  also permit to choose between different boot modes (recovery, ....).
*/

/* =======================
 * = Setup consideration =
 * ======================= */

// Crash the application (if asked)
if(argv['force-crash'])
  error(tr('System was forced to crashed (--force-crash specified)'));

// Load a startup script (if asked)
if(argv['load-script']) {
  /** The script's content
    * @type {string} */
  let file;

  // Get the script's content
  try { file = fs.readFileSync(n(argv['load-script'], true), argv['load-script-encoding'] || SYSTEM_ENCODING); }
  // If fail...
  catch(e) { error(`Failed to load the startup script "${argv['load-script']}"`, e); }

  // Make a DOM element
  /** The script's DOM element
    * @type {Element} */
  let script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.innerHTML = file;
  document.body.appendChild(script);
}
