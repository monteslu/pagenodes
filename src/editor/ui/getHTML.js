var React = window.React = require('react');
var ReactDOM = require('react-dom');


var div = document.createElement('div');

function getHTML(component){
  ReactDOM.render(
    component,
    div
  );
  return div.innerHTML;
}

module.exports = getHTML;


