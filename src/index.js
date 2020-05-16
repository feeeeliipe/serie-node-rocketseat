const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: false }));

require('./database/db');
require('./controllers/AuthController')(app);
require('./controllers/ProjectController')(app);

app.listen(3001);