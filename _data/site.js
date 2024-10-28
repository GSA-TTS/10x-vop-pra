require('dotenv').config();

// Determine if the environment is production
const isProduction = process.env.ELEVENTY_ENV === 'production';

// Use BASE_URL for production, otherwise default to localhost for local development
const baseUrl = isProduction
  ? process.env.BASE_URL || 'https://federalist-ed45f93b-f174-4670-8752-8fcef170bc2d.sites.pages.cloud.gov/preview/gsa-tts/10x-vop-pra/'
  : 'http://localhost:8080';

const urlObject = new URL(baseUrl);

module.exports = {
  baseUrl: urlObject.href,
  protocol: urlObject.protocol, 
  hostname: urlObject.hostname,
  port: urlObject.port,
  pathname: urlObject.pathname,
};
