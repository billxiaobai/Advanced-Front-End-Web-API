const fs = require('fs');
const path = require('path');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('Route.js'));
const routes = files.map(f => require('./' + path.basename(f, '.js')));
module.exports = routes;
