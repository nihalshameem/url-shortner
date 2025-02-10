const express = require('express');
const serverless = require('serverless-http');
const app = require('../../src/server'); // Import your Express app from server.js

// Important: Export the handler function
exports.handler = serverless(app);