import * as express from 'express';
import * as http from 'http';
import { setInterval } from 'timers';
var fs = require('fs');

const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }));
const server = http.createServer(app);

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port}`);
});

app.get('/mesh/:id', function (request, response) {
  // This code is likely vulnerable!
  const id: string = request.params.id;
  fs.readFile('./meshes/' + id + '.obj', (err, data) => {
    if (err) {
      response.status(500).send(`Internal error when reading mesh ` + err);
    }
    response.status(200).send(data);
  });
});
