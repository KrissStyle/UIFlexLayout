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
} from '@rbxts/layouts'
const Players = game.GetService('Players')

function createRandomFrame() {
	const frame = new Instance('Frame')
	frame.BackgroundColor3 = BrickColor.random().Color
	frame.BorderSizePixel = 0

	const attr = Attributes<FlexItemProperties>(frame)
	attr.FlexBasis = UDim2.fromOffset(100, 50)
	return frame
}

const gui = new Instance('ScreenGui', Players.LocalPlayer.FindFirstChildWhichIsA('PlayerGui'))

for (let i = 0; i <= 20; i++) {
	createRandomFrame().Parent = gui
}

const attr = Attributes<FlexProperties>(gui)
attr.FlexWrap = Wrap.Wrap

const layout = new UIFlexboxLayout(gui)
