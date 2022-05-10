import Attributes from '@rbxts/attributes'
import { reverseArray } from '@rbxts/reverse-array'
import { AlignContent, Align, Direction, JustifyContent, Wrap } from './enums'
import { ISection } from './ISection'
import { Uv } from './Uv'
import { calculateSize } from './utils'
import { FlexAttributes, FlexItemAttributes } from './constants'
import { Trove } from '@rbxts/trove'
import { $dbg, $print } from 'rbxts-transform-debug'

export interface FlexProperties {
	[FlexAttributes.AlingContent]: AlignContent
	[FlexAttributes.AlignItems]: Align
	[FlexAttributes.Direction]: Direction
	[FlexAttributes.JustifyContent]: JustifyContent
	[FlexAttributes.SortOrder]: 'LayoutOrder' | 'Name'
	[FlexAttributes.Spacing]: UDim2
	[FlexAttributes.Wrap]: Wrap
}

export interface FlexItemProperties {
	[FlexItemAttributes.AlignSelf]: Align
	[FlexItemAttributes.Basis]: UDim2
	[FlexItemAttributes.Grow]: number
	[FlexItemAttributes.Shrink]: number
}

const UDIM2_ZERO = new UDim2()

export class UIFlexboxLayout {
	private container: GuiBase2d
	private trove = new Trove()

	constructor(container: GuiBase2d) {
		this.container = container

		const update = () => this.ApplyLayout()
		const childAdded = (child: Instance) => {
			if (child.IsA('GuiObject')) {
				const childTrove = this.trove.extend()

				childTrove.add(
					(child as GuiObject & ChangedSignal).Changed.Connect((property) => {
						if (property === 'Name' || property === 'LayoutOrder') {
							update()
						} else if (property === 'Parent') {
							this.trove.remove(childTrove)
							update()
						}
					}),
				)
				childTrove.add(
					child.AttributeChanged.Connect((attribute) => {
						if (
							attribute === FlexItemAttributes.AlignSelf ||
							attribute === FlexItemAttributes.Basis ||
							attribute === FlexItemAttributes.Grow ||
							attribute === FlexItemAttributes.Shrink
						) {
							update()
						}
					}),
				)
			}
		}

		this.trove.attachToInstance(container)
		this.trove.add(
			container.AttributeChanged.Connect((attribute) => {
				if (
					attribute === FlexAttributes.AlignItems ||
					attribute === FlexAttributes.AlingContent ||
					attribute === FlexAttributes.Direction ||
					attribute === FlexAttributes.JustifyContent ||
					attribute === FlexAttributes.SortOrder ||
					attribute === FlexAttributes.Spacing ||
					attribute === FlexAttributes.Wrap
				) {
					update()
				}
			}),
		)
		this.trove.add(container.GetPropertyChangedSignal('AbsoluteSize').Connect(update))
		this.trove.add(container.ChildAdded.Connect(childAdded))

		container.GetChildren().forEach(childAdded)

		this.ApplyLayout()
	}

	/**
	 * ApplyLayout
	 */
	public ApplyLayout(): void {
		const { SortOrder } = this.getContainerAttributes()

		const items = this.container
			.GetChildren()
			.filter((x): x is GuiObject => x.IsA('GuiObject') && x.Visible)
			.sort((a, b) => (SortOrder === 'Name' ? a.Name < b.Name : a.LayoutOrder < b.LayoutOrder))

		const sections = this.calculate(items)

		this.reflow(items, sections)
	}

	private calculate(items: GuiObject[]): ISection[] {
		const { FlexAlignItems, FlexDirection, FlexJustifyContent, FlexSpacing, FlexWrap } =
			this.getContainerAttributes()

		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const even = FlexJustifyContent === JustifyContent.SpaceEvenly ? 2 : 0

		const max = Uv.fromVector2(this.container.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, this.container.AbsoluteSize), isColumn)

		let u = 0
		let m = 0
		let grow = 0
		let shrinkScaledSpace = 0

		let maxV = 0
		let first = 0

		let sections: ISection[] = []

		items.forEach((item, i) => {
			const { FlexBasis, FlexGrow, FlexShrink } = this.getItemAttributes(item, FlexAlignItems)

			const basis = Uv.fromVector2(calculateSize(FlexBasis, this.container.AbsoluteSize), isColumn)

			if (FlexWrap !== Wrap.NoWrap && u + basis.u + (m + even) * spacing.u >= max.u) {
				sections.push({
					first,
					last: i - 1,
					u,
					v: maxV,
					remainingSpace: max.u - u - (m + even - 1) * spacing.u,
					totalGrow: grow,
					scaledSpace: shrinkScaledSpace,
				})

				u = 0
				m = 0
				maxV = 0
				grow = 0
				shrinkScaledSpace = 0

				first = i
			}

			if (basis.v > maxV) maxV = basis.v

			grow += FlexGrow
			shrinkScaledSpace += basis.u * FlexShrink

			u += basis.u
			m++
		})

