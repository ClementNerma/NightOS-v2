/*
  This library permit to make a restricted document from an HTML element (the
  most time the <body> tag). This is useful when an application wants to manage
  an HTML frame without making security issues (like window.top).
  The most part of DOM features are implemented here.

  Revision 2
*/

'use strict';

// NOTE: Elements are unable to access to the parent of their document.
//       doc.tree.parentElement or doc.tree.children[0].parentElement.parentElement will return the 'null' value
// NOTE: The 3rd party code can access to NightElement or NightDocument :
//       element.constructor, doc.constructor... but CANNOT modify them

/**
  * NightElement class
  * @constructor
  * @param {Element} element HTML DOM element
  * @param {Element} main The main DOM element
  */
const NightElement = function(element, main) {
  /**
    * Make an elements collection
    * @param {array} collection
    * @param {Element} main The main DOM tree
    * @returns {array}
    */
  function makeCollection(collection, main) {
    let out = [];

    for(let item of collection)
      out.push(new NightElement(item, main));

    return out;
  }

  // Check arguments
  if(!(element instanceof Element) || !(main instanceof Element))
    throw new Error('Illegal arguments for NightElement : Requires two DOM elements');

  // Define setters for special attributes
  this.__defineSetter__('className', name => element.className = name);
  this.__defineSetter__('id', id => element.id = id);
  this.__defineSetter__('innerHTML', content => element.innerHTML = NightDocument.safe(content));
  this.__defineSetter__('innerNTML', content => element.innerHTML = NightDocument.parse(content, true));

  // Define getters for simple attributes
  this.__defineGetter__("accessKey", () => element.accessKey);
  this.__defineGetter__("childElementCount", () => element.childElementCount);
  this.__defineGetter__("className", () => element.className);
  this.__defineGetter__("clientHeight", () => element.clientHeight);
  this.__defineGetter__("clientLeft", () => element.clientLeft);
  this.__defineGetter__("clientTop", () => element.clientTop);
  this.__defineGetter__("clientWidth", () => element.clientWidth);
  this.__defineGetter__("contentEditable", () => element.contentEditable);
  this.__defineGetter__("dir", () => element.dir);
  this.__defineGetter__("id", () => element.id);
  this.__defineGetter__("innerHTML", () => element.innerHTML);
  this.__defineGetter__("isContentEditable", () => element.isContentEditable);
  this.__defineGetter__("lang", () => element.lang);
  this.__defineGetter__("namespaceURI", () => element.namespaceURI);
  this.__defineGetter__("nodeName", () => element.nodeName);
  this.__defineGetter__("nodeType", () => element.nodeType);
  this.__defineGetter__("nodeValue", () => element.nodeValue);
  this.__defineGetter__("offsetHeight", () => element.offsetHeight);
  this.__defineGetter__("offsetWidth", () => element.offsetWidth);
  this.__defineGetter__("offsetLeft", () => element.offsetLeft);
  this.__defineGetter__("offsetTop", () => element.offsetTop);
  this.__defineGetter__("scrollHeight", () => element.scrollHeight);
  this.__defineGetter__("scrollLeft", () => element.scrollLeft);
  this.__defineGetter__("scrollTop", () => element.scrollTop);
  this.__defineGetter__("scrollWidth", () => element.scrollWidth);
  this.__defineGetter__("tabIndex", () => element.tabIndex);
  this.__defineGetter__("tagName", () => element.tagName);
  this.__defineGetter__("textContent", () => element.textContent);
  this.__defineGetter__("title", () => element.title);

  // Define getters for attributes that returns an element
  this.__defineGetter__("firstChild", () => element.firstChild ? new NightElement(element.firstChild, main) : element.firstChild);
  this.__defineGetter__("firstElementChild", () => element.firstElementChild ? new NightElement(element.firstElementChild, main) : element.firstElementChild);
  this.__defineGetter__("firstChild", () => element.firstChild ? new NightElement(element.firstChild, main) : element.firstChild);
  this.__defineGetter__("lastElementChild", () => element.lastElementChild ? new NightElement(element.lastElementChild, main) : element.lastElementChild);
  this.__defineGetter__("nextSibling", () => element.nextSibling ? new NightElement(element.nextSibling, main) : element.nextSibling);
  this.__defineGetter__("nextElementSibling", () => element.nextElementSibling ? new NightElement(element.nextElementSibling, main) : element.nextElementSibling);
  this.__defineGetter__("offsetParent", () => element.offsetParent ? new NightElement(element.offsetParent, main) : element.offsetParent);
  this.__defineGetter__("parentElement", () => (element === main) ? null : (element.parentElement ? new NightElement(element.parentElement, main) : element.parentElement));
  this.__defineGetter__("previousSibling", () => element.previousSibling ? new NightElement(element.previousSibling, main) : element.previousSibling);
  this.__defineGetter__("previousElementSibling", () => element.previousElementSibling ? new NightElement(element.previousElementSibling, main) : element.previousElementSibling);

  /**
    * Append an element as a children of this element
    * @param {Element|NightElement} child
    * @returns {void|NightError}
    */
  this.appendChild = (child) => {
    if(child instanceof Element) {
      if(child.outerHTML !== NightDocument.safe(child.outerHTML))
        return new NightError('Element safety mismatch : Can\'t append an unsafe element to a safe element');

      element.appendChild(child);
    } else if(child instanceof NightElement)
      child.appendTo(this);
    else
      return new NightError('Unknown element type, can\'t append it');
  };

  /**
    * Append this element as a child of a parent
    * @param {NightElement|Element} parent
    * @returns {void|NightError}
    */
  this.appendTo = (parent) => {
    if(parent instanceof Element)
      //parent.appendChild(element);
      (new NightElement(parent, main)).appendChild(element, main);
    else if(parent instanceof NightElement)
      parent.appendChild(element);
    else
      return new NightError('Unknown element type, can\'t append this element to it');
  };

  /**
    * Emit: blur
    * @returns {void}
    */
  this.blur = () => { element.blur(); return ; };

  /**
    * Emit: click
    * @returns {void}
    */
  this.click = () => { element.click(); return ; };

  /**
    * Clone the element
    * @returns {NightElement}
    */
  this.cloneNode = () => new NightElement(element.cloneNode(), main);

  /**
    * Compare the position into the document
    * @param {NightElement} el
    * @returns {boolean}
    */
  this.compareDocumentPosition = el => el.documentPositionComparedTo(element);

  /**
    * Compare the position into the document
    * @param {NightElement|Element} el
    * @returns {boolean}
    */
  this.documentPositionComparedTo = (el) => {
    if(el instanceof Element)
      return el.compareDocumentPosition(element);
    else if(el instanceof NightElement)
      return el.compareDocumentPosition(this);
  };

  /**
    * Check if the element contains another
    * @param {NightElement} el
    * @returns {boolean}
    */
  this.contains = (el) => el.isContained(element);

  /**
    * Check if the element is contained into another
    * @param {NightElement|Element} el
    * @returns {boolean}
    */
  this.isContained = (el) => {
    if(el instanceof Element)
      return el.contains(element);
    else if(el instanceof NightElement)
      return el.contains(this);
  };

  /**
    * Emit: focus
    * @returns {void}
    */
  this.focus = () => { element.focus(); return ; };

  /**
    * Get an element's attribute
    * @param {string} attr Attribute
    * @returns {number|string|void} Attribute's value
    */
  this.getAttribute = (attr) => element.getAttribute(attr);

  // NOTE: Ignored 'getAttributeNode()'

  /**
    * Get an elements collection by class name
    * @param {string} name
    * @returns {NightCollection}
    */
  this.getElementsByClassName = name => makeCollection(element.getElementsByClassName(name), main);

  /**
    * Get an elements collection by tag name
    * @param {string} tag
    * @returns {NightCollection}
    */
  this.getElementsByTagName = name => makeCollection(element.getElementsByTagName(name), main);

  /**
    * Check if the element has a given attribute
    * @param {string} name
    * @returns {boolean}
    */
  this.hasAttribute = name => element.hasAttribute(name);

  /**
    * Check if the element has any attributes
    * @returns {boolean}
    */
  this.hasAttributes = () => element.hasAttributes();

  /**
    * Check if the element has any child nodes
    * @returns {boolean}
    */
  this.hasChildNodes = () => element.hasChildNodes();

  /**
    * Insert an element before another
    * @param {NightElement} el1
    * @param {NightElement} el2
    * @returns {void}
    */
  this.insertBefore = (el1, el2) => {
    el1.__insertBeforeS(element, el2);
  };

  /**
    * First callback for @insertBefore
    * @param {Element} parent
    * @param {NightElement} after This element must be insert before this one
    * @returns {void}
    */
  this.__insertBeforeS = (parent, after) => {
    el2.__insertBefore(parent, element);
  };

  /**
    * Second callback for @insertBefore
    * @param {Element} parent
    * @param {Element} before Element to insert before this one
    * @returns {void}
    */
  this.__insertBefore = (parent, before) => {
    parent.insertBefore(before, after);
  };

  /**
    * Check if a given namespace is the element's default one
    * @param {string} namespaceURI
    * @returns {boolean}
    */
  this.isDefaultNamespace = namespaceURI => element.isDefaultNamespace(namespaceURI);

  /**
    * Check if two nodes are equals
    * @param {NightElement|Element} el
    * @returns {boolean}
    */
  this.isEqualNode = (el) => {
    if(el instanceof Element)
      return element.isEqualNode(el);
    else if(el instanceof NightElement)
      return el.isEqualNode(element);
  };

  /**
    * Check if two nodes are the same
    * @param {NightElement|Element} el
    * @returns {boolean}
    */
  this.isSameNode = (el) => {
    if(el instanceof Element)
      return element.isSameNode(el);
    else if(el instanceof NightElement)
      return el.isSameNode(element);
  };

  /**
    * Check if the element supports a given feature
    * @param {string} name
    * @returns {boolean}
    */
  this.isSupported = name => element.isSupported(name);

  /**
    * W3C: Joins adjacent text nodes and removes empty text nodes in the element
    * @returns {void}
    */
  this.normalize = () => { element.normalize(); return ; };

  /**
    * Get the first child that matches with the selector
    * @param {string} selector
    * @returns {NightElement|void}
    */
  this.querySelector = (selector) => {
    let found = element.querySelector(selector);
    return found ? new NightElement(selector, main) : null;
  };

  /**
    * Get all children that matches with the selector
    * @param {string} selector
    * @returns {NightCollection}
    */
  this.querySelectorAll = selector => makeCollection(element.querySelectorAll(selector), main);

  /**
    * Remove an attribute from the element
    * @param {string} name
    * @returns {void}
    */
  this.removeAttribute = name => { element.removeAttribute(name); return ; };

  // NOTE: Ignored 'removeAttributeNode'

  /**
    * Remove a child from the element
    * @param {NightElement|Element} child
    * @returns {void}
    */
  this.removeChild = (child) => {
    if(child instanceof Element)
      element.removeChild(child);
    else if(child instanceof NightElement)
      child.removeFrom(element);
  };

  /**
    * Remove the element from a parent
    * @param {NightElement|Element} parent
    * @returns {void}
    */
  this.removeFrom = (parent) => {
    if(parent instanceof Element)
      parent.removeChild(element);
    else if(parent instanceof NightElement)
      parent.removeChild(element);
  };

  // NOTE: Ignored 'setAttributeNode'

  /**
    * Remove an event listener
    * @param {string} eventName
    * @param {function} callback
    * @param {boolean} [useCapture] W3C: The event phase to remove the event handler from
    * @returns {void}
    */
  this.removeEventListener = (eventName, callback, useCapture) => { element.removeEventListener(eventName, callback, useCapture); return ; };

  // NOTE: Ignored 'item'

  /**
    * Set an element's attribute
    * @param {string} attr Attribute
    * @param {string} value Value
    * @returns {void}
    */
  this.setAttribute = (attr, value) => {
    // If the document is in safe mode and the attribute is forbidden (like 'onclick' 'onmousemove' and all DOM events)
    if(NightDocument.DOMEvents.includes(attr.substr(2)))
      // Make an error
      return new NightError('Can\'t set attribute "${attr}" because document is in safe mode', {attr});

    // Else, set the attribute
    element.setAttribute(attr, value);
  };

  /**
    * Remove the element
    * @returns {void}
    */
  this.remove = () => { element.remove(); };

  /**
    * Get the element's CSS rules
    */
  this.__defineGetter__('style', () => element.style);

  /**
    * Get the element's children
    */
  this.__defineGetter__('children', () => makeCollection(element.children, main));

  // NOTE: Ignored getters for 'attributes' 'childNodes' 'classList' 'ownerDocument' 'parentNode' 'length'

  // Freeze this object to make malicious applications unable to modify functions and get the DOM main tree
  Object.freeze(this);
};

