"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function normalFromTriangleVertices(a, b, c) {
    return b.subtract(a).cross(c.subtract(a)).normalized();
}
exports.normalFromTriangleVertices = normalFromTriangleVertices;
//# sourceMappingURL=functions.js.map