		if (m !== 0)
			sections.push({
				first,
				last: first + m - 1,
				u,
				v: maxV,
				remainingSpace: max.u - u - (m + even - 1) * spacing.u,
				totalGrow: grow,
				scaledSpace: shrinkScaledSpace,
			})

		if (FlexWrap === Wrap.WrapReverse) sections = reverseArray(sections)

		return sections
	}

	private reflow(items: GuiObject[], sections: ISection[]) {
		const { FlexAlignContent, FlexAlignItems, FlexDirection, FlexJustifyContent, FlexSpacing } =
			this.getContainerAttributes()
		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const isReverse = FlexDirection === Direction.ColumnReverse || FlexDirection === Direction.RowReverse

		const max = Uv.fromVector2(this.container.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, this.container.AbsoluteSize), isColumn)

		const n = sections.size()

		const totalSectionV = sections.reduce((acc, s) => acc + s.v, 0)
		const totalSpacingV = (n - 1) * spacing.v
		const totalV = totalSectionV + totalSpacingV

		let spacingV = spacing.v
		let v = 0
		switch (FlexAlignContent) {
			case AlignContent.FlexStart:
				break
			case AlignContent.FlexEnd:
				v = max.v - totalV
				break
			case AlignContent.Center:
				v = (max.v - totalV) / 2
				break
			case AlignContent.Stretch:
				break
			case AlignContent.SpaceAround:
				spacingV = (max.v - totalSectionV) / n
				v = spacingV / 2
				break
			case AlignContent.SpaceBetween:
				spacingV = spacing.v + (max.v - totalV) / (n - 1)
				break
		}

		const scaleV = FlexAlignContent === AlignContent.Stretch ? (max.v - totalSpacingV) / totalSectionV : 1
		for (const section of sections) {
			const sectionV = scaleV * section.v

			let spacingU = spacing.u
			let u = 0
			switch (FlexJustifyContent) {
				case JustifyContent.FlexStart:
					break
				case JustifyContent.FlexEnd:
					u = max.u - section.u - (section.last - section.first) * spacing.u
					break
				case JustifyContent.Center:
					u = (max.u - section.u - (section.last - section.first) * spacing.u) / 2
					break
				case JustifyContent.SpaceBetween:
					spacingU = (max.u - section.u) / (section.last - section.first)
					break
				case JustifyContent.SpaceAround:
					spacingU = spacing.u
					u = (max.u - section.u - (section.last - section.first) * spacing.u) / 2
					break
				case JustifyContent.SpaceEvenly:
					spacingU = (max.u - section.u) / (section.last - section.first + 2)
					u = (max.u - section.u) / (section.last - section.first + 2)
					break
			}

			for (let i = section.first; i <= section.last; i++) {
				const item = items[i]
				const { FlexAlignSelf, FlexBasis, FlexGrow, FlexShrink } = this.getItemAttributes(item, FlexAlignItems)

				const basis = Uv.fromVector2(calculateSize(FlexBasis, this.container.AbsoluteSize), isColumn)
				const offset = new Uv(
					section.remainingSpace >= 0
						? (FlexGrow / section.totalGrow) * section.remainingSpace
						: (section.remainingSpace * (basis.u * FlexShrink)) / section.scaledSpace,
					FlexAlignSelf === Align.Stretch ? sectionV - basis.v : 0,
				)

				const finalV =
					FlexAlignSelf === Align.FlexEnd
						? v + sectionV - basis.v
						: FlexAlignSelf === Align.Center
						? v + (sectionV - basis.v) / 2
						: v

				const position = new Uv(isReverse ? max.u - basis.u - offset.u - u : u, finalV)

				item.Position = UDim2.fromOffset(isColumn ? position.v : position.u, isColumn ? position.u : position.v)
				item.Size = FlexBasis.add(
					UDim2.fromOffset(isColumn ? offset.v : offset.u, isColumn ? offset.u : offset.v),
				)

				u += basis.u + offset.u + spacingU
			}

			v += sectionV + spacingV
		}
	}

	private getContainerAttributes(): FlexProperties {
		const att = Attributes<FlexProperties>(this.container)

		return {
			FlexAlignContent: att.FlexAlignContent ?? AlignContent.Stretch,
			FlexAlignItems: att.FlexAlignItems ?? Align.Stretch,
			FlexDirection: att.FlexDirection ?? Direction.Row,
			FlexJustifyContent: att.FlexJustifyContent ?? JustifyContent.FlexStart,
			FlexSpacing: att.FlexSpacing ?? UDIM2_ZERO,
			FlexWrap: att.FlexWrap ?? Wrap.NoWrap,
			SortOrder: att.SortOrder ?? 'LayoutOrder',
		}
	}

	private getItemAttributes(item: GuiObject, FlexAlignItems: Align): FlexItemProperties {
		const att = Attributes<FlexItemProperties>(item)

		return {
			FlexAlignSelf: att.FlexAlignSelf ?? FlexAlignItems,
			FlexBasis: att.FlexBasis ?? UDIM2_ZERO,
			FlexGrow: att.FlexGrow ?? 1,
			FlexShrink: att.FlexShrink ?? 0,
		}
	}

	public Destroy() {
		this.trove.clean()
	}
}
