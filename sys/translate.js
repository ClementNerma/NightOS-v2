/*
  This file is the translation library. It loads and parse the translation
  packages, and perform the asked translations.
*/

'use strict';

// NOTE: All texts are translated from the native system language (english).
/**
  * Translate a text
  * @param {string} text
  * @param {object} [vars]
  * @param {string} [lang] Translate to a specific language (default: the system's language)
  * @returns {string|NightError}
  */
const translate = (text, vars = {}, lang = language) => {
  // If the translation language is different from the current one
  // AND if the language is the system's native one...
  // AND the system's native language's package was loaded (to prevent errors)
  if(lang && lang !== DEFAULT_LANGUAGE && tr_packages.hasOwnProperty(DEFAULT_LANGUAGE)) {
    // If the translation package is not found for this language...
    if(!tr_packages.hasOwnProperty(lang))
      return new NightError('Unknown language "${lang}"', {lang});

    /** The text's index in the original package
      * @type {number} */
    let index = tr_packages[DEFAULT_LANGUAGE].indexOf(text);

    // If a translation is found for this string...
    // AND if the text is translated in the package...
    if(index !== -1 && typeof tr_packages[lang][index] === 'string')
      text = tr_packages[lang][index];
  }

  // Parse the variables and return the result
  return text.replace(/(#|\$)\{([a-zA-Z0-9_]+)\}/g, (m, h, name) => {
    // Return the variable's value, else the shell variable's value
    return vars.hasOwnProperty(name) ? vars[name] : (shell_vars.hasOwnProperty(name) ? shell_vars[name] : name);
  });
};

// Define an alias
const tr = translate;

/**
  * Load a translation package
  * @param {string} lang The language to load
  * @param {boolean} [setAsCurrent] Set the language as the current one
  * @returns {NightError|void}
  */
const load_translation = (lang, setAsCurrent = false) => {
  /** The package's content
    * @type {string|object} */
  let pkg;

  // Try to load the package file
  try { pkg = fs.readFileSync(n('/sys/data/translations/' + lang + '.ntp', true), SYSTEM_ENCODING); }
  catch(e) {
    let err = new NightError('Failed to load the translation package file for "${lang}"', {lang, jsError: e});
    UI.showError(err);
    return err;
  }

  // Parse it
  try { pkg = JSON.parse(pkg); }
  catch(e) {
    let err = new NightError('Failed to parse the translation package, not a valid JSON file for "${lang}"', {lang, jsError: e});
    UI.showError(err);
    return err;
  }

  // If asked, set this language as the current one
  if(setAsCurrent)
    language = lang;

  // Add the parsed package to the collection
  tr_packages[language] = pkg;
};

/** The loaded translation packages
  * @type {object} */
let tr_packages = {};

/** The loaded packages (used by the 'translate' module)
  * @type {array} */
let tr_loaded = [];
