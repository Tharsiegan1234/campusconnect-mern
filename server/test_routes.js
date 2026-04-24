const express = require('express');
const app = express();
const skillRoutes = require('./routes/SkillExchange/skillRoutes.js');

app.use('/api/skills', skillRoutes);

app._router.stack.forEach((middleware) => {
    if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                let basePath = '';
                if (middleware.regexp) {
                    basePath = middleware.regexp.source
                        .replace(/\\/g, '')
                        .replace(/\^/g, '')
                        .replace(/\$\//g, '')
                        .replace(/\?/g, '');
                }
                console.log(`${methods} ${basePath}${handler.route.path}`);
            }
        });
    }
});
