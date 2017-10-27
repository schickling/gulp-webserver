'use strict';
/**
 * share all this options across different test
 *
 */
const baseUrl = 'localhost';
const defaultPort = 8000;
const defaultUrl = ['http://', baseUrl , ':' , defaultPort].join('');
const defaultSSLUrl = ['https://', baseUrl , ':', defaultPort].join('');

module.exports = {
  baseUrl: baseUrl,
  defaultPort: defaultPort,
  defaultUrl: defaultUrl,
  defaultSSLUrl: defaultSSLUrl
};
