import * as mathjs from "mathjs";
import { Vector3 } from "./vector3";
import { Result } from "range-parser";

export class Vector4 {

  private array: number[] = [0, 0, 0, 0];

  get x(): number {
    return this.array[0];
  }
  set x(value: number) {
    this.array[0] = value;
  }

  get y(): number {
    return this.array[1];
  }
  set y(value: number) {
    this.array[1] = value;
  }

  get z(): number {
    return this.array[2];
  }
  set z(value: number) {
    this.array[2] = value;
  }

  get w(): number {
    return this.array[3];
  }
  set w(value: number) {
    this.array[3] = value;
  }

  constructor(x: number, y: number, z: number, w: number) {
    this.array[0] = x;
    this.array[1] = y;
    this.array[2] = z;
    this.array[3] = w;
  }

  public dot(vec: Vector4): number {
    return mathjs.dot(this.array, vec.array) as number;
  }

  public subtract(vec: Vector4): Vector4 {
    const result: number[] = mathjs.subtract(this.array, vec.array) as number[];
    return new Vector4(result[0], result[1], result[2], result[3]);
  }

  public asArray(): number[] {
    return this.array;
  }

  public norm(): number {
    return mathjs.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
  }

  public toVec3Homogeneous(): Vector3 {
    if(this.array[3] === 0) {
      console.log("Error on toVec3Homogeneous: w coordinate equals zero!");
      return new Vector3(0, 0, 0);
    }
    return new Vector3(this.array[0] / this.array[3], this.array[1] / this.array[3], this.array[2] / this.array[3]);
  }

  public normalized(): Vector4 {
    const result: number[] = mathjs.divide(this.array, this.norm()) as number[];
    return new Vector4(result[0], result[1], result[2], result[3]);
  }
}