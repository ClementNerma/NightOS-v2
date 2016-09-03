/*
   Here is the launching file of NightOS. It defines some global and immutable
   functions and some useful constants. It checks that the application was not
   reloaded, and do some little stuff.
*/

'use strict';

// Define some constants from Node.js modules
const electron = IS_MAIN ? require('electron') : null;
const ipc      = IS_MAIN ? electron.ipcRenderer : null;
const child_process = IS_MAIN ? require('child_process') : null;
const optimist = IS_MAIN ? require('optimist') : null;

// Store got informations into a variable (argv, ...)
const startupArgs = IS_MAIN ? ipc.sendSync('get-startup') : null;
const argv = IS_MAIN ? optimist(startupArgs.argv).argv : childReady.argv;

const path = require('path');
const fs   = require('fs');

// Define an alias because some functions have a 'path' argument.
const $path    = path;

/* =========================
 * = Define some functions =
 * ========================= */

/**
  * Register a variable as a cyclic constant
  * @param {object} o Variable to make constant
  * @returns {object}
  */
const deepFreeze = function(o) {
  Object.freeze(o);

  for(let key of keys(o))
    if (o.hasOwnProperty(key)
    && o[key] !== null
    && (typeof o[key] === "object" || typeof o[key] === "function")
    && !Object.isFrozen(o[key]))
      deepFreeze(o[key]);

  return o;
};

/**
  * Get all keys of an object
  * @param {object} obj
  * @returns {array}
  */
const keys = (obj) => {
  return Reflect.ownKeys(obj);
};

/**
    * Clone an object, contains fixes for the Radu Simionescu's clone function
    * http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object?page=2&tab=active#tab-top
    * @param {*} oReferance
    * @return {*}
    */
const cloneObject = function(oReferance) {
  var aReferances = new Array();
  var getPrototypeOf = function(oObject) {
    if(typeof(Object.getPrototypeOf)!=="undefined")
      return Object.getPrototypeOf(oObject);

    var oTest = new Object();

    if(typeof(oObject.__proto__)!=="undefined" && typeof(oTest.__proto__)!=="undefined" && oTest.__proto__===Object.prototype)
      return oObject.__proto__;

    if(typeof(oObject.constructor)!=="undefined" && typeof(oTest.constructor)!=="undefined" && oTest.constructor===Object && typeof(oObject.constructor.prototype)!=="undefined")
      return oObject.constructor.prototype;

    return Object.prototype;
  };

  var recursiveCopy = function(oSource) {
    if(typeof(oSource)!=="object")
      return oSource;

    if(oSource===null)
      return null;

    for(var i = 0; i < aReferances.length; i++)
      if(aReferances[i][0]===oSource)
        return aReferances[i][1];

    if(Array.isArray(oSource)) {
      var oCopy = [];
      oCopy.prototype = getPrototypeOf(oSource);
      aReferances.push([oSource, oCopy]);

      for(var k in oSource)
        oCopy[k] = recursiveCopy(oSource[k]);
    } else {
      var Copy = new Function();
      Copy.prototype = getPrototypeOf(oSource);
      var oCopy = new Copy();
      aReferances.push([oSource,oCopy]);

      for(var sPropertyName in oSource) {
        if(oSource.hasOwnProperty(sPropertyName))
          oCopy[sPropertyName] = recursiveCopy(oSource[sPropertyName]);
      }
    }

    return oCopy;
  };

  return recursiveCopy(oReferance);
};

/**
  * Join an array
  * @param {string} before
  * @param {string} after
  * @returns {string}
  */
Array.prototype.joinParts = function(before, after) {
  return before + this.join(after + before) + after;
};

/**
  * Get the last item of an array
  * @returns {*}
  */
Array.prototype.last = function() {
  return this[this.length - 1];
};
