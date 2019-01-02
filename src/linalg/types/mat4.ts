import * as mathjs from "mathjs";
import { Vector4 } from "./vector4";
import { Vector3 } from "./vector3";

export class Mat4 {

  private matrix: mathjs.Matrix;

  constructor() {
    const array: number[][] = [ [1, 0, 0, 0],
                                [0, 1, 0, 0],
                                [0, 0, 1, 0],
                                [0, 0, 0, 1]];
    this.matrix = mathjs.matrix(array);
  }

  private vec4ToMatrix(vec: Vector4): mathjs.Matrix {
    const array: number[][] = [ [vec.x],
                                [vec.y],
                                [vec.z],
                                [vec.w]];
    return mathjs.matrix(array);
  }

  public setToZero(): void {
    const array: number[][] = [ [0, 0, 0, 0],
                                [0, 0, 0, 0],
                                [0, 0, 0, 0],
                                [0, 0, 0, 0]];
    this.matrix = mathjs.matrix(array);
  }
  
  public setToIdentity(): void {
    const array: number[][] = [ [1, 0, 0, 0],
                                [0, 1, 0, 0],
                                [0, 0, 1, 0],
                                [0, 0, 0, 1]];
    this.matrix = mathjs.matrix(array);
  }

  public buildSymmetrixFromVec4(vec: Vector4): void {
    const mat: mathjs.Matrix = this.vec4ToMatrix(vec);
    const matT: mathjs.Matrix = mathjs.transpose(mat) as mathjs.Matrix;
    this.matrix = mathjs.multiply(mat, matT) as mathjs.Matrix;
  }

  public multiplyVec4(vec: Vector4): Vector4 {
    const mat: mathjs.Matrix = this.vec4ToMatrix(vec);
    const res: mathjs.Matrix = mathjs.multiply(this.matrix, mat) as mathjs.Matrix;
    return new Vector4(res[0][0], res[1][0], res[2][0], res[3][0]);
  }

  public multiplyVec3(vec: Vector3, w: number): Vector3 {
    return this.multiplyVec4(vec.toVec4Homogeneous(w)).toVec3Homogeneous();
  }

  public quadricVec4(vec: Vector4): number {
    const mat: mathjs.Matrix = this.vec4ToMatrix(vec);
    const matT: mathjs.Matrix = mathjs.transpose(mat) as mathjs.Matrix;
    const res: mathjs.Matrix = mathjs.multiply(matT, mathjs.multiply(this.matrix, mat)) as mathjs.Matrix;
    return res[0][0];
  }

  public quadricVec3(vec: Vector3, w: number): number {
    return this.quadricVec4(vec.toVec4Homogeneous(w));
  }

  public add(other: Mat4): Mat4 {
    const res: Mat4 = new Mat4();
    res.matrix = mathjs.add(this.matrix, other.matrix) as mathjs.Matrix;
    return res;
  }
}