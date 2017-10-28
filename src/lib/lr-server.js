/**
 * Breakout out tinyLr setup here
 */
const fs = require('fs');
const tinyLr = require('tiny-lr');

module.exports = function (config) {
  if (config.https) {
    if (config.https.pfx) {
      return tinyLr({
        pfx: fs.readFileSync(config.https.pfx),
        passphrase: config.https.passphrase
      });
    }
    return tinyLr({
      key: fs.readFileSync(config.https.key || config.devKeyPem),
      cert: fs.readFileSync(config.https.cert || config.devCrtPem)
    });
  }
  return tinyLr();
};
