require('dotenv').config();

const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const urlObject = new URL(baseUrl);

module.exports = {
  baseUrl: urlObject.href,
  protocol: urlObject.protocol, 
  hostname: urlObject.hostname,
  port: urlObject.port,
  pathname: urlObject.pathname,
};
