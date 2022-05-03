export class Uv {
	constructor(public readonly u: number, public readonly v: number) {}

	static fromVector2(vector: Vector2, swap: boolean): Uv {
		return new Uv(swap ? vector.Y : vector.X, swap ? vector.X : vector.Y)
	}

	static toVector2(uv: Uv, swap: boolean): Vector2 {
		return new Vector2(swap ? uv.v : uv.u, swap ? uv.u : uv.v)
	}
}
