"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mathjs = require("mathjs");
var vector3_1 = require("./vector3");
var Vector4 = /** @class */ (function () {
    function Vector4(x, y, z, w) {
        this.array = [0, 0, 0, 0];
        this.array[0] = x;
        this.array[1] = y;
        this.array[2] = z;
        this.array[3] = w;
    }
    Object.defineProperty(Vector4.prototype, "x", {
        get: function () {
            return this.array[0];
        },
        set: function (value) {
            this.array[0] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector4.prototype, "y", {
        get: function () {
            return this.array[1];
        },
        set: function (value) {
            this.array[1] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector4.prototype, "z", {
        get: function () {
            return this.array[2];
        },
        set: function (value) {
            this.array[2] = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector4.prototype, "w", {
        get: function () {
            return this.array[3];
        },
        set: function (value) {
            this.array[3] = value;
        },
        enumerable: true,
        configurable: true
    });
    Vector4.prototype.dot = function (vec) {
        return mathjs.dot(this.array, vec.array);
    };
    Vector4.prototype.subtract = function (vec) {
        var result = mathjs.subtract(this.array, vec.array);
        return new Vector4(result[0], result[1], result[2], result[3]);
    };
    Vector4.prototype.asArray = function () {
        return this.array;
    };
    Vector4.prototype.norm = function () {
        return mathjs.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
    };
    Vector4.prototype.toVec3Homogeneous = function () {
        if (this.array[3] === 0) {
            console.log("Error on toVec3Homogeneous: w coordinate equals zero!");
            return new vector3_1.Vector3(0, 0, 0);
        }
        return new vector3_1.Vector3(this.array[0] / this.array[3], this.array[1] / this.array[3], this.array[2] / this.array[3]);
    };
    Vector4.prototype.normalized = function () {
        var result = mathjs.divide(this.array, this.norm());
        return new Vector4(result[0], result[1], result[2], result[3]);
    };
    return Vector4;
}());
exports.Vector4 = Vector4;
//# sourceMappingURL=vector4.js.map