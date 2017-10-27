/**
 * breakout out tinyLr setup here
 */
const fs = require('fs');
const tinyLr = require('tiny-lr');

module.exports = function(config)
{
  if (config.https) {
    if (config.https.pfx) {
      lrServer = tinyLr({
        pfx: fs.readFileSync(config.https.pfx),
        passphrase: config.https.passphrase
      });
    } else {
      lrServer = tinyLr({
        key: fs.readFileSync(config.https.key || devKeyPem),
        cert: fs.readFileSync(config.https.cert || devCrtPem)
      });
    }
  } else {
    lrServer = tinyLr();
  }
  return lrServer;
};
