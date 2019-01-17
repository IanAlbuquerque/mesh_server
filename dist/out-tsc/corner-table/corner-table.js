"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linalg_1 = require("./../linalg");
var fibonacci_heap_1 = require("@tyriar/fibonacci-heap");
var REMOVED_CORNER = -1;
// This data structure assumes sphere-like meshes
// No borders
// No genus
// 2-Manifold
// Faces are composed of 3 corners
var CornerTable = /** @class */ (function () {
    function CornerTable() {
        // ==================================================================
        // #region DATA MEMBERS
        // ==================================================================
        // The geometry array
        this.G = [];
        // The vertices array
        this.V = [];
        // The opposite corner array
        this.O = [];
        // the quadrics array
        // for use in the simplification algorithm only
        this.Q = [];
        this.heap = new fibonacci_heap_1.FibonacciHeap();
        this.validEntryPerVertex = [];
        this.vertexToCornerDic = {};
        // ==================================================================
        // #endregion
        // ==================================================================
        // ==================================================================
        // #region EDGEBREAKER
        // ==================================================================
        this.isVertexVisitedEdgeBreaker = [];
        this.isTriangleVisitedEdgeBreaker = [];
        this.deltaEdgeBreaker = [];
        this.clers = [];
        this.lastTriangleDecompressed = 0;
        this.lastVertexEncountered = 0;
        this.G = [];
        this.V = [];
        this.O = [];
    }
    CornerTable.prototype.getData = function () {
        return { G: this.G, V: this.V, O: this.O };
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region CORNER ACCESS OPERATIONS
    // ==================================================================
    // Returns the next corner in the same face
    // (following the counter-clockwise normal convention)
    CornerTable.prototype.next = function (corner) {
        if (corner % 3 === 2) {
            return corner - 2;
        }
        else {
            return corner + 1;
        }
    };
    // Returns the previous corner in the same face
    // (following the counter-clockwise normal convention)
    CornerTable.prototype.prev = function (corner) {
        return this.next(this.next(corner));
    };
    // See image for explanation
    // TODO: Think of a better name!
    CornerTable.prototype.left = function (corner) {
        return this.O[this.next(corner)];
    };
    // See image for explanation
    // TODO: Think of a better name!
    CornerTable.prototype.right = function (corner) {
        return this.O[this.prev(corner)];
    };
    // The corner of the same vertex that is clockwise to the given corner
    CornerTable.prototype.clockwise = function (corner) {
        return this.prev(this.right(corner));
    };
    // The corner of the same vertex that is counterclockwise to the given corner
    CornerTable.prototype.counterclockwise = function (corner) {
        return this.next(this.left(corner));
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region CLASS INITIALIZATION
    // ==================================================================
    CornerTable.prototype.parseSingleOBJLine = function (objFileLine) {
        var words = objFileLine.split(/\s+/g);
        if (words[0] === "#") {
            // comments
            return;
        }
        else if (words[0] === "v") {
            // new vertex
            // Syntax note: +stringVariable evaluates stringVariable to a number
            this.G.push(+words[1]);
            this.G.push(+words[2]);
            this.G.push(+words[3]);
        }
        else if (words[0] === "f") {
            // new face
            var v1 = words[1].split("/");
            var v2 = words[2].split("/");
            var v3 = words[3].split("/");
            this.V.push(+v1[0] - 1);
            this.V.push(+v2[0] - 1);
            this.V.push(+v3[0] - 1);
        }
    };
    CornerTable.prototype.halfEdgeToKey = function (vertexA, vertexB) {
        return vertexA.toString() + ';' + vertexB.toString();
    };
    CornerTable.prototype.initFromOBJFileData = function (objFileData) {
        this.G = [];
        this.V = [];
        // Reads the .obj file line by line, parsing the given vertices and faces
        // Only the G and V arrays are updated in this step
        var lines = objFileData.split("\n");
        for (var i = 0; i < lines.length; i++) {
            this.parseSingleOBJLine(lines[i]);
        }
        this.O = [];
        for (var i = 0; i < this.V.length; i++) {
            this.O.push(REMOVED_CORNER);
        }
        var numTriangles = this.V.length / 3;
        var halfEdgeToCornerDictionary = {};
        // Reads each triangle once, storing the corner opposite to each half edge
        // This uses a dictionary for faster access
        for (var i = 0; i < numTriangles; i++) {
            var corner1 = i * 3;
            var corner2 = (i * 3) + 1;
            var corner3 = (i * 3) + 2;
            var vertex1 = this.V[corner1];
            var vertex2 = this.V[corner2];
            var vertex3 = this.V[corner3];
            halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex1, vertex2)] = corner3;
            halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex2, vertex3)] = corner1;
            halfEdgeToCornerDictionary[this.halfEdgeToKey(vertex3, vertex1)] = corner2;
        }
        // Now, with the dictionary formed, we just have to assign the opposite corner to each corner
        // So, iterate among all corners
        for (var corner = 0; corner < this.V.length; corner++) {
            var nextCorner = this.next(corner);
            var nextNextCorner = this.next(this.next(corner));
            var nextVertex = this.V[nextCorner];
            var nextNextVertex = this.V[nextNextCorner];
            // The order here is important
            // We want the halfedge opposite to the half edge defined by our corner corner
            this.O[corner] = halfEdgeToCornerDictionary[this.halfEdgeToKey(nextNextVertex, nextVertex)];
            // If our hypothesis is correct, all corners should have opposites!
            if (this.O[corner] === undefined || this.O[corner] === null) {
                throw "Given mesh does not agree with hypothesis";
            }
        }
        if (this.getExistingVertices().length - (this.V.length / 2) + (this.V.length / 3) !== 2) {
            throw "Mesh not topologically good!";
        }
        else {
            console.log("Corner table initialized!");
        }
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region DATA STRUCTURE TRAVERSAL
    // ==================================================================
    CornerTable.prototype.getCornersThatShareSameVertexClockwise = function (corner) {
        var corners = [];
        var iterator = corner;
        do {
            iterator = this.clockwise(iterator);
            if (this.isCornerInMesh(iterator)) {
                corners.push(iterator);
            }
        } while (iterator !== corner);
        return corners;
    };
    CornerTable.prototype.valenceOfVertexAssociatedToCorner = function (corner) {
        return this.getCornersThatShareSameVertexClockwise(corner).length;
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region DATA STRUCTURE MAINTANENCE
    // ==================================================================
    CornerTable.prototype.removeUnusedCorners = function () {
        var newV = [];
        var newO = [];
        var cornerNewPlace = {};
        for (var corner = 0; corner < this.V.length; corner++) {
            if (this.isCornerInMesh(corner)) {
                if (!this.isCornerInMesh(this.O[corner])) {
                    console.log("Something wrong on cleanup! Opposite corner not in mesh!");
                }
                newV.push(this.V[corner]);
                newO.push(this.O[corner]);
                cornerNewPlace[corner] = newO.length - 1;
            }
        }
        for (var corner = 0; corner < newO.length; corner++) {
            newO[corner] = cornerNewPlace[newO[corner]];
        }
        this.V = newV;
        this.O = newO;
    };
    CornerTable.prototype.removeUnusedVertices = function () {
        var newG = [];
        var existingVertices = this.getExistingVertices();
        var vertexNewPlace = {};
        for (var _i = 0, existingVertices_1 = existingVertices; _i < existingVertices_1.length; _i++) {
            var vertex = existingVertices_1[_i];
            newG.push(this.getVertexX(vertex));
            newG.push(this.getVertexY(vertex));
            newG.push(this.getVertexZ(vertex));
            vertexNewPlace[vertex] = (newG.length / 3) - 1;
        }
        for (var corner = 0; corner < this.V.length; corner++) {
            this.V[corner] = vertexNewPlace[this.V[corner]];
        }
        this.G = newG;
    };
    CornerTable.prototype.cleanRemovedElements = function () {
        this.removeUnusedCorners();
        this.removeUnusedVertices();
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region DATA STRUCTURE QUERIES
    // ==================================================================
    CornerTable.prototype.isCornerTableTopologicallyGood = function () {
        var foundError = false;
        if (this.getExistingVertices().length - (this.getExistingCorners().length / 2) + (this.getExistingCorners().length / 3) !== 2) {
            console.log("ERROR EULER CHARACTERISTIC");
            foundError = true;
        }
        var corners = this.getExistingCorners();
        for (var _i = 0, corners_1 = corners; _i < corners_1.length; _i++) {
            var corner = corners_1[_i];
            if (!this.isCornerInMesh(corner) || !this.isCornerInMesh(this.next(corner)) || !this.isCornerInMesh(this.prev(corner))) {
                console.log("ERROR TRIANGLE NOT CONSISTENTLY REMOVED");
                foundError = true;
                break;
            }
        }
        for (var _a = 0, corners_2 = corners; _a < corners_2.length; _a++) {
            var corner = corners_2[_a];
            if (this.V[corner] === this.V[this.next(corner)] || this.V[corner] === this.V[this.prev(corner)] || this.V[this.next(corner)] === this.V[this.prev(corner)]) {
                console.log("ERROR VERTEX TRIANGLE");
                foundError = true;
                break;
            }
        }
        for (var _b = 0, corners_3 = corners; _b < corners_3.length; _b++) {
            var corner = corners_3[_b];
            if (this.O[this.O[corner]] !== corner) {
                console.log("ERROR OPPOSITE OPERATOR TRIANGLE");
                foundError = true;
                break;
            }
        }
        for (var _c = 0, corners_4 = corners; _c < corners_4.length; _c++) {
            var corner = corners_4[_c];
            var clockwise = this.getCornersThatShareSameVertexClockwise(corner);
            for (var _d = 0, clockwise_1 = clockwise; _d < clockwise_1.length; _d++) {
                var cloCorner = clockwise_1[_d];
                if (this.V[corner] != this.V[cloCorner]) {
                    console.log("ERROR CORNERS CLOCKWISE DIFF VERTEX!");
                    foundError = true;
                    break;
                }
            }
        }
        for (var _e = 0, corners_5 = corners; _e < corners_5.length; _e++) {
            var corner1 = corners_5[_e];
            for (var _f = 0, corners_6 = corners; _f < corners_6.length; _f++) {
                var corner2 = corners_6[_f];
                if (this.V[corner1] === this.V[corner2] &&
                    this.getCornersThatShareSameVertexClockwise(corner1).indexOf(corner2) === -1) {
                    console.log("ERROR SAME VERTEX, DIFFERENT RING " + corner1 + " " + corner2 + " vertex=" + this.V[corner1]);
                    foundError = true;
                    break;
                }
            }
        }
        for (var _g = 0, corners_7 = corners; _g < corners_7.length; _g++) {
            var corner = corners_7[_g];
            if (this.valenceOfVertexAssociatedToCorner(corner) < 3) {
                console.log("ERROR VALENCE CORNER");
                foundError = true;
                break;
            }
        }
        if (foundError) {
            return false;
        }
        return true;
    };
    CornerTable.prototype.isCornerInMesh = function (c0) {
        return this.O[c0] !== REMOVED_CORNER;
    };
    CornerTable.prototype.isThereAnEdgeFromCornerToVertex = function (corner, v) {
        var w = this.V[corner];
        var corners = this.getCornersThatShareSameVertexClockwise(corner);
        for (var _i = 0, corners_8 = corners; _i < corners_8.length; _i++) {
            var c = corners_8[_i];
            if (v === this.V[this.next(c)]) {
                // console.log("incompatibleCorners = " + c + "_" + this.next(c));
                return true;
            }
        }
        return false;
    };
    CornerTable.prototype.getVertexX = function (vertex) {
        return this.G[vertex * 3 + 0];
    };
    CornerTable.prototype.getVertexY = function (vertex) {
        return this.G[vertex * 3 + 1];
    };
    CornerTable.prototype.getVertexZ = function (vertex) {
        return this.G[vertex * 3 + 2];
    };
    CornerTable.prototype.getVertexCoords = function (vertex) {
        return new linalg_1.Vector3(this.getVertexX(vertex), this.getVertexY(vertex), this.getVertexZ(vertex));
    };
    CornerTable.prototype.getExistingVertices = function () {
        var existingVertices = [];
        for (var corner = 0; corner < this.V.length; corner++) {
            if (this.isCornerInMesh(corner) && existingVertices.indexOf(this.V[corner]) < 0) {
                existingVertices.push(this.V[corner]);
            }
        }
        return existingVertices;
    };
    CornerTable.prototype.getExistingCorners = function () {
        var existingCorners = [];
        for (var corner = 0; corner < this.V.length; corner++) {
            if (this.isCornerInMesh(corner)) {
                existingCorners.push(corner);
            }
        }
        return existingCorners;
    };
    CornerTable.prototype.getLinkClockwise = function (c0) {
        var corners = this.getCornersThatShareSameVertexClockwise(c0);
        var link = [];
        for (var _i = 0, corners_9 = corners; _i < corners_9.length; _i++) {
            var corner = corners_9[_i];
            link.push(this.V[this.next(corner)]);
        }
        return link;
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region STELLAR OPERATORS
    // ==================================================================
    CornerTable.prototype.isEdgeWeldTopologicalConditionsMet = function (c0) {
        var c2 = this.prev(c0);
        var w = this.V[this.O[c2]];
        if (!this.isCornerInMesh(c0)) {
            return false;
        }
        if (this.valenceOfVertexAssociatedToCorner(c0) !== 4) {
            return false;
        }
        if (this.isThereAnEdgeFromCornerToVertex(c2, w)) {
            return false;
        }
        return true;
    };
    CornerTable.prototype.isEdgeFlipGeometryConditionsMet = function (c0) {
        // Label incident corners
        var c1 = this.next(c0);
        var c2 = this.prev(c0);
        var c3 = this.O[c0];
        var t = this.V[c0];
        var s = this.V[c3];
        var v = this.V[c1];
        var u = this.V[c2];
        var ccu = new linalg_1.Vector3(this.G[u * 3 + 0], this.G[u * 3 + 1], this.G[u * 3 + 2]);
        var ccv = new linalg_1.Vector3(this.G[v * 3 + 0], this.G[v * 3 + 1], this.G[v * 3 + 2]);
        var ccs = new linalg_1.Vector3(this.G[s * 3 + 0], this.G[s * 3 + 1], this.G[s * 3 + 2]);
        var cct = new linalg_1.Vector3(this.G[t * 3 + 0], this.G[t * 3 + 1], this.G[t * 3 + 2]);
        var nold1 = linalg_1.normalFromTriangleVertices(cct, ccv, ccu);
        var nold2 = linalg_1.normalFromTriangleVertices(ccs, ccu, ccv);
        var nnew1 = linalg_1.normalFromTriangleVertices(ccu, cct, ccs);
        var nnew2 = linalg_1.normalFromTriangleVertices(cct, ccv, ccs);
        if (nold1.dot(nnew1) < 0)
            return false;
        if (nold1.dot(nnew2) < 0)
            return false;
        if (nold2.dot(nnew1) < 0)
            return false;
        if (nold2.dot(nnew2) < 0)
            return false;
        return true;
    };
    CornerTable.prototype.isEdgeFlipTopologicalConditionsMet = function (c0) {
        var c1 = this.next(c0);
        var c2 = this.prev(c0);
        // cannot perform operation on vertices with valence <= 3
        if (this.valenceOfVertexAssociatedToCorner(c1) <= 3)
            return false;
        if (this.valenceOfVertexAssociatedToCorner(c2) <= 3)
            return false;
        if (this.isThereAnEdgeFromCornerToVertex(c0, this.V[this.O[c0]]))
            return false;
        return true;
    };
    // https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
    CornerTable.prototype.edgeWeld = function (c0) {
        // Assign Incidences
        var c1 = this.next(c0);
        var c2 = this.prev(c0);
        var c3 = this.O[c1];
        var c4 = this.next(c3);
        var c5 = this.prev(c3);
        var a = this.O[this.next(this.O[c5])];
        var b = this.O[this.prev(this.O[c2])];
        var w = this.V[this.O[c2]];
        var u = this.V[c2];
        var v = this.V[c0];
        var s = this.V[c3];
        var t = this.V[c1];
        // Perform vertex removal
        this.V[c0] = w;
        this.V[c4] = w;
        this.vertexToCornerDic[t] = c1;
        this.vertexToCornerDic[s] = c3;
        this.vertexToCornerDic[u] = c2;
        this.vertexToCornerDic[w] = c0;
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
    };
    // https://www.visgraf.impa.br/Data/RefBib/PS_PDF/sib03wilson/fffc.pdf
    CornerTable.prototype.edgeFlip = function (c0) {
        // Label incident corners
        var c1 = this.next(c0);
        var c2 = this.prev(c0);
        var c3 = this.O[c0];
        var c4 = this.next(c3);
        var c5 = this.prev(c3);
        var a = this.O[c5];
        var b = this.O[c1];
        var c = this.O[c4];
        var d = this.O[c2];
        // Label incident vertices
        var t = this.V[c0];
        var s = this.V[c3];
        var v = this.V[c1];
        var u = this.V[c2]; // u is not used anywhere
        if (t == s || t == v || t == u ||
            s == v || s == u ||
            v == u) {
            console.log("Vertices: t,s,v,u =" + t + "-" + c0 + "," + s + "-" + c3 + "," + v + "-" + c1 + "," + u + "-" + c2);
            // console.log("c0 = " + c0);
            // console.log("O[c0] = " + this.O[c0]);
            // for(let corner of this.getCornersThatShareSameVertexClockwise(c0)) {
            //   console.log(corner);
            // }
            // console.log("c3 = " + c3)
            // console.log("O[c3] = " + this.O[c3]);
            // for(let corner of this.getCornersThatShareSameVertexClockwise(c0)) {
            //   console.log(corner);
            // }
        }
        // =====================================
        // Perform swap
        this.V[c0] = t; // stays the same
        this.V[c1] = s;
        this.V[c2] = u; // stays the same
        this.V[c3] = v;
        this.V[c4] = s;
        this.V[c5] = t;
        this.vertexToCornerDic[t] = c0;
        this.vertexToCornerDic[s] = c1;
        this.vertexToCornerDic[u] = c2;
        this.vertexToCornerDic[v] = c3;
        // Reset opposite corners
        this.O[c0] = a;
        this.O[c1] = b; // stays the same
        this.O[c2] = c3;
        this.O[c3] = c2;
        this.O[c4] = d;
        this.O[c5] = c;
        this.O[a] = c0;
        this.O[b] = c1;
        this.O[c] = c5;
        this.O[d] = c4;
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region SIMPLIFICATION ALGORITHMS
    // ==================================================================
    CornerTable.prototype.getQuadricFromCorner = function (c0) {
        var v = this.V[c0];
        var link = this.getLinkClockwise(c0);
        var triangles = [];
        for (var i = 0; i < link.length - 1; i++) {
            // order is important for normal
            triangles.push({ p0: v, p1: link[i + 1], p2: link[i] });
        }
        triangles.push({ p0: v, p1: link[0], p2: link[link.length - 1] });
        var normals = [];
        for (var _i = 0, triangles_1 = triangles; _i < triangles_1.length; _i++) {
            var triangle = triangles_1[_i];
            normals.push(linalg_1.normalFromTriangleVertices(this.getVertexCoords(triangle.p0), this.getVertexCoords(triangle.p1), this.getVertexCoords(triangle.p2)));
        }
        var res = new linalg_1.Mat4();
        res.setToZero();
        var vCoords = this.getVertexCoords(v);
        for (var _a = 0, normals_1 = normals; _a < normals_1.length; _a++) {
            var normal = normals_1[_a];
            var normalQuad = new linalg_1.Mat4();
            var w = normal.dot(vCoords) * -1;
            normalQuad.buildSymmetrixFromVec4(normal.toVec4Homogeneous(w));
            res = res.add(normalQuad);
        }
        return res;
    };
    // ==================================================================
    // #endregion
    // ==================================================================
    // ==================================================================
    // #region SIMPLIFICATION ALGORITHMS
    // ==================================================================
    CornerTable.prototype.applyEdgeWelds = function () {
        for (var j = 0; j < 1; j++) {
            for (var corner = 0; corner < this.V.length; corner++) {
                if (this.isEdgeWeldTopologicalConditionsMet(corner)) {
                    this.edgeWeld(corner);
                }
            }
        }
        this.cleanRemovedElements();
    };
    CornerTable.prototype.findCornerAtAGivenVertex = function (v) {
        for (var i = 0; i < this.V.length; i++) {
            if (this.isCornerInMesh(i) && this.V[i] === v) {
                return i;
            }
        }
        console.log("Error! Could not find a corner for vertex " + v);
        return -1;
    };
    CornerTable.prototype.simplifyToNextMeshLevel = function () {
        var existingVertices = this.getExistingVertices();
        var isVertexAvailable = {};
        // Lets not deal with meshes with very few vertices
        // It breaks one of the proofs that ensures that we can flip edges to make valence = 4 (duh)
        if (existingVertices.length <= 4) {
            return;
        }
        // mark all existing vertices as available
        for (var _i = 0, existingVertices_2 = existingVertices; _i < existingVertices_2.length; _i++) {
            var vertex = existingVertices_2[_i];
            isVertexAvailable[vertex] = true;
        }
        console.log("HEAP SIZE = " + this.heap.size());
        var nodesToAddBackToQueue = [];
        while (true) {
            //select a vertex
            var cornerSelected = -1;
            var vertexSelected = -1;
            // for(let corner: Corner =0; corner<this.V.length; corner++) {
            //   if(isVertexAvailable[this.V[corner]] && this.isCornerInMesh(corner)) {
            //     cornerSelected = corner;
            //     vertexSelected = this.V[cornerSelected];
            //     break;
            //   }
            // }
            while (true) {
                if (this.heap.isEmpty()) {
                    break;
                }
                var node = this.heap.extractMinimum();
                if (!node.value.valid) {
                    continue;
                }
                if (!isVertexAvailable[node.value.vertex]) {
                    nodesToAddBackToQueue.push({ cost: node.key, entry: node.value });
                    continue;
                }
                vertexSelected = node.value.vertex;
                cornerSelected = this.vertexToCornerDic[vertexSelected];
                break;
            }
            // end algorithm
            if (cornerSelected === -1) {
                console.log("ending....");
                break;
            }
            var valenceDelta = this.valenceOfVertexAssociatedToCorner(cornerSelected) - 4;
            // valence must be >= 3 (hence, valenceDelta >= -1)
            // so valenceDelta < 0 is equivalent to valenceDelta === -1
            if (valenceDelta < 0) {
                var cornerToFlip = -1;
                var cost = -1;
                var corners = this.getCornersThatShareSameVertexClockwise(cornerSelected);
                for (var _a = 0, corners_10 = corners; _a < corners_10.length; _a++) {
                    var corner = corners_10[_a];
                    if (this.isEdgeFlipTopologicalConditionsMet(corner)) {
                        if (cornerToFlip === -1) {
                            cornerToFlip = corner;
                            cost = this.costOfSingleEdgeSwap(cornerToFlip);
                        }
                        else {
                            var newCost = this.costOfSingleEdgeSwap(corner);
                            if (newCost < cost) {
                                cornerToFlip = corner;
                                cost = newCost;
                            }
                        }
                    }
                }
                if (cornerToFlip === -1) {
                    console.log("Something is wrong with the data structure! Corner to flip (delta<0) wasnt found.");
                }
                this.edgeFlip(cornerToFlip);
            }
            else if (valenceDelta > 0) {
                for (var i = 0; i < valenceDelta; i++) {
                    var cornerToFlip = -1;
                    var cost = -1;
                    var corners = this.getCornersThatShareSameVertexClockwise(cornerSelected);
                    for (var _b = 0, corners_11 = corners; _b < corners_11.length; _b++) {
                        var corner = corners_11[_b];
                        // choosing the this.next instead of this.next preserves existing corners around the vertice
                        // if(this.isEdgeFlipTopologicalConditionsMet(this.next(corner))) {
                        //   cornerToFlip = corner;
                        //   break;
                        // }
                        if (this.isEdgeFlipTopologicalConditionsMet(this.next(corner))) {
                            if (cornerToFlip === -1) {
                                cornerToFlip = corner;
                                cost = this.costOfSingleEdgeSwap(this.next(corner));
                            }
                            else {
                                var newCost = this.costOfSingleEdgeSwap(this.next(corner));
                                if (newCost < cost) {
                                    cornerToFlip = corner;
                                    cost = newCost;
                                }
                            }
                        }
                    }
                    if (cornerToFlip === -1) {
                        console.log("Something is wrong with the data structure! Corner to flip (delta>0) wasnt found.");
                    }
                    this.edgeFlip(this.next(cornerToFlip));
                    cornerSelected = cornerToFlip;
                    // vertexSelected = this.V[cornerSelected];
                    if (this.V[cornerSelected] !== vertexSelected) {
                        console.log("Corner selected went wrong!");
                    }
                }
            }
            if (this.valenceOfVertexAssociatedToCorner(cornerSelected) !== 4) {
                console.log("Something went wrong on corner valence!");
            }
            if (!this.isEdgeWeldTopologicalConditionsMet(cornerSelected)) {
                if (!this.isEdgeWeldTopologicalConditionsMet(this.clockwise(cornerSelected))) {
                    console.log("Something went wrong on edge weld condition");
                    continue;
                }
                else {
                    this.edgeWeld(this.clockwise(cornerSelected));
                }
            }
            else {
                this.edgeWeld(cornerSelected);
            }
            // mark vertices
            // let corners: Corner[] = this.getCornersThatShareSameVertexClockwise(cornerSelected);
            // for(const corner of corners) {
            //   isVertexAvailable[this.V[this.next(corner)]] = false;
            // }
            // isVertexAvailable[this.V[cornerSelected]] = false;
            isVertexAvailable[vertexSelected] = false;
            isVertexAvailable[this.V[cornerSelected]] = false;
            isVertexAvailable[this.V[this.next(cornerSelected)]] = false;
            isVertexAvailable[this.V[this.prev(cornerSelected)]] = false;
            isVertexAvailable[this.V[this.O[this.next(cornerSelected)]]] = false;
            this.Q[this.V[cornerSelected]] = this.Q[this.V[cornerSelected]].add(this.Q[vertexSelected]);
            this.Q[this.V[this.prev(cornerSelected)]] = this.Q[this.V[this.prev(cornerSelected)]].add(this.Q[vertexSelected]);
            var link1 = this.getLinkClockwise(cornerSelected);
            var link2 = this.getLinkClockwise(this.prev(cornerSelected));
            var union = [];
            for (var _c = 0, link1_1 = link1; _c < link1_1.length; _c++) {
                var vertex = link1_1[_c];
                if (union.indexOf(vertex) === -1) {
                    union.push(vertex);
                }
            }
            for (var _d = 0, link2_1 = link2; _d < link2_1.length; _d++) {
                var vertex = link2_1[_d];
                if (union.indexOf(vertex) === -1) {
                    union.push(vertex);
                }
            }
            this.validEntryPerVertex[vertexSelected].valid = false;
            for (var _e = 0, union_1 = union; _e < union_1.length; _e++) {
                var vertex = union_1[_e];
                this.validEntryPerVertex[vertex].valid = false;
                var c0 = this.vertexToCornerDic[vertex];
                var error = this.costOfVertex(c0);
                // console.log(error);
                var entry = { vertex: vertex, valid: true };
                this.validEntryPerVertex[vertex] = entry;
                this.heap.insert(error, entry);
            }
        }
        for (var _f = 0, nodesToAddBackToQueue_1 = nodesToAddBackToQueue; _f < nodesToAddBackToQueue_1.length; _f++) {
            var node = nodesToAddBackToQueue_1[_f];
            this.heap.insert(node.cost, node.entry);
        }
        console.log("Heap ending with = " + this.heap.size());
    };
    CornerTable.prototype.costOfSingleEdgeSwap = function (c0) {
        return this.Q[this.V[this.O[c0]]].quadricVec3(this.getVertexCoords(this.V[c0]), 1.0);
    };
    CornerTable.prototype.costOfEdgeSwaps = function (c0) {
        var corners = this.getCornersThatShareSameVertexClockwise(c0);
        var cost = 0;
        if (this.valenceOfVertexAssociatedToCorner(c0) < 4) {
            for (var _i = 0, corners_12 = corners; _i < corners_12.length; _i++) {
                var corner = corners_12[_i];
                cost += this.costOfSingleEdgeSwap(corner);
            }
        }
        else if (this.valenceOfVertexAssociatedToCorner(c0) > 4) {
            for (var _a = 0, corners_13 = corners; _a < corners_13.length; _a++) {
                var corner = corners_13[_a];
                cost += this.costOfSingleEdgeSwap(this.next(corner));
            }
        }
        else {
            cost = 0;
        }
        return cost;
    };
    CornerTable.prototype.costOfVertexRemoval = function (c0) {
        var link = this.getLinkClockwise(c0);
        var values = [];
        for (var _i = 0, link_1 = link; _i < link_1.length; _i++) {
            var vertex = link_1[_i];
            var value = this.Q[this.V[c0]].add(this.Q[vertex]).quadricVec3(this.getVertexCoords(vertex), 1.0);
            values.push(value);
        }
        return Math.min.apply(Math, values); // spread operator
    };
    CornerTable.prototype.costOfVertex = function (c0) {
        var alpha = 0.75;
        var beta = 1.0 - alpha;
        var C = this.costOfVertexRemoval(c0);
        var S = this.costOfEdgeSwaps(c0);
        return (alpha * C) + (beta * S);
    };
    CornerTable.prototype.simplifyNLevels = function (n) {
        var vertices = this.getExistingVertices();
        console.log("Starting num vertices = " + vertices.length);
        this.initQuadrics();
        var corners = this.getExistingCorners();
        this.heap.clear();
        this.validEntryPerVertex = {};
        for (var _i = 0, corners_14 = corners; _i < corners_14.length; _i++) {
            var corner = corners_14[_i];
            var v = this.V[corner];
            if (this.validEntryPerVertex[v] === undefined) {
                var error = this.costOfVertex(corner);
                var entry = { vertex: v, valid: true };
                this.heap.insert(error, entry);
                this.validEntryPerVertex[v] = entry;
            }
        }
        this.vertexToCornerDic = {};
        for (var _a = 0, corners_15 = corners; _a < corners_15.length; _a++) {
            var corner = corners_15[_a];
            this.vertexToCornerDic[this.V[corner]] = corner;
        }
        for (var i = 0; i < n; i++) {
            this.simplifyToNextMeshLevel();
            console.log(i + "- num vertices = " + this.getExistingVertices().length);
            var used = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log("The script uses approximately " + Math.round(used * 100) / 100 + " MB");
            console.log("=========================");
        }
        this.cleanRemovedElements();
        this.Q = [];
        this.heap.clear();
        this.vertexToCornerDic = {};
    };
    CornerTable.prototype.initQuadrics = function () {
        var vertices = this.getExistingVertices();
        var corners = this.getExistingCorners();
        var verticesComputed = [];
        this.Q = [];
        for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
            var vertex = vertices_1[_i];
            this.Q.push();
        }
        for (var _a = 0, corners_16 = corners; _a < corners_16.length; _a++) {
            var corner = corners_16[_a];
            if (this.isCornerInMesh(corner) && verticesComputed.indexOf(this.V[corner]) == -1) {
                this.Q[this.V[corner]] = this.getQuadricFromCorner(corner);
                verticesComputed.push(this.V[corner]);
            }
        }
    };
    CornerTable.prototype.cornerTriangle = function (c0) {
        return (c0 - (c0 % 3)) / 3;
    };
    CornerTable.prototype.initCompression = function (c0) {
        this.isVertexVisitedEdgeBreaker = [];
        this.isTriangleVisitedEdgeBreaker = [];
        this.deltaEdgeBreaker = [];
        this.clers = [];
        for (var i = 0; i < this.V.length / 3; i++) {
            this.isTriangleVisitedEdgeBreaker[i] = false;
        }
        for (var i = 0; i < this.V.length; i++) {
            this.isVertexVisitedEdgeBreaker[i] = false;
        }
        this.deltaEdgeBreaker.push(this.getVertexX(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexY(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexZ(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexX(this.V[c0]) - this.getVertexX(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexY(this.V[c0]) - this.getVertexY(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexZ(this.V[c0]) - this.getVertexZ(this.V[this.prev(c0)]));
        this.deltaEdgeBreaker.push(this.getVertexX(this.V[this.next(c0)]) - this.getVertexX(this.V[c0]));
        this.deltaEdgeBreaker.push(this.getVertexY(this.V[this.next(c0)]) - this.getVertexY(this.V[c0]));
        this.deltaEdgeBreaker.push(this.getVertexZ(this.V[this.next(c0)]) - this.getVertexZ(this.V[c0]));
        this.isVertexVisitedEdgeBreaker[this.V[c0]] = true;
        this.isVertexVisitedEdgeBreaker[this.V[this.prev(c0)]] = true;
        this.isVertexVisitedEdgeBreaker[this.V[this.next(c0)]] = true;
        this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(c0)] = true;
        this.compressEdgeBreaker(this.O[c0]);
        var res = { delta: this.deltaEdgeBreaker, clers: this.clers };
        this.isVertexVisitedEdgeBreaker = [];
        this.isTriangleVisitedEdgeBreaker = [];
        this.deltaEdgeBreaker = [];
        this.clers = [];
        return res;
    };
    CornerTable.prototype.compressEdgeBreaker = function (c0) {
        while (true) {
            this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(c0)] = true;
            if (!this.isVertexVisitedEdgeBreaker[this.V[c0]]) {
                this.deltaEdgeBreaker.push(this.getVertexX(this.V[c0]) -
                    this.getVertexX(this.V[this.prev(c0)]) -
                    this.getVertexX(this.V[this.next(c0)]) +
                    this.getVertexX(this.V[this.O[c0]]));
                this.deltaEdgeBreaker.push(this.getVertexY(this.V[c0]) -
                    this.getVertexY(this.V[this.prev(c0)]) -
                    this.getVertexY(this.V[this.next(c0)]) +
                    this.getVertexY(this.V[this.O[c0]]));
                this.deltaEdgeBreaker.push(this.getVertexZ(this.V[c0]) -
                    this.getVertexZ(this.V[this.prev(c0)]) -
                    this.getVertexZ(this.V[this.next(c0)]) +
                    this.getVertexZ(this.V[this.O[c0]]));
                this.clers.push("C");
                this.isVertexVisitedEdgeBreaker[this.V[c0]] = true;
                c0 = this.left(c0);
            }
            else if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.left(c0))]) {
                if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.right(c0))]) {
                    this.clers.push("E");
                    return;
                }
                else {
                    this.clers.push("R");
                    c0 = this.right(c0);
                }
            }
            else {
                if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.right(c0))]) {
                    this.clers.push("L");
                    c0 = this.left(c0);
                }
                else {
                    this.clers.push("S");
                    this.compressEdgeBreaker(this.left(c0));
                    c0 = this.right(c0);
                }
            }
        }
    };
    CornerTable.prototype.decompress = function (delta, clers) {
        this.clers = clers;
        this.deltaEdgeBreaker = delta;
        var numCorners = (clers.length + 1) * 3;
        this.V = [0, 1, 2];
        this.O = [-1, -3, -1];
        for (var i = 0; i < numCorners - 3; i++) {
            this.V.push(0);
            this.O.push(-3);
        }
        this.lastTriangleDecompressed = 0;
        this.lastVertexEncountered = 2;
        this.decompressConnectivity(1);
        var numTriangles = delta.length / 3;
        this.isVertexVisitedEdgeBreaker = [];
        this.isTriangleVisitedEdgeBreaker = [];
        for (var i = 0; i < numTriangles; i++) {
            this.isTriangleVisitedEdgeBreaker[i] = false;
        }
        var vertices = this.getExistingVertices();
        for (var _i = 0, vertices_2 = vertices; _i < vertices_2.length; _i++) {
            var vertex = vertices_2[_i];
            this.isVertexVisitedEdgeBreaker[vertex] = false;
            this.G.push(-1);
            this.G.push(-1);
            this.G.push(-1);
        }
        this.G[0] = (this.deltaEdgeBreaker.shift());
        this.G[1] = (this.deltaEdgeBreaker.shift());
        this.G[2] = (this.deltaEdgeBreaker.shift());
        this.G[3] = (this.deltaEdgeBreaker.shift() + this.G[0]);
        this.G[4] = (this.deltaEdgeBreaker.shift() + this.G[1]);
        this.G[5] = (this.deltaEdgeBreaker.shift() + this.G[2]);
        this.G[6] = (this.deltaEdgeBreaker.shift() + this.G[3]);
        this.G[7] = (this.deltaEdgeBreaker.shift() + this.G[4]);
        this.G[8] = (this.deltaEdgeBreaker.shift() + this.G[5]);
        this.lastVertexEncountered = 2;
        this.isVertexVisitedEdgeBreaker[0] = true;
        this.isVertexVisitedEdgeBreaker[1] = true;
        this.isVertexVisitedEdgeBreaker[2] = true;
        this.isTriangleVisitedEdgeBreaker[0] = true;
        this.decompressVertices(this.O[1]);
        this.isVertexVisitedEdgeBreaker = [];
        this.isTriangleVisitedEdgeBreaker = [];
        this.deltaEdgeBreaker = [];
        this.clers = [];
    };
    CornerTable.prototype.decompressConnectivity = function (c0) {
        while (true) {
            this.lastTriangleDecompressed++;
            this.O[c0] = 3 * this.lastTriangleDecompressed;
            this.O[3 * this.lastTriangleDecompressed] = c0;
            this.V[3 * this.lastTriangleDecompressed + 1] = this.V[this.prev(c0)];
            this.V[3 * this.lastTriangleDecompressed + 2] = this.V[this.next(c0)];
            c0 = this.next(this.O[c0]);
            switch (this.clers.shift()) {
                case "C":
                    this.O[this.next(c0)] = -1;
                    this.V[3 * this.lastTriangleDecompressed] = ++this.lastVertexEncountered;
                    break;
                case "L":
                    this.O[this.next(c0)] = -2;
                    this.zip(this.next(c0));
                    break;
                case "R":
                    this.O[c0] = -2;
                    c0 = this.next(c0);
                    break;
                case "S":
                    this.decompressConnectivity(c0);
                    c0 = this.next(c0);
                    break;
                case "E":
                    this.O[c0] = -2;
                    this.O[this.next(c0)] = -2;
                    this.zip(this.next(c0));
                    return;
                    break;
            }
        }
    };
    CornerTable.prototype.zip = function (c0) {
        var b = this.next(c0);
        while (this.O[b] > 0) {
            b = this.next(this.O[b]);
        }
        if (this.O[b] != -1) {
            return;
        }
        this.O[c0] = b;
        this.O[b] = c0;
        var a = this.prev(c0);
        this.V[this.prev(a)] = this.V[this.prev(b)];
        while (this.O[a] >= 0 && b !== a) {
            a = this.prev(this.O[a]);
            this.V[this.prev(a)] = this.V[this.prev(b)];
        }
        c0 = this.prev(c0);
        while (this.O[c0] >= 0 && c0 !== b) {
            c0 = this.prev(this.O[c0]);
        }
        if (this.O[c0] == -2) {
            this.zip(c0);
        }
    };
    CornerTable.prototype.decompressVertices = function (c0) {
        while (true) {
            this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(c0)] = true;
            if (!this.isVertexVisitedEdgeBreaker[this.V[c0]]) {
                this.lastVertexEncountered++;
                this.G[this.lastVertexEncountered * 3 + 0] = this.getVertexX(this.V[this.prev(c0)]) +
                    this.getVertexX(this.V[this.next(c0)]) -
                    this.getVertexX(this.V[this.O[c0]]) +
                    this.deltaEdgeBreaker.shift();
                this.G[this.lastVertexEncountered * 3 + 1] = this.getVertexY(this.V[this.prev(c0)]) +
                    this.getVertexY(this.V[this.next(c0)]) -
                    this.getVertexY(this.V[this.O[c0]]) +
                    this.deltaEdgeBreaker.shift();
                this.G[this.lastVertexEncountered * 3 + 2] = this.getVertexZ(this.V[this.prev(c0)]) +
                    this.getVertexZ(this.V[this.next(c0)]) -
                    this.getVertexZ(this.V[this.O[c0]]) +
                    this.deltaEdgeBreaker.shift();
                this.isVertexVisitedEdgeBreaker[this.V[c0]] = true;
                c0 = this.left(c0);
            }
            else if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.left(c0))]) {
                if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.right(c0))]) {
                    return;
                }
                else {
                    c0 = this.right(c0);
                }
            }
            else {
                if (this.isTriangleVisitedEdgeBreaker[this.cornerTriangle(this.right(c0))]) {
                    c0 = this.left(c0);
                }
                else {
                    this.decompressVertices(this.left(c0));
                    c0 = this.right(c0);
                }
            }
        }
    };
    return CornerTable;
}());
exports.CornerTable = CornerTable;
//# sourceMappingURL=corner-table.js.map