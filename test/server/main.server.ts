import Attributes from '@rbxts/attributes'
import {
	UIFlexboxLayout,
	Align,
	Wrap,
	AlignContent,
	JustifyContent,
	FlexAttributes,
	FlexItemAttributes,
	FlexProperties,
	FlexItemProperties,
	Direction,
} from '@rbxts/layouts'
const StarterGui = game.GetService('StarterGui')

function createRandomFrame() {
	const frame = new Instance('Frame')
	frame.BackgroundColor3 = BrickColor.random().Color
	frame.BorderSizePixel = 0

	const attr = Attributes<FlexItemProperties>(frame)
	attr.FlexBasis = UDim2.fromOffset(100, 100)
	attr.FlexGrow = 1
	attr.FlexShrink = 1
	return frame
}

const mainFrame = new Instance('Frame')
mainFrame.BackgroundTransparency = 1
mainFrame.Size = new UDim2(1, -20, 1, -20)
mainFrame.Position = UDim2.fromOffset(10, 10)
mainFrame.Parent = new Instance('ScreenGui', StarterGui)

for (let i = 0; i <= 6; i++) {
	createRandomFrame().Parent = mainFrame
}

const attr = Attributes<FlexProperties>(mainFrame)
attr.FlexJustifyContent = JustifyContent.Center
attr.FlexWrap = Wrap.Wrap
attr.FlexDirection = Direction.Row
attr.FlexSpacing = new UDim2(0, 10, 0, 10)
const layout = new UIFlexboxLayout(mainFrame)
