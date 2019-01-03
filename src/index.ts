import * as express from 'express';
import * as http from 'http';
import { CornerTable } from './corner-table/corner-table';
import { Vector3, Vector4, Mat4, normalFromTriangleVertices } from "./linalg";
import { FibonacciHeap, INode } from '@tyriar/fibonacci-heap';

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
    cornerTable.simplifyNLevels(6);
    response.status(200).send(JSON.stringify(cornerTable.getData()));
  });
});


// const mat: Mat4 = new Mat4();
// mat.print();
// const v1: Vector4 = new Vector4(8, 6, 4, 2);
// console.log(mat.multiplyVec4(v1).asArray());
// const v2: Vector3 = mat.multiplyVec4(v1).toVec3Homogeneous();
// console.log(v2.asArray());
// console.log(mat.multiplyVec3(v2, 1).asArray());
// const mat2: Mat4 = new Mat4();
// mat2.buildSymmetrixFromVec4(new Vector4(1, 2, 3, 4));
// mat2.print();

const obj1: { value: number, valid: boolean } = { value: 1, valid: true };
const obj2: { value: number, valid: boolean } = { value: 2, valid: true };
const obj3: { value: number, valid: boolean } = { value: 3, valid: true };
const heap: FibonacciHeap<number, { value: number, valid: boolean }> = new FibonacciHeap<number, { value: number, valid: boolean }>();
heap.insert(3, obj3);
heap.insert(1, obj1);
heap.insert(2, obj2);

obj1.valid = false;

const node: INode<number, { value: number, valid: boolean }> = heap.extractMinimum();
console.log(node.value);
