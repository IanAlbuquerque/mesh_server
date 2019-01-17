"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mathjs = require("mathjs");
var vector4_1 = require("./vector4");
var Mat4 = /** @class */ (function () {
    function Mat4() {
        var array = [[1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]];
        this.matrix = mathjs.matrix(array);
    }
    Mat4.prototype.vec4ToMatrix = function (vec) {
        var array = [[vec.x],
            [vec.y],
            [vec.z],
            [vec.w]];
        return mathjs.matrix(array);
    };
    Mat4.prototype.setToZero = function () {
        var array = [[0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]];
        this.matrix = mathjs.matrix(array);
    };
    Mat4.prototype.setToIdentity = function () {
        var array = [[1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]];
        this.matrix = mathjs.matrix(array);
    };
    Mat4.prototype.buildSymmetrixFromVec4 = function (vec) {
        var mat = this.vec4ToMatrix(vec);
        var matT = mathjs.transpose(mat);
        this.matrix = mathjs.multiply(mat, matT);
    };
    Mat4.prototype.multiplyVec4 = function (vec) {
        var mat = this.vec4ToMatrix(vec);
        var res = mathjs.multiply(this.matrix, mat);
        return new vector4_1.Vector4(res.get([0, 0]), res.get([1, 0]), res.get([2, 0]), res.get([3, 0]));
    };
    Mat4.prototype.multiplyVec3 = function (vec, w) {
        return this.multiplyVec4(vec.toVec4Homogeneous(w)).toVec3Homogeneous();
    };
    Mat4.prototype.quadricVec4 = function (vec) {
        var mat = this.vec4ToMatrix(vec);
        var matT = mathjs.transpose(mat);
        var res = mathjs.multiply(matT, mathjs.multiply(this.matrix, mat));
        return res.get([0, 0]);
    };
    Mat4.prototype.quadricVec3 = function (vec, w) {
        return this.quadricVec4(vec.toVec4Homogeneous(w));
    };
    Mat4.prototype.add = function (other) {
        var res = new Mat4();
        res.matrix = mathjs.add(this.matrix, other.matrix);
        return res;
    };
    Mat4.prototype.print = function () {
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                console.log(this.matrix.get([i, j]));
            }
            console.log("-");
        }
    };
    return Mat4;
}());
exports.Mat4 = Mat4;
//# sourceMappingURL=mat4.js.map