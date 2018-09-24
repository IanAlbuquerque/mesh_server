import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { setInterval } from 'timers';

const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port}`);
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.send('hello world')
});
