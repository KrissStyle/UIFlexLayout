import Attributes from '@rbxts/attributes'
import { reverseArray } from '@rbxts/reverse-array'
import { AlignContent, Align, Direction, JustifyContent, Wrap } from '../enums'
import { ISection } from '../ISection'
import { Uv } from '../Uv'
import { calculateSize } from '../utils'
import { FlexAttributes, FlexItemAttributes } from '../constants'
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
	private trove = new Trove()

	constructor(private parent: GuiBase2d) {
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

		this.trove.attachToInstance(parent)
		this.trove.add(
			parent.AttributeChanged.Connect((attribute) => {
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
		this.trove.add(parent.GetPropertyChangedSignal('AbsoluteSize').Connect(update))
		this.trove.add(parent.ChildAdded.Connect(childAdded))

		parent.GetChildren().forEach(childAdded)

		this.ApplyLayout()
	}

	/**
	 * ApplyLayout
	 */
	public ApplyLayout(): void {
		const {
			FlexAlignContent = AlignContent.Stretch,
			FlexAlignItems = Align.Stretch,
			FlexDirection = Direction.Row,
			FlexJustifyContent = JustifyContent.FlexStart,
			FlexSpacing = UDIM2_ZERO,
			FlexWrap = Wrap.NoWrap,
			SortOrder = 'LayoutOrder',
		} = Attributes<Partial<FlexProperties>>(this.parent)

		const items = this.parent
			.GetChildren()
			.filter((x): x is GuiObject => x.IsA('GuiObject') && x.Visible)
			.sort((a, b) => (SortOrder === 'Name' ? a.Name < b.Name : a.LayoutOrder < b.LayoutOrder))

		const sections = this.Calculate(items)

		this.Arrange(items, sections)
	}

	public Calculate(items: GuiObject[]): ISection[] {
		const {
			FlexAlignContent = AlignContent.Stretch,
			FlexAlignItems = Align.Stretch,
			FlexDirection = Direction.Row,
			FlexJustifyContent = JustifyContent.FlexStart,
			FlexSpacing = UDIM2_ZERO,
			FlexWrap = Wrap.NoWrap,
			SortOrder = 'LayoutOrder',
		} = Attributes<FlexProperties>(this.parent)

		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const even = FlexJustifyContent === JustifyContent.SpaceEvenly ? 2 : 0

		const max = Uv.fromVector2(this.parent.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, this.parent.AbsoluteSize), isColumn)

		let u = 0
		let m = 0
		let grow = 0
		let shrinkScaledSpace = 0

		let maxV = 0
		let first = 0

		let sections: ISection[] = []

		items.forEach((item, i) => {
			const {
				FlexAlignSelf = FlexAlignItems,
				FlexBasis = UDIM2_ZERO,
				FlexGrow = 1,
				FlexShrink = 0,
			} = Attributes<FlexItemProperties>(item)

			const basis = Uv.fromVector2(calculateSize(FlexBasis, this.parent.AbsoluteSize), isColumn)

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

	public Arrange(items: GuiObject[], sections: ISection[]) {
		const {
			FlexAlignContent = AlignContent.Stretch,
			FlexAlignItems = Align.Stretch,
			FlexDirection = Direction.Row,
			FlexJustifyContent = JustifyContent.FlexStart,
			FlexSpacing = UDIM2_ZERO,
			FlexWrap = Wrap.NoWrap,
			SortOrder = 'LayoutOrder',
		} = Attributes<FlexProperties>(this.parent)

		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const isReverse = FlexDirection === Direction.ColumnReverse || FlexDirection === Direction.RowReverse

		const max = Uv.fromVector2(this.parent.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, this.parent.AbsoluteSize), isColumn)

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
				const {
					FlexAlignSelf = FlexAlignItems,
					FlexBasis = UDIM2_ZERO,
					FlexGrow = 1,
					FlexShrink = 0,
				} = Attributes<FlexItemProperties>(item)

				const basis = Uv.fromVector2(calculateSize(FlexBasis, this.parent.AbsoluteSize), isColumn)
				let offset = new Uv(
					section.remainingSpace >= 0
						? (FlexGrow / section.totalGrow) * section.remainingSpace
						: (section.remainingSpace * (basis.u * FlexShrink)) / section.scaledSpace,
					0,
				)

				const finalV =
					FlexAlignSelf === Align.FlexEnd
						? v + sectionV - basis.v
						: FlexAlignSelf === Align.Center
						? v + (sectionV - basis.v) / 2
						: v

				if (FlexAlignSelf === Align.Stretch) offset = new Uv(offset.u, sectionV - basis.v)

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

	public Destroy() {
		this.trove.clean()
	}
}
