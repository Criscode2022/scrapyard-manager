/**
 * Long-running Node entry (local, preview, and hosts that run `npm start`).
 * Ensures Nest can resolve modules from apps/api/node_modules.
 */
const Module = require('module');
const path = require('path');

const apiNodeModules = path.join(__dirname, 'apps', 'api', 'node_modules');
const paths = [apiNodeModules, process.env.NODE_PATH].filter(Boolean);
process.env.NODE_PATH = paths.join(path.delimiter);
Module._initPaths();

// Nest listens on PORT (default 8080) and serves SPA from apps/web or public/
require('./apps/api/dist/main.js');
