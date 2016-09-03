/*
  This file defines a lot of system constants which contains some informations
  such as size limits, encoding...
*/

/** The system files encoding
  * @type {string} */
const SYSTEM_ENCODING = 'utf-8';

/** The maximum module size that can be cached
  * @type {number} */
const MAX_MODULE_CACHE_LENGTH = 128 * 1024; // 128 kb

/** The directory separator
  * @type {string} */
const DIR_SEP = path.sep;
// Alias
const DS = DIR_SEP;

/** A regexp to match the directory separator on all common systems
  * @type {RegExp} */
const SEP_REGEXP = /\/|\\/g;

/** The process current working directory (CWD)
  * @type {string} */
const PROCESS_PATH = process.cwd();
// Define an alias
const BASE_DIR     = process.cwd();

/** The system directory
  * @type {string} */
const SYS_DIR = path.join(BASE_DIR, 'sys');

/** The data directory
  * @type {string} */
const DATA_DIR = path.join(SYS_DIR, 'data');

/** The modules directory
  * @type {string} */
const MODULES_DIR = path.join(SYS_DIR, 'modules');

/** The NoAccess level
  * @type {number} */
const NOACCESS_LEVEL = 1;

/** The guest level
  * @type {number} */
const GUEST_LEVEL = 2;

/** The standard user level
  * @type {number} */
const USER_LEVEL = 3;

/** The administrator level
  * @type {number} */
const ADMIN_LEVEL = 4;

/** The system (root) level
  * @type {number} */
const ROOT_LEVEL = 5;

/** The setup file's content
  * @type {string|object} */
let content;

// Read the setup file
try { content = fs.readFileSync(DATA_DIR + DS + 'setup.json', SYSTEM_ENCODING); }
catch(e) { error('Failed to read the setup file', e); }

// Parse the setup file
try { content = JSON.parse(content); }
catch(e) { error('The setup file is not a valid JSON content', e); }

// Define the setup file as a constant
const setup = content;

/** The system's language
  * @type {string} */
let language = setup.language || null;

/** Is this the first run of the system on this computer ?
  * @type {boolean} */
const FIRST_RUN = !setup.installed;

/** Is the debug mode enabled ?
  * @type {boolean} */
const DEBUG_MODE = argv['debug'] || argv['force-debug'] || setup.debugMode;
