import { Vector3 } from "./types/vector3";

export function normalFromTriangleVertices(a: Vector3, b: Vector3, c: Vector3): Vector3 {
  return b.subtract(a).cross(c.subtract(a)).normalized();
}