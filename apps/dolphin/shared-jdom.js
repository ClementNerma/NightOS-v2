'use strict';

/** Get the computed style of an element
  * @param {string} tag The element's tag
  * @return {CSSStyleDeclaraion}
  */
function getElementComputedStyle(tag) {
  let el = document.createElement(tag);
  el.style.display = 'none';
  document.body.appendChild(el);
  let style = ("getComputedStyle" in window) ? window.getComputedStyle(el, "") : el.currentStyle;
  document.body.removeChild(el);
  return style;
}

/**
  * Get the element default's display ('inline' 'inline-block' 'block')
  * @param {string} tag The element's tag
  * @return {string}
  */
function getElementDefaultDisplay(tag) {
  return getElementComputedStyle(tag).display;
}

/* Contains all running animations */
let Animations = [];

/**
  * Animation class
  * @constructor
  * @param {JCollection} nel Element to animate
  * @param {object} ...
  // NOTE: Place the setInterval in Animation.start();
  */
let Animation = function(nel /* JCollection */, css, duration, callback) {

  // Current frame
  let frame  = 0;
  // Total duration, in frames
  duration = duration / 13;

  // If the number of durations is a decimal number, make an around to the superior number
  if(duration % 1)
    duration = Math.floor(duration) + 1;

  // cssStart: CSS rules of the element at the start
  // cssAtFinish: CSS rules to apply only at the end of the animation (rules that can't progress, like {display: 'none'})
  let cssStart = {}, cssAtFinish = {};

  // for each rule to animate
  for(let i in css) {
    // If the final value is NOT a number
    if(Number.isNaN(parseInt(css[i]))) {
      // Change the rule only at the end of the animation, because it can't progress (like 'display' property)
      cssAtFinish[i] = css[i];
      // Delete it from the rules to animate
      delete css[i];
    } else { // If the final value is a number
      // If it's a string, make it a number to gain speed during animation
      css[i]    = parseInt(css[i]);
      // Look to the value of this rule before the beginning of the animation
      cssStart[i] = parseInt(nel.css(i)) || 0;
    }
  }

  // Perform a frame
  this.step  = () => {
    // Increase the current frame
    frame += 1;

    // If the limit is reached
    // NOTE : The >= symbol permit to stop the animation even if this function is running two times at the same time because of a bug
    if(frame >= duration) {
      // For each rule to change only at the end (like 'display')
      for(let i in cssAtFinish)
        // Change it !
        nel.css(i, cssAtFinish[i]);

      // Clear the interval
      clearInterval(this.timer);
      // Remove this animation from the running animations list
      delete Animations[this.id];

      // Run the callback (if there is one)
      if(typeof callback === 'function')
        callback.apply(this, [this]);

      // Quit the function to not perform a new changing
      return ;
    }

    // For each rule to change dynamically
    for(let i in css)
      // Change it !
      nel.css(i, cssStart[i] + (css[i] - cssStart[i]) * (frame / duration));
  };

};

/** The JElement static library
  * @type {object} */
