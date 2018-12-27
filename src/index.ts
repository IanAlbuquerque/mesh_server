import * as express from 'express';
import * as http from 'http';
import { CornerTable } from './corner-table/corner-table';

var fs = require('fs');

const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }));
const server = http.createServer(app);

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port}`);
});

// global controller
app.get('/*',function(request, response, next){
  response.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/mesh/:id', function (request, response) {
  // This code is likely vulnerable!
  const id: string = request.params.id;
  console.log(`Received call from ${request.ip} for /mesh/` + id);
  fs.readFile('./meshes/' + id + '.obj', (err, data) => {
    if (err) {
      response.status(500).send(`Internal error when reading mesh ` + err);
    }
    const cornerTable: CornerTable = new CornerTable();
    cornerTable.initFromOBJFileData(data.toString());
    cornerTable.applyEdgeWelds();
    response.status(200).send(JSON.stringify(cornerTable.getData()));
  });
});
