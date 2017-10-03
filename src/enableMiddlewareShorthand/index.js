'use strict';
const extend = require('util')._extend;

module.exports = function (defaults, options, props) {
  const originalDefaults = extend({}, defaults);
  let config = extend(defaults, options);
  if (Object.prototype.toString.call(props) === '[object String]') {
    props = [props];
  }
  for (let i = 0, len = props.length; i < len; ++i) {
    let prop = props[i];
    if (config[prop] === true) {
      config[prop] = extend({}, originalDefaults[prop]);
      config[prop].enable = true;
    }
  }
  return config;
};

// -- EOF -- 
