import * as express from 'express';
import * as http from 'http';
import { CornerTable } from './corner-table/corner-table';
import { Vector3, Vector4, Mat4, normalFromTriangleVertices } from "./linalg";
import { FibonacciHeap, INode } from '@tyriar/fibonacci-heap';
import { TextDecoder, TextEncoder } from 'text-encoding';

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

app.get('/mesh/:id/:steps', function (request, response) {
  // This code is likely vulnerable!
  const id: string = request.params.id;
  const steps: string = request.params.steps;
  const numSteps: number = parseInt(steps);
  console.log(`Received call from ${request.ip} for /mesh/` + id);
  fs.readFile('./meshes/' + id + '.obj', (err, data) => {
    if (err) {
      response.status(500).send(`Internal error when reading mesh ` + err);
    }

    const cornerTable: CornerTable = new CornerTable();
    cornerTable.initFromOBJFileData(data.toString());
    if(numSteps > 0) {
      cornerTable.simplifyNLevels(numSteps);
    }
    const compression: { delta: number[], clers: string[] } = cornerTable.initCompression(0);
    // const cornerTableRebuilt: CornerTable = new CornerTable();
    // cornerTableRebuilt.decompress(compression.delta, compression.clers);
    // response.status(200).send(JSON.stringify(cornerTableRebuilt.getData()));
    response.status(200).send(JSON.stringify({ delta: compression.delta, clers: compression.clers.join('') }));
  });
});

// function ab2str(buf: ArrayBuffer): string {
//   return String.fromCharCode.apply(null, new Uint8Array(buf));
// }

// function str2ab(str: string): ArrayBuffer {
//   let buf: ArrayBuffer = new ArrayBuffer(str.length * 1);
//   let bufView = new Uint8Array(buf);
//   for (let i=0, strLen=str.length; i<strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }
// const f32: Float32Array = new Float32Array([0.5, 2, 1, 121221.2]);
// // let str:string = String.fromCharCode.apply(null, (new Uint8Array(f32.buffer)));
// let str = ab2str(f32.buffer as ArrayBuffer);
// console.log(str);
// // let f32decoded: Float32Array = new Float32Array((Uint8Array.from(str,(x)=>x.charCodeAt(0))).buffer);
// let f32decoded: Float32Array = new Float32Array(str2ab(str));
// console.log(f32decoded);

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

// const obj1: { value: number, valid: boolean } = { value: 1, valid: true };
// const obj2: { value: number, valid: boolean } = { value: 2, valid: true };
// const obj3: { value: number, valid: boolean } = { value: 3, valid: true };
// const heap: FibonacciHeap<number, { value: number, valid: boolean }> = new FibonacciHeap<number, { value: number, valid: boolean }>();
// heap.insert(3, obj3);
// heap.insert(1, obj1);
// heap.insert(2, obj2);

// obj1.valid = false;

// const node: INode<number, { value: number, valid: boolean }> = heap.extractMinimum();
// console.log(node.value);
