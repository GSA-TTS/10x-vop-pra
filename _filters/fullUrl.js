module.exports = function(config) {
    config.addFilter("fullUrl", (path) => {
      const site = require('../_data/site.js');
      // Ensure path starts without a slash if it already has a base URL
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      return `${site.baseUrl}${normalizedPath}`;
    });
  };
  