/**
  * NightDocument class
  * @constructor
  * @param {string} [content] NTML or HTML content
  * @param {string} [tagName] The DOM main tree tag's name. Default: div
  * @param {boolean} [dontMark] Don't mark this div with attributes to recognize a Night Document. Default: false
  */
let NightDocument = function(content = '', tagName = 'div', dontMark = false) {
  // This is the main DOM tree, which will contains all of the other elements
  let dom = document.createElement(tagName);

  // If the document can be marked to recognize it's a Night Document
  if(!dontMark)
    dom.setAttribute('night-role', 'document');

  /**
    * Get the main DOM tree as a Night Element
    * @type {NightElement}
    */
  this.tree = new NightElement(dom, dom); // Make a NightElement and disable the 'parentElement' property

  /**
    * Append the document to a DOM Element
    * @param {Element} The DOM Element
    */
  this.appendTo = (element) => {
    element.appendChild(dom);
  };

  /**
    * Create an element from a tag name
    * @param {string} tagName The element's tag name (like 'span' or 'div')
    * @returns {NightElement}
    */
  this.createElement = (tagName) => {
    return !NightDocument.UnsafeTags.includes(tagName) ? new NightElement(document.createElement(tagName), dom) : false;
  };

  // Freeze this object to make malicious applications unable to modify functions and get the DOM main tree
  Object.freeze(this);
};

/**
  * Make a content safe
  * @param {string} content
  * @returns {string}
  */
NightDocument.safe = (content) => {
  // Create a DOM Element
  let tmp = document.createElement('div'), i, j;
  // Set the HTML content as his content
  tmp.innerHTML = content;

  // Remove all dangerous elements, like `script` or `iframe`, specified in NightDocument.UnsafeTags
  let collection = tmp.querySelectorAll(NightDocument.UnsafeTags.join(','));
  for(i = 0; i < collection.length; i += 1)
    collection[i].remove();

  // Remove all JS event attributes, like 'onclick' or 'onmouseover', specified in NightDocument.DOMEvents
  collection = tmp.querySelectorAll(NightDocument.DOMEvents.joinParts(',[on', ']').substr(1));

  for(element of collection)
    for(event of NightDocument.DOMEvents)
      element.removeAttribute('on' + event);

  return tmp.innerHTML;
};

/**
  * Parse a NTML content to make HTML. NOTE : This works with HTML, but that's useless.
  * @param {string} content NTML content
  * @param {boolean} [safe] Returns a safe HTML content
  * @returns {string} HTML content
  */
NightDocument.parse = (content, safe = false) => {
  if(!content)
    return '';

  // Perform some *little* regex :)
  content = content
    // `<div: class:"test">` => `<div class="test"></div>`
    .replace(/<([a-zA-Z0-9_]+):( *)([^<>]+)>/g, (match, tag, spaces, attributes) => {
      if(attributes.trim().endsWith('/') || (!spaces.length && attributes.length))
        return match;
      else
        return '<' + tag + ' ' + attributes + '></' + tag + '>';
    })
    // `<div :output>` => '<div id="output">'
    .replace(/<([a-zA-Z0-9_]+)( +):([a-zA-Z0-9_]+)( *)([^<>]*)>/g, (match, tag, spaces1, id, spaces2, rest) => {
      if(!spaces2.length && rest.length)
        return match;

      return '<' + tag + ' id="' + id + '" ' + rest + '>';
    })
    // `<div:"Some content">` => `<div>Some content</div>`
    .replace(/<([a-zA-Z0-9_]+):"([^"]+)"( *)([^<>]*)>/g, (match, tag, content, spaces, rest) => {
      if(rest.trim().endsWith('/'))
        return match;

      return '<' + tag + (rest ? ' ' + rest : '') + '>' + content + '</' + tag + '>';
    });
    // `<div class:"name" data:"error">` => `<div class="name" data="error">`
  let nfi = true;
  while(nfi) {
    nfi = false;
    content = content
      .replace(/<([^<>]+):([^<>]+)>/g, (match, before, after) => {
        if(((before.split('"').length - 1) / 2) % 1)
          return match;

        nfi = true;
        return '<' + before + '=' + after + '>';
      });
  }

  return (safe ? NightDocument.safe(content) : content);
};

// DOMEvents : HTML attributes to call a JavaScript function when there are some events
// UnsafeTags: Unsafe tags which can permit to run, with any way, JavaScript code directly into the web page
NightDocument.DOMEvents  = ["click", "contextmenu", "dblclick", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseover", "mouseout", "mouseup", "keydown", "keypress", "keyup", "abort", "beforeunload", "error", "hashchange", "load", "pageshow", "pagehide", "resize", "scroll", "unload", "blur", "change", "focus", "focusin", "focusout", "input", "invalid", "reset", "search", "select", "submit", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "copy", "cut", "paste", "afterprint", "beforeprint", "abort", "canplay", "canplaythrough", "durationchange", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting", "error", "message", "open", "online", "offline", "show", "toggle", "wheel"];
NightDocument.UnsafeTags = ["frame", "iframe", "webkit", "script", "style", "meta", "link", "webview", "object"];

// Freeze these arrays to make malicious applications unable to modify it
Object.freeze(NightDocument.CSSNumber);
Object.freeze(NightDocument.DOMEvents);
Object.freeze(NightDocument.UnsafeTags);
