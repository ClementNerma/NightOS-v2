/*
  This is the translate module. It permit to translate a text from english to
  another language using a translation package.
*/

/**
  * Load a translation package from the disk
  * @param {string} lang
  * @param {string} path
  * @returns {void|NightError}
  */
$export.load = (lang, path) => {
  // Format the path
  path = n(path, true);

  // If this package was already loaded...
  if(tr_loaded.includes(path))
    return new NightError('The package "${path}" was already loaded', {path});

  // Check the permissions
  if(!Night.isAllowed(runtime.ticket, 'file/read', path))
    return new NightError('Ticket is not allowed to read the file "${path}"', {path});

  // Try to load the package file
  try { pkg = fs.readFileSync(n(lang + '.ntp', true), SYSTEM_ENCODING); }
  catch(e) {
    let err = new NightError('Failed to load the translation package file for "${lang}"', {lang});
    Night.showError(err);
    return err;
  }

  // Parse it
  try { pkg = JSON.parse(pkg); }
  catch(e) {
    let err = new NightError('Failed to parse the translation package, not a valid JSON file for "${lang}"', {lang});
    Night.showError(err);
    return err;
  }

  // Set the file as loaded
  tr_loaded.push(path);

  // Load the package
  $export.load_translation(lang, pkg);
};

/**
  * Load a translation package
  * @param {string} lang
  * @param {object} pkg
  * @returns {void}
  */
$export.load_translation = (lang, pkg) => {
  // If no package was stored in memory for this language...
  if(!tr_packages.hasOwnProperty(lang))
    // Create one (empty)
    tr_packages[lang] = {};

  for(let english of Reflect.ownKeys(pkg))
    tr_packages[lang][english] = pkg[english];
};

/**
  * Check if a translation package was already loaded
  * @param {string} path
  * @returns {boolean}
  */
$export.loaded = path => tr_loaded.includes(n(path, true));

/**
  * Translate a text
  * @param {string} text
  * @param {object} [vars]
  * @param {string} [lang] Translate to a specific language (default: the system's language)
  * @returns {string|NightError}
  */
$export.translate = (text, vars = {}, lang = language) => translate(text, vars, lang);

/** The system's language
  * @type {void|string} */
$export.__defineGetter__('language', () => language);
