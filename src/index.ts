import * as express from 'express';
import * as http from 'http';
import { setInterval } from 'timers';
import { Vector3, normalFromTriangleVertices } from "./linalg";

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
    // const parsedData: { buffer: number[], triangleCount: number } = parseOBJFile(data.toString());
    const parsedData: { G: number[], V: number[], O: number[] } = parseOBJFileToCornerTable(data.toString());
    response.status(200).send(JSON.stringify(parsedData));
  });
});

function parseOBJFile(data: string): { buffer: number[], triangleCount: number } {
  const buffer: number[] = [];
  let triangleCount: number = 0;
  const words: string[] = data.replace( /\n/g, " " ).split( " " );
  const vertices: Vector3[] = [];
  for(let i=0; i<words.length; i++) {
    if(words[i].includes("v")) {
      vertices.push(new Vector3( +words[i+1], +words[i+2], +words[i+3]));
      i+=3;
      continue;
    }
    if(words[i].includes("f")) {
      const v1: number = +words[i+1] - 1; // Syntax note: +stringVariable evaluates stringVariable to a number
      const v2: number = +words[i+2] - 1;
      const v3: number = +words[i+3] - 1;

      const normal: Vector3 = normalFromTriangleVertices(vertices[v1], vertices[v2], vertices[v3]);

      [].push.apply(buffer, vertices[v1].asArray()); // Syntax note: calls the push method for `buffer` for each element in `....asArray()`
      [].push.apply(buffer, normal.asArray());
      [].push.apply(buffer, vertices[v2].asArray());
      [].push.apply(buffer, normal.asArray());
      [].push.apply(buffer, vertices[v3].asArray());
      [].push.apply(buffer, normal.asArray());

      i+=3;
      triangleCount+=1;
      continue;
    }
  }
  return { buffer: buffer, triangleCount: triangleCount };  
}

function parseOBJFileToCornerTable(data: string): { G: number[], V: number[], O: number[] } {
  
  const G: number[] = [];
  const V: number[] = [];

  const words: string[] = data.replace( /\n/g, " " ).split( " " );

  // Read File
  for(let i=0; i<words.length; i++) {
    if(words[i].includes("v")) {
      G.push(+words[i+1]); // Syntax note: +stringVariable evaluates stringVariable to a number
      G.push(+words[i+2]);
      G.push(+words[i+3]);
      i+=3;
      continue;
    }
    if(words[i].includes("f")) {
      V.push(+words[i+1] - 1);
      V.push(+words[i+2] - 1);
      V.push(+words[i+3] - 1);
      i+=3;
      continue;
    }
  }

  const O: number[] = [];

  const numTriangles: number = V.length / 3;

  function halfEdgeToKey(vertexA: number, vertexB: number): string {
    return vertexA.toString() + ';' + vertexB.toString();
  }
  const halfEdgeToCornerDictionary: { [key: string]: number } = {}

  for(let i=0; i<numTriangles; i++) {
    const corner1 = i * 3;
    const corner2 = (i * 3) + 1;
    const corner3 = (i * 3) + 2;

    const vertex1: number = V[corner1];
    const vertex2: number = V[corner2];
    const vertex3: number = V[corner3];

    halfEdgeToCornerDictionary[halfEdgeToKey(vertex1, vertex2)] = corner3;
    halfEdgeToCornerDictionary[halfEdgeToKey(vertex2, vertex3)] = corner1;
    halfEdgeToCornerDictionary[halfEdgeToKey(vertex3, vertex1)] = corner2;
  }

  for(let i=0; i<V.length; i++) {
    const nextCorner: number = next(i);
    const nextNextCorner: number = next(next(i));

    const nextVertex = V[nextCorner];
    const nextNextVertex = V[nextNextCorner];
    O[i] = halfEdgeToCornerDictionary[halfEdgeToKey(nextNextVertex, nextVertex)];
    if(O[i] == undefined || O[i] == null) {
      throw "Given mesh does not agree with hypothesis";
    }
  }

  return { G: G, V: V, O: O };  
}

function next(corner: number): number {
  if(corner % 3 == 2) {
    return corner - 2;
  } else {
    return corner + 1;
  }
}
