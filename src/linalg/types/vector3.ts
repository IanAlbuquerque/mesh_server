import * as mathjs from "mathjs";

export class Vector3 {

  private array: number[] = [0, 0, 0];

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

  constructor(x: number, y: number, z: number) {
    this.array[0] = x;
    this.array[1] = y;
    this.array[2] = z;
  }

  public dot(vec: Vector3): number {
    return mathjs.dot(this.array, vec.array) as number;
  }

  public cross(vec: Vector3): Vector3 {
    const result = mathjs.cross(this.array, vec.array) as number[];
    return new Vector3(result[0], result[1], result[2]);
  }

  public subtract(vec: Vector3): Vector3 {
    const result: number[] = mathjs.subtract(this.array, vec.array) as number[];
    return new Vector3(result[0], result[1], result[2]);
  }

  public asArray(): number[] {
    return this.array;
  }

  public norm(): number {
    return mathjs.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
  }

  public normalized(): Vector3 {
    const result: number[] = mathjs.divide(this.array, this.norm()) as number[];
    return new Vector3(result[0], result[1], result[2]);
  }
}