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

// https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
function edgeWeld(cornerTable: { G: number[], V: number[], O: number[] }, c0: number, valence: number[]): void {
  
  // Assign Incidences
  const c1: number = next(c0);
  const c2: number = previous(c0);
  const c3: number = cornerTable.O[c1]
  const c4: number = next(c3);
  const c5: number = previous(c3);
  
  const a: number = cornerTable.O[next(cornerTable.O[c5])];
  const b: number = cornerTable.O[previous(cornerTable.O[c2])];

  const w: number = cornerTable.V[cornerTable.O[c2]];
  const u: number = cornerTable.V[c2];
  const v: number = cornerTable.V[c0];
  const s: number = cornerTable.V[c3];
  const t: number = cornerTable.V[c1];

  // =====================================


  // the central vertex has to have valence 4
  if(valence[v] != 4) {
    return;
  }

  if(isThereAnEdgeFromCornerToVertex(cornerTable, c2, w)) {
    return;
  }

  valence[s] -= 1;
  valence[t] -= 1;
  valence[v] = 0;

  // =====================================

  // Perform vertex removal
  cornerTable.V[c0] = w;
  cornerTable.V[c4] = w;

  // Mark Removed Elements
  cornerTable.O[cornerTable.O[c2]] = -1;
  cornerTable.O[cornerTable.O[c5]] = -1;
  cornerTable.O[next(cornerTable.O[c2])] = -1;
  cornerTable.O[previous(cornerTable.O[c2])] = -1;
  cornerTable.O[next(cornerTable.O[c5])] = -1;
  cornerTable.O[previous(cornerTable.O[c5])] = -1;

  // Reset opposite corners
  cornerTable.O[c5] = a;
  cornerTable.O[a] = c5;
  cornerTable.O[b] = c2;
  cornerTable.O[c2] = b;
}

// https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
function edgeFlip(cornerTable: { G: number[], V: number[], O: number[] }, c0: number, valence: number[]): void {
  // Label incident corners
  const c1: number = next(c0);
  const c2: number = previous(c0);

  const c3: number = cornerTable.O[c0];

  const c4: number = next(c3);
  const c5: number = previous(c3);

  const a: number = cornerTable.O[c5];
  const b: number = cornerTable.O[c1];
  const c: number = cornerTable.O[c4];
  const d: number = cornerTable.O[c2];

  // Label incident vertices
  const t: number = cornerTable.V[c0];
  const s: number = cornerTable.V[c3];
  const v: number = cornerTable.V[c1];

  // =====================================
  
  const u: number = cornerTable.V[c2]; // u is not used anywhere

  // =====================================

  // cannot perform operation on vertices with valence <= 3
  if(valence[u] <= 3) return;
  if(valence[v] <= 3) return;

  // geometry check
  // should I really do that here?
  const ccu: Vector3 = new Vector3( cornerTable.G[u * 3 + 0],
                                    cornerTable.G[u * 3 + 1],
                                    cornerTable.G[u * 3 + 2]);
  const ccv: Vector3 = new Vector3( cornerTable.G[v * 3 + 0],
                                    cornerTable.G[v * 3 + 1],
                                    cornerTable.G[v * 3 + 2]);
  const ccs: Vector3 = new Vector3( cornerTable.G[s * 3 + 0],
                                    cornerTable.G[s * 3 + 1],
                                    cornerTable.G[s * 3 + 2]);
  const cct: Vector3 = new Vector3( cornerTable.G[t * 3 + 0],
                                    cornerTable.G[t * 3 + 1],
                                    cornerTable.G[t * 3 + 2]);


  const nold1: Vector3 = normalFromTriangleVertices(cct, ccv, ccu);
  const nold2: Vector3 = normalFromTriangleVertices(ccs, ccu, ccv);
  const nnew1: Vector3 = normalFromTriangleVertices(ccu, cct, ccs);
  const nnew2: Vector3 = normalFromTriangleVertices(cct, ccv, ccs);

  if( nold1.dot(nnew1) < 0 ) return;
  if( nold1.dot(nnew2) < 0 ) return;
  if( nold2.dot(nnew1) < 0 ) return;
  if( nold2.dot(nnew2) < 0 ) return;

  valence[u] -= 1;
  valence[v] -= 1;
  valence[s] += 1;
  valence[t] += 1;
  
  // =====================================

  // Perform swap
  // cornerTable.V[c0] = t; // stays the same
  cornerTable.V[c1] = s;
  // cornerTable.V[c2] = u; // stays the same
  cornerTable.V[c3] = v;
  cornerTable.V[c4] = s;
  cornerTable.V[c5] = t;

  // Reset opposite corners
  cornerTable.O[c0] = a;
  // cornerTable.O[c1] = b; // stays the same
  cornerTable.O[c2] = c3;
  cornerTable.O[c3] = c2;
  cornerTable.O[c4] = d;
  cornerTable.O[c5] = c;

  cornerTable.O[a] = c0;
  // cornerTable.O[b] = c1;
  cornerTable.O[c] = c5;
  cornerTable.O[d] = c4;
}

function parseOBJFileToCornerTable(data: string): { G: number[], V: number[], O: number[] } {
  
  const G: number[] = [];
  const V: number[] = [];

  const lines: string[] = data.split("\n");
  for(let i=0; i<lines.length; i++) {
    const words: string[] = lines[i].split(/\s+/g);
    if(words[0] === "#") {
      continue;
    } else if( words[0] === "v") {
      G.push(+words[1]); // Syntax note: +stringVariable evaluates stringVariable to a number
      G.push(+words[2]);
      G.push(+words[3]);
    } else if(words[0] === "f") {
      const v1: string[] = words[1].split("/");
      const v2: string[] = words[2].split("/");
      const v3: string[] = words[3].split("/");
      V.push(+v1[0] - 1);
      V.push(+v2[0] - 1);
      V.push(+v3[0] - 1);
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

  const valence: number[] = [];

  for(let i=0; i<V.length; i++) {
    if(valence[V[i]] === undefined) {
      valence[V[i]] = 0;
    }
    valence[V[i]] += 1;
  }
  
  for(let j=0; j<1; j++) {
    for(let i=0; i<V.length; i++) {
      if(O[i] == -1) {
        continue;
      }
      // edgeFlip({ G: G, V: V, O: O }, i, valence);
      edgeWeld({ G: G, V: V, O: O }, i, valence);
    }
  }

  console.log("done");

  return { G: G, V: V, O: O };  
}

function isThereAnEdgeFromCornerToVertex( cornerTable: { G: number[], V: number[], O: number[] },
                                          corner: number,
                                          v: number ): boolean {
  const w: number = cornerTable.V[corner];
  let it = corner;
  do {
    const prevIt: number = it;
    it = counterclockwise(cornerTable, it);
    if (v == cornerTable.V[next(it)]) {
      return true;
    }
  } while(it != corner);
  return false;
}

function next(corner: number): number {
  if(corner % 3 === 2) {
    return corner - 2;
  } else {
    return corner + 1;
  }
}

function previous(corner: number): number {
  return next(next(corner));
}

function left(cornerTable: { G: number[], V: number[], O: number[] }, corner: number): number {
  return cornerTable.O[next(corner)];
}

function right(cornerTable: { G: number[], V: number[], O: number[] }, corner: number): number {
  return cornerTable.O[previous(corner)];
}

function clockwise(cornerTable: { G: number[], V: number[], O: number[] }, corner: number): number {
  return previous(right(cornerTable, corner));
}

function counterclockwise(cornerTable: { G: number[], V: number[], O: number[] }, corner: number): number {
  return next(left(cornerTable, corner));
}
