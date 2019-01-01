const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.post('/trace', routes.trace);

const port = process.env.PORT || 8081;
app.listen(port, () => console.log(`Worker service started on ${port}`));
