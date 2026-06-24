const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use((req, res, next) => {
  req.pause(); // Pause stream to prevent data loss during async operations
  next();
});

app.use(async (req, res, next) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async rate limiter
  next();
});

app.use((req, res, next) => {
  req.resume(); // Resume stream for the proxy
  next();
});

app.use('/auth', createProxyMiddleware({ 
  target: 'http://auth-service:8001', 
  changeOrigin: true,
  pathRewrite: {'^/auth': ''}
}));

app.listen(9998, () => console.log('Test proxy on 9998'));
