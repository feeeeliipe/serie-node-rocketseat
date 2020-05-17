const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: false }));

require('./database/db');

require('./app/controllers/AuthController')(app);
require('./app/controllers/ProjectController')(app);
//require('./app/controllers/index')(app);

app.listen(3001);