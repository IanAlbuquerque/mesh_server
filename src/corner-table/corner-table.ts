import { Vector3, normalFromTriangleVertices } from "./../linalg";

// Those are just aliases so the code is clear(er)
// The "& { readonly brand?: unique symbol }" is such that one type cannot be typecasted to the other (and we get compile errors for that!)
// Check https://stackoverflow.com/questions/51577959/is-it-possible-to-type-check-string-aliases-in-typescript
// Also, this does not change the resulting JavaScript code!
// (I tested this in http://www.typescriptlang.org/play/)
type Coordinate = number & { readonly brand?: unique symbol };
type Corner = number & { readonly brand?: unique symbol };
type Vertex = number & { readonly brand?: unique symbol };

const REMOVED_CORNER: Corner = -1;

// This data structure assumes sphere-like meshes
// No borders
// No genus
// 2-Manifold
// Faces are composed of 3 corners
export class CornerTable {
  
  // ==================================================================
  // #region DATA MEMBERS
  // ==================================================================

  // The geometry array
  public G: Coordinate[] = [];

  // The vertices array
  public V: Vertex[] = [];

  // The opposite corner array
  public O: Corner[] = [];

  constructor() {
    this.G = [];
    this.V = [];
    this.O = [];
  }

  public getData(): { G: number[], V: number[], O: number[] } {
    return { G: this.G, V: this.V, O: this.O };
  }
  
  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region CORNER ACCESS OPERATIONS
  // ==================================================================

  // Returns the next corner in the same face
  // (following the counter-clockwise normal convention)
  private next(corner: Corner): Corner {
    if(corner % 3 === 2) {
      return corner - 2;
    } else {
      return corner + 1;
    }
  }
  
  // Returns the previous corner in the same face
  // (following the counter-clockwise normal convention)
  private prev(corner: Corner): Corner {
    return this.next(this.next(corner));
  }
  
  // See image for explanation
  // TODO: Think of a better name!
  private left(corner: Corner): Corner {
    return this.O[this.next(corner)];
  }
  
  // See image for explanation
  // TODO: Think of a better name!
  private right(corner: Corner): Corner {
    return this.O[this.prev(corner)];
  }
  
  // The corner of the same vertex that is clockwise to the given corner
  private clockwise(corner: Corner): Corner {
    return this.prev(this.right(corner));
  }
  
  // The corner of the same vertex that is counterclockwise to the given corner
  private counterclockwise(corner: Corner): Corner {
    return this.next(this.left(corner));
  }

  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region CLASS INITIALIZATION
  // ==================================================================

  private parseSingleOBJLine(objFileLine: string): void {
    const words: string[] = objFileLine.split(/\s+/g);
    if(words[0] === "#") {
      // comments
      return;
    } else if( words[0] === "v") {
      // new vertex
      // Syntax note: +stringVariable evaluates stringVariable to a number
      this.G.push(+words[1]);
      this.G.push(+words[2]);
      this.G.push(+words[3]);
    } else if(words[0] === "f") {
      // new face
      const v1: string[] = words[1].split("/");
      const v2: string[] = words[2].split("/");
      const v3: string[] = words[3].split("/");
      this.V.push(+v1[0] - 1);
      this.V.push(+v2[0] - 1);
      this.V.push(+v3[0] - 1);
    }
  }

  private halfEdgeToKey(vertexA: Vertex, vertexB: Vertex): string {
    return vertexA.toString() + ';' + vertexB.toString();
  }

