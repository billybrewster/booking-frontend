'use strict';

require('marko/node-require').install();

const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const i18next = require('i18next');
const FilesystemBackend = require('i18next-node-fs-backend');
const i18nextMiddleware = require('i18next-express-middleware');

// Configure Lasso.js
require('lasso').configure(require('./config/lasso'));

// Setup i18next
i18next
  .use(FilesystemBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init(require('./config/i18next'));

const app = express();
const port = process.env.PORT || 5000;

// Enable compression
app.use(compression());

// Disable x-powered-by header
app.disable('x-powered-by');

// Uptime ping end point
app.get('/ping', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('pong');
});

// Serve static assets, max-age of 1 year
app.use(require('lasso/middleware').serveStatic({
  sendOptions: {maxage: 31536000}
}));



// Load Middleware
app.use(i18nextMiddleware.handle(i18next));
app.use(bodyParser.urlencoded({extended: true}));
app.use(helmet(require('./config/helmet')));

// Set Content-Type header to text to make compression work for output stream
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});

// Page routes
app.use('/choose-a-room', require('./src/pages/choose'));
app.use('/cancel', require('./src/pages/cancel'));
app.use('/cancelled', require('./src/pages/cancelled'));
app.use('/book', require('./src/pages/book'));

// Redirect root to start page
app.get('/', (req, res) => res.redirect('/choose-a-room'));

// Handler errors
app.use(require('./src/pages/error'));

// Listen!
app.listen(port, err => {
  if (err) {
    throw err;
  }

  console.log('Listening on port %d', port);
});
