const filters = require("./filters");
const shortCodes = require("./shortcodes");

// Wrapper for custom bits for the Handbook.
module.exports = function generalPlugin(eleventyConfig) {

  // Filters
  eleventyConfig.addPlugin(filters);

  // Shortcodes
  eleventyConfig.addPlugin(shortCodes);
};
