// Display a cover

/** The loading cover's stylesheet
  * @type {Element} */
let loading_style;
loading_style = document.createElement('style');
loading_style.setAttribute('type', 'text/css');
loading_style.innerHTML = `
  #loading-cover {
    z-index: 1000001;
    background-color: orange;
    color: white; /* needed before the main stylesheet is loaded */
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* the 'line-height' property depends of the screen's size, so it will be set
       by the 'ui.js' program */
    font-size: 48px;
    font-family: "Ubuntu";
  }

  #loading-cover div {
    vertical-align: middle;
    line-height: 1;
    display: inline-block;
  }

  #loading-cover span {
    font-size: 20px;
  }
`;
// Show it
document.body.appendChild(loading_style);

/** The loading cover
  * @type {Element} */
// This cover permit to hide the webview of the launcher before it displays its
// own DOM elements.
let loading_cover;

// The cover will be removed by the launcher when it finished its tasks
loading_cover = document.createElement('div');
loading_cover.setAttribute('id', 'loading-cover');
document.body.appendChild(loading_cover);
loading_cover.style.lineHeight = loading_cover.clientHeight + 'px';

/** The cover's text
  * @type {Element} */
let loading_div = document.createElement('div');
loading_div.innerHTML = 'Please wait...<br /><span>I am not doing anything ;(</span>';
loading_cover.appendChild(loading_div);

/** The cover's text details
  * @type {Element} */
let loading_text = loading_div.children[1];