  public initFromOBJFileData(objFileData: string): void {
  
    this.G = [];
    this.V = [];
  
    // Reads the .obj file line by line, parsing the given vertices and faces
    // Only the G and V arrays are updated in this step
    const lines: string[] = objFileData.split("\n");
    for(let i=0; i<lines.length; i++) {
      this.parseSingleOBJLine(lines[i]);
    }
  
    this.O = [];
    const numTriangles: number = this.V.length / 3;
    const halfEdgeToCornerDictionary: { [key: string]: Corner } = {}
  
    // Reads each triangle once, storing the corner opposite to each half edge
    // This uses a dictionary for faster access
    for(let i=0; i<numTriangles; i++) {
      const corner1: Corner = i * 3;
      const corner2: Corner = (i * 3) + 1;
      const corner3: Corner = (i * 3) + 2;
  
      const vertex1: Vertex = this.V[corner1];
      const vertex2: Vertex = this.V[corner2];
      const vertex3: Vertex = this.V[corner3];
  
      halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex1, vertex2)] = corner3;
      halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex2, vertex3)] = corner1;
      halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex3, vertex1)] = corner2;
    }
  
    // Now, with the dictionary formed, we just have to assign the opposite corner to each corner
    // So, iterate among all corners
    for(let corner: Corner = 0; corner<this.V.length; corner++) {
      const nextCorner: Corner = this.next(corner);
      const nextNextCorner: Corner = this.next(this.next(corner));
  
      const nextVertex = this.V[nextCorner];
      const nextNextVertex = this.V[nextNextCorner];

      // The order here is important
      // We want the halfedge opposite to the half edge defined by our corner corner
      this.O[corner] = halfEdgeToCornerDictionary[this.halfEdgeToKey(nextNextVertex, nextVertex)];
      
      // If our hypothesis is correct, all corners should have opposites!
      if(this.O[corner] == undefined || this.O[corner] == null) {
        throw "Given mesh does not agree with hypothesis";
      }
    }
  }
  
  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region DATA STRUCTURE TRAVERSAL
  // ==================================================================

  private getCornersThatShareSameVertexClockwise(corner: Corner): Corner[] {
    const corners: Corner[] = [];
    let iterator: Corner = corner;
    do {
      iterator = this.clockwise(iterator);
      corners.push(iterator);
    } while(iterator != corner);
    return corners;
  }

  private valenceOfVertexAssociatedToCorner(corner: Corner): number {
    return this.getCornersThatShareSameVertexClockwise(corner).length;
  }

  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region DATA STRUCTURE MAINTANENCE
  // ==================================================================

  private removeUnusedCorners(): void {
    const newV: Vertex[] = [];
    const newO: Corner[] = [];
    const cornerNewPlace: { [oldCorner: number]: Corner } = {};
    for(let corner: Corner = 0; corner < this.V.length; corner++) {
      if(this.isCornerInMesh(corner)) {
        newV.push(this.V[corner]);
        newO.push(this.O[corner]);
        cornerNewPlace[corner] = newO.length - 1;
      }
    }
    for(let corner: Corner = 0; corner < newO.length; corner++) {
      newO[corner] = cornerNewPlace[newO[corner]];
    }
    this.V = newV;
    this.O = newO;
  }

  private removeUnusedVertices(): void {
    const newG: Coordinate[] = [];
    const existingVertices: Vertex[] = this.getExistingVertices();
    const vertexNewPlace: { [oldVertex: number]: Vertex } = {};
    for(let vertex of existingVertices) {
      newG.push(this.getVertexX(vertex));
      newG.push(this.getVertexY(vertex));
      newG.push(this.getVertexZ(vertex));
      vertexNewPlace[vertex] = (newG.length / 3) - 1;
    }
    for(let corner: Corner = 0; corner < this.V.length; corner++) {
      this.V[corner] = vertexNewPlace[this.V[corner]];
    }
    this.G = newG;
  }

  private cleanRemovedElements(): void {
    this.removeUnusedCorners();
    this.removeUnusedVertices();
  }

  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region DATA STRUCTURE QUERIES
  // ==================================================================

  private isCornerInMesh(c0: Corner): boolean {
    return this.O[c0] != REMOVED_CORNER;
  }

  private isThereAnEdgeFromCornerToVertex(corner: Corner, v: Vertex): boolean {
    const w: Vertex = this.V[corner];
    const corners: Corner[] = this.getCornersThatShareSameVertexClockwise(corner);
    for(let c of corners) {
      if (v == this.V[this.next(c)]) {
        return true;
      }
    }
    return false;
  }

  private getVertexX(vertex: Vertex): Coordinate {
    return this.G[vertex * 3 + 0];
  }

  private getVertexY(vertex: Vertex): Coordinate {
    return this.G[vertex * 3 + 1];
  }

  private getVertexZ(vertex: Vertex): Coordinate {
    return this.G[vertex * 3 + 2];
  }

  private getExistingVertices(): Vertex[] {
    const existingVertices: Vertex[] = [];
    for(let corner: Corner = 0; corner < this.V.length; corner++) {
      if(this.isCornerInMesh(corner)) {
        existingVertices.push(this.V[corner]);
      }
    }
    return existingVertices;
  }

  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region STELLAR OPERATORS
  // ==================================================================

  private isEdgeWeldTopologicalConditionsMet(c0: Corner): boolean {
    const c2: Corner = this.prev(c0);
    const w: Vertex = this.V[this.O[c2]];
    if(!this.isCornerInMesh(c0)) {
      return false;
    }
    if(this.valenceOfVertexAssociatedToCorner(c0) != 4) {
      return false;
    }
    if(this.isThereAnEdgeFromCornerToVertex(c2, w)) {
      return false;
    }
    return true;
  }

  private isEdgeFlipGeometryConditionsMet(c0: Corner): boolean {
    // Label incident corners
    const c1: Corner = this.next(c0);
    const c2: Corner = this.prev(c0);
    const c3: Corner = this.O[c0];
    const t: Vertex = this.V[c0];
    const s: Vertex = this.V[c3];
    const v: Vertex = this.V[c1];
    const u: Vertex = this.V[c2];

    const ccu: Vector3 = new Vector3( this.G[u * 3 + 0],
                                      this.G[u * 3 + 1],
                                      this.G[u * 3 + 2]);
    const ccv: Vector3 = new Vector3( this.G[v * 3 + 0],
                                      this.G[v * 3 + 1],
                                      this.G[v * 3 + 2]);
    const ccs: Vector3 = new Vector3( this.G[s * 3 + 0],
                                      this.G[s * 3 + 1],
                                      this.G[s * 3 + 2]);
    const cct: Vector3 = new Vector3( this.G[t * 3 + 0],
                                      this.G[t * 3 + 1],
                                      this.G[t * 3 + 2]);

    const nold1: Vector3 = normalFromTriangleVertices(cct, ccv, ccu);
    const nold2: Vector3 = normalFromTriangleVertices(ccs, ccu, ccv);
    const nnew1: Vector3 = normalFromTriangleVertices(ccu, cct, ccs);
    const nnew2: Vector3 = normalFromTriangleVertices(cct, ccv, ccs);

    if( nold1.dot(nnew1) < 0 ) return false;
    if( nold1.dot(nnew2) < 0 ) return false;
    if( nold2.dot(nnew1) < 0 ) return false;
    if( nold2.dot(nnew2) < 0 ) return false;

    return true;
  }
  
  private isEdgeFlipTopologicalConditionsMet(c0: Corner): boolean {
    const c1: Corner = this.next(c0);
    const c2: Corner = this.prev(c0);
    // cannot perform operation on vertices with valence <= 3
    if(this.valenceOfVertexAssociatedToCorner(c1) <= 3) return false;
    if(this.valenceOfVertexAssociatedToCorner(c2) <= 3) return false;
    return true;
  }
  
  // https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
  private edgeWeld(c0: number): void {

    // Assign Incidences
    const c1: Corner = this.next(c0);
    const c2: Corner = this.prev(c0);
    const c3: Corner = this.O[c1]
    const c4: Corner = this.next(c3);
    const c5: Corner = this.prev(c3);
    
    const a: Corner = this.O[this.next(this.O[c5])];
    const b: Corner = this.O[this.prev(this.O[c2])];

    const w: Vertex = this.V[this.O[c2]];
    const u: Vertex = this.V[c2];
    const v: Vertex = this.V[c0];
    const s: Vertex = this.V[c3];
    const t: Vertex = this.V[c1];

    // Perform vertex removal
    this.V[c0] = w;
    this.V[c4] = w;

    // Mark Removed Elements
    this.O[this.O[c2]] = REMOVED_CORNER;
    this.O[this.O[c5]] = REMOVED_CORNER;
    this.O[this.next(this.O[c2])] = REMOVED_CORNER;
    this.O[this.prev(this.O[c2])] = REMOVED_CORNER;
    this.O[this.next(this.O[c5])] = REMOVED_CORNER;
    this.O[this.prev(this.O[c5])] = REMOVED_CORNER;

    // Reset opposite corners
    this.O[c5] = a;
    this.O[a] = c5;
    this.O[b] = c2;
    this.O[c2] = b;
  }

  // https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
  private edgeFlip(c0: number): void {
    // Label incident corners
    const c1: Corner = this.next(c0);
    const c2: Corner = this.prev(c0);

    const c3: Corner = this.O[c0];

    const c4: Corner = this.next(c3);
    const c5: Corner = this.prev(c3);

    const a: Corner = this.O[c5];
    const b: Corner = this.O[c1];
    const c: Corner = this.O[c4];
    const d: Corner = this.O[c2];

    // Label incident vertices
    const t: Vertex = this.V[c0];
    const s: Vertex = this.V[c3];
    const v: Vertex = this.V[c1];
    const u: Vertex = this.V[c2]; // u is not used anywhere
    
    // =====================================

    // Perform swap
    // this.V[c0] = t; // stays the same
    this.V[c1] = s;
    // this.V[c2] = u; // stays the same
    this.V[c3] = v;
    this.V[c4] = s;
    this.V[c5] = t;

    // Reset opposite corners
    this.O[c0] = a;
    // this.O[c1] = b; // stays the same
    this.O[c2] = c3;
    this.O[c3] = c2;
    this.O[c4] = d;
    this.O[c5] = c;

    this.O[a] = c0;
    // this.O[b] = c1;
    this.O[c] = c5;
    this.O[d] = c4;
  }

  // ==================================================================
  // #endregion
  // ==================================================================

  // ==================================================================
  // #region SIMPLIFICATION ALGORITHMS
  // ==================================================================

  public applyEdgeWelds(): void {
    for(let j=0; j<1; j++) {
      for(let corner: Corner=0; corner<this.V.length; corner++) {
        if(this.isEdgeWeldTopologicalConditionsMet(corner)) {
          this.edgeWeld(corner);
        }
      }
    }
    this.cleanRemovedElements();
  }

  private simplifyToNextMeshLevel(): void {
    const existingVertices: Vertex[] = this.getExistingVertices();
    const isVertexAvailable: boolean[] = [];
    
    // mark all existing vertices as available
    for(let vertex of existingVertices) {
      isVertexAvailable[vertex] = true;
    }

    //select a vertex
    let cornerSelected: number = -1;
    for(let i=0; i<this.V.length; i++) {
      if(isVertexAvailable[this.V[i]]) {
        cornerSelected = i;
        break;
      }
    }

    if(cornerSelected == -1) {
      // end algorithm
      return;
    }

    const valenceDelta: number = this.valenceOfVertexAssociatedToCorner(cornerSelected) - 4;

    if(valenceDelta < 0) {
      // for(const i = 0)
    }
    else if(valenceDelta > 0) {
      
    }

    if(this.valenceOfVertexAssociatedToCorner(cornerSelected) != 4) {
      console.log("Something went wrong!");
    }
  }

  // ==================================================================
  // #endregion
  // ==================================================================
}