const JElement = {
  /**
    * Get element's tag's name
    * @return {string}
    */
  tag (element) { return element.tagName.toLocaleLowerCase(); },

  /**
    * Get the parent element
    * @returns {JCollection}
    */
  parent (element) {
    return JCollection(element.parentElement);
  },

  /**
    * Read or write an attributes. NOTE : Some attributes of forbidden in safe mode
    * @param {string} attr Attribute
    * @param {string} [value] Value
    * @return {string} Attrbute's value
    */
  attr (element, attr, value) {
    // If a value was specified
    if(typeof value !== 'undefined')
      // Else, set the attribute
      element.setAttribute(attr, value);
      return element;

    // Return the attribute's value
    return element.getAttribute(attr);
  },

  /**
    * Read or write the element's content
    * @param {string} [content] Content, in NTML or HTML format
    */
  html (element, content) {
    // If a content was specified
    if(typeof content !== 'undefined') {
      // Set it after parsing
      element.innerHTML = content;
      return element;
    }

    // Return the element's content
    return element.innerHTML;
  },

  /**
    * Check if has a CSS class
    * @param {string} cl Class name
    * @return {boolean}
    */
  hasClass (element, cl) {
    return element.classList.contains(cl);
  },

  /**
    * Add a CSS class
    * @param {string} cl Class name
    */
  addClass (element, cl) {
    element.classList.add(cl);
    return element;
  },

  /**
    * Remove a CSS class
    * @param {string} cl Class name
    */
  removeClass (element, cl) {
    element.classList.remove(cl);
    return element;
  },

  /**
    * Toggle a CSS class : If the class is present, it will be removed, else it will be added
    * @param {string} cl
    */
  toggleClass (element, cl) {
    if(element.classList.contains(cl))
      element.classList.remove(cl);
    else
      element.classList.add(cl);

    return element;
  },

  /** Remove the element */
  remove (element) { element.remove(); },

  /** Get all the element's children
    * @return {JCollection}
    */
  children (element) { return JCollection(element.children); },

  /**
    * Set or get a CSS rule
    * @param {string} rule CSS rule's name
    * @param {string|number} [value] CSS rule's value
    * @return {string} CSS rule's value
    */
  css (element, rule, value) {
    // If a value was specified
    if(typeof value !== 'undefined') {
      // If the value is a number and is not a numeric CSS value
      if((typeof value === 'number' || !Number.isNaN(parseInt(value))) && CSSNumber.indexOf(rule) === -1)
        // Turn it into pixel
        element.style[rule] = value + 'px';
      else
        // Else, set it, simply
        element.style[rule] = value;

      return element;
    }

    // Return the rule's value
    return element.style[rule];
  },

  /**
    * Append an element as a children of this element
    * @param {Element|JElement} child
    */
  append (element, child) {
    if(child instanceof Element)
      element.appendChild(child);
    else if(Array.isArray(element))
      child.appendTo(this);
    else
      return false;

    return element;
  },

  /**
    * Append this element as a child of a parent
    * @param {Element|JElement} parent
    */
  appendTo (element, parent) {
    parent.append(element);
    return element;
  },

  /** Hide this element */
  hide (element) {
    return this.css(element, 'display', 'none');
  },

  /** Show this element */
  show (element) {
    return this.css(element, 'display', getElementDefaultDisplay(element.tagName));
  },

  /**
    * Get the first child
    * @returns {JCollection|void}
    */
  first (element) {
    return new JCollection([element.firstChild]);
  },

  /**
    * Get the last child
    * @returns {JCollection|void}
    */
  last (element) {
    return new JCollection([element.lastChild]);
  },

  /**
    * Perform a query on the element
    * @param {string} query
    * @returns {JCollection}
    */
  find (element, query) {
    return JCollection(element.querySelectorAll(query));
  },

  /**
    * Fade in
    * @param {number} [duration] In miliseconds, default is 3000 ms
    */
  fadeIn (element, duration) {
    return this.animate(element, {
      opacity: 1
    }, duration || 3000);
  },

  /**
    * Fade out
    * @param {number} [duration] In miliseconds, default is 3000 ms
    */
  fadeOut (element, duration) {
    return this.animate(element, {
      opacity: 0
    }, duration || 3000);
  },

  /**
    * Animate some CSS rules of the element
    * @param {object} css CSS rules (rule is the key)
    * @param {number} duration In miliseconds
    * @param {function} [callback] Callback, called after the end of the animation
    */
  animate (element, css, duration, callback) {
    let animation = new Animation(this, css, duration, callback);
    Animations.push(animation);
    animation.id = Animations.length - 1;

    let timer = setInterval(animation.step, 13);
    animation.timer = timer;
    return animation;
  } // DEMO : element.animate({display: 'block', opacity: 1, height: 400});
};

/**
  * Create a Night Collection
  * @param {Array} collection Collection of Element
  * @returns {Array} Collection of JElement
  */
function JCollection(collection) {
  // If there is no collection OR no elements into
  if(!collection || !collection.length)
    // Return an empty Night Collection
    collection = [];

  /** The collection
    * @type {Array} */
  let c = [], i;

  // For each element of the specified collection
  for(i = 0; i < collection.length; i += 1)
    c.push(collection[i]);

  // For each method of <JElement>...
  for(let item of Reflect.ownKeys(JElement))
    c[item] = eval(`
    (function () {
      let out = [], broke = false;

      for(let item of this) {
        out.push(item ?
          JElement.${item}.apply(JElement, [item].concat(Array.apply(null, arguments))) :
          null
        );

        if(!broke && out[out.length - 1] && !(out[out.length - 1] instanceof Element))
          if(!Array.isArray(out[out.length - 1]) || !(out[out.length - 1] instanceof Element))
          broke = true;
      }

      return broke ? (out.length > 1 ? out : out[0]) : JCollection(out);
    });`);

  /**
    * Get an element of the Night Collection
    * @param {number} i Element's index
    * @return {JCollection}
    */
  c.get = function(i) {
    return this[i];
  };

  // Return the collection
  return c;
};

/** The CSS properties that must be a number
  * @type {array} */
const CSSNumber = ["columnCount", "fillOpacity", "flexGrow", "flexShrink", "fontWeight", "lineHeight", "opacity", "order", "orphans", "widows", "zIndex", "zoom"];;

// Export
$export.$ = { $: (query) => JCollection(document.querySelectorAll(query)), JElement, JCollection, CSSNumber };
