"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mathjs = require("mathjs");
var vector4_1 = require("./vector4");
var Vector3 = /** @class */ (function () {
    function Vector3(x, y, z) {
        this.array = [0, 0, 0];
        this.array[0] = x;
        this.array[1] = y;
        this.array[2] = z;
    }
    Object.defineProperty(Vector3.prototype, "x", {
        get: function () {
            return this.array[0];
        },
        set: function (value) {
            this.array[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector3.prototype, "y", {
        get: function () {
            return this.array[1];
        },
        set: function (value) {
            this.array[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector3.prototype, "z", {
        get: function () {
            return this.array[2];
        },
        set: function (value) {
            this.array[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Vector3.prototype.dot = function (vec) {
        return mathjs.dot(this.array, vec.array);
    };
    Vector3.prototype.cross = function (vec) {
        var result = mathjs.cross(this.array, vec.array);
        return new Vector3(result[0], result[1], result[2]);
    };
    Vector3.prototype.subtract = function (vec) {
        var result = mathjs.subtract(this.array, vec.array);
        return new Vector3(result[0], result[1], result[2]);
    };
    Vector3.prototype.asArray = function () {
        return this.array;
    };
    Vector3.prototype.norm = function () {
        return mathjs.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
    };
    Vector3.prototype.toVec4Homogeneous = function (w) {
        return new vector4_1.Vector4(this.array[0], this.array[1], this.array[2], w);
    };
    Vector3.prototype.normalized = function () {
        var result = mathjs.divide(this.array, this.norm());
        return new Vector3(result[0], result[1], result[2]);
    };
    return Vector3;
}());
exports.Vector3 = Vector3;
//# sourceMappingURL=vector3.js.map