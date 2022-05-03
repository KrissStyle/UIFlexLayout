export class Section {
	constructor(
		public readonly first: number,
		public readonly last: number,
		public readonly u: number,
		public readonly v: number,
		public readonly grow: number,
		public readonly shrink: number,
	) {}
}
