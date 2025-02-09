const express = require('express');
const serverless = require('serverless-http');
const app = express();
const app = require('../../server'); // Import your Express app from server.js
// // Your existing Express app code goes here (routes, middleware, etc.)
// app.get('/', (req, res) => {
//   res.send('Hello from your Express app on Netlify!');
// });

// Important: Export the handler function
exports.handler = serverless(app);