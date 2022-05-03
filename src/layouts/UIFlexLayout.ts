import Attributes from '@rbxts/attributes'
import { reverseArray } from '@rbxts/reverse-array'
import { AlignContent, Align, Direction, JustifyContent, Wrap } from '../enums'
import { Section } from '../Section'
import { Uv } from '../Uv'
import { calculateSize } from '../utils'
import { FlexAttributes, FlexItemAttributes } from '../constants'
import { Janitor } from '@rbxts/janitor'

export type FlexProperties = Partial<{
	[FlexAttributes.AlingContent]: AlignContent
	[FlexAttributes.AlignItems]: Align
	[FlexAttributes.Direction]: Direction
	[FlexAttributes.JustifyContent]: JustifyContent
	[FlexAttributes.SortOrder]: Enum.SortOrder
	[FlexAttributes.Spacing]: UDim2
	[FlexAttributes.Wrap]: Wrap
}>

export type FlexItemProperties = Partial<{
	[FlexItemAttributes.AlignSelf]: Align
	[FlexItemAttributes.Basis]: UDim2
	[FlexItemAttributes.Grow]: number
	[FlexItemAttributes.Shrink]: number
}>

export class UIFlexboxLayout {
	// private janitor = new Janitor()

	// constructor(private parent: GuiBase2d) {
	// 	const update = () => this.ApplyLayout()

	// 	const childAdded = (child: Instance) => {
	// 		if (classIs(child, 'GuiObject')) {
	// 			this.janitor.Add(
	// 				parent.GetAttributeChangedSignal(FlexItemAttributes.AlignSelf).Connect(update),
	// 				'Disconnect',
	// 			)
	// 		}
	// 	}

	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.AlignItems).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.AlingContent).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.Direction).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.JustifyContent).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.SortOrder).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.Spacing).Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.GetAttributeChangedSignal(FlexAttributes.Wrap).Connect(update), 'Disconnect')

	// 	this.janitor.Add(parent.GetPropertyChangedSignal('AbsoluteSize').Connect(update), 'Disconnect')
	// 	this.janitor.Add(parent.ChildAdded.Connect(childAdded), 'Disconnect')
	// 	this.janitor.Add(parent.ChildRemoved.Connect(childRemoved), 'Disconnect')
	// }

	/**
	 * ApplyLayout
	 */
	// public ApplyLayout(): void {}

	public static Calculate(parent: GuiBase2d, items: GuiObject[]): Section[] {
		const {
			FlexAlignContent = AlignContent.Stretch,
			FlexDirection = Direction.Row,
			FlexWrap = Wrap.NoWrap,
			FlexJustifyContent = JustifyContent.FlexStart,
			FlexAlignItems = Align.FlexStart,
			SortOrder = Enum.SortOrder.LayoutOrder,
			FlexSpacing = new UDim2(),
		} = Attributes<FlexProperties>(parent)

		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const even = FlexJustifyContent === JustifyContent.SpaceEvenly ? 2 : 0

		const max = Uv.fromVector2(parent.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, parent), isColumn)

		let u = 0
		let m = 0

		let maxV = 0
		let first = 0

		let sections: Section[] = []

		items.forEach((item, i) => {
			const {
				FlexAlignSelf = FlexAlignItems,
				FlexBasis = item.Size,
				FlexGrow = 1,
				FlexShrink = 0,
			} = Attributes<FlexItemProperties>(item)

			const size = Uv.fromVector2(calculateSize(FlexBasis, parent), isColumn)

			if (FlexWrap !== Wrap.NoWrap && u + size.u + (m + even) * spacing.u > max.u) {
				sections.push(new Section(first, i - 1, u, maxV))

				u = 0
				m = 0
				maxV = 0

				first = i
			}

			if (size.v > maxV) maxV = size.v

			u += size.u
			m++
		})

		if (m !== 0) sections.push(new Section(first, first + m - 1, u, maxV))

		if (FlexWrap === Wrap.WrapReverse) sections = reverseArray(sections)

		return sections
	}

	public static Arrange(parent: GuiBase2d, items: GuiObject[], sections: Section[]) {
		const {
			FlexAlignContent = AlignContent.Stretch,
			FlexDirection = Direction.Row,
			FlexWrap = Wrap.NoWrap,
			FlexJustifyContent = JustifyContent.FlexStart,
			FlexAlignItems = Align.FlexStart,
			SortOrder = Enum.SortOrder.LayoutOrder,
			FlexSpacing = new UDim2(),
		} = Attributes<FlexProperties>(parent)

		const isColumn = FlexDirection === Direction.Column || FlexDirection === Direction.ColumnReverse
		const isReverse = FlexDirection === Direction.ColumnReverse || FlexDirection === Direction.RowReverse

		const max = Uv.fromVector2(parent.AbsoluteSize, isColumn)
		const spacing = Uv.fromVector2(calculateSize(FlexSpacing, parent), isColumn)

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
					FlexBasis = item.Size,
					FlexGrow = 1,
					FlexShrink = 0,
				} = Attributes<FlexItemProperties>(item)

				const basis = Uv.fromVector2(calculateSize(FlexBasis, parent), isColumn)
				let offset = new Uv(0, 0)

				const finalV =
					FlexAlignSelf === Align.FlexEnd
						? v + sectionV - basis.v
						: FlexAlignSelf === Align.Center
						? v + (sectionV - basis.v) / 2
						: v

				if (FlexAlignSelf === Align.Stretch) offset = new Uv(0, sectionV - basis.v)

				const position = new Uv(isReverse ? max.u - basis.u - u : u, finalV)

				item.Position = UDim2.fromOffset(isColumn ? position.v : position.u, isColumn ? position.u : position.v)
				item.Size = FlexBasis.add(
					UDim2.fromOffset(isColumn ? offset.v : offset.u, isColumn ? offset.u : offset.v),
				)

				u += basis.u + spacingU
			}

			v += sectionV + spacingV
		}
	}

	public static ApplyLayout(parent: GuiBase2d) {
		const { SortOrder = Enum.SortOrder.LayoutOrder } = Attributes<FlexProperties>(parent)

		const items = parent
			.GetChildren()
			.filter((x): x is GuiObject => x.IsA('GuiObject') && x.Visible)
			.sort((a, b) => (SortOrder === Enum.SortOrder.Name ? a.Name < b.Name : a.LayoutOrder < b.LayoutOrder))

		const sections = this.Calculate(parent, items)

		this.Arrange(parent, items, sections)
	}
}
