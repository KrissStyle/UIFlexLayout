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
	attr.FlexBasis = new UDim2(0.25, 0, 0, 50 /* math.random() * 100 + 50, math.random() * 100 + 50 */)
	// const rng = math.random()
	// if (rng > 0.75) frame.SetAttribute('AlignSelf', Align.Center)
	// else if (rng > 0.5) frame.SetAttribute('AlignSelf', Align.FlexEnd)
	// else if (rng > 0.25) frame.SetAttribute('AlignSelf', Align.Stretch)
	return frame
}

const gui = new Instance('ScreenGui', Players.LocalPlayer.FindFirstChildWhichIsA('PlayerGui'))

for (let i = 0; i <= 20; i++) {
	createRandomFrame().Parent = gui
}

const attr = Attributes<FlexProperties>(gui)
// attr.FlexAlignContent = AlignContent.FlexEnd
// attr.FlexAlignItems = Align.FlexEnd
// attr.FlexJustifyContent = JustifyContent.SpaceEvenly
// attr.FlexAlignContent = AlignContent.FlexStart
// attr.FlexSpacing = new UDim2(0, 10, 0, 0)
attr.FlexWrap = Wrap.Wrap

// const layout = new UIFlexboxLayout(gui)
UIFlexboxLayout.ApplyLayout(gui)
gui.GetPropertyChangedSignal('AbsoluteSize').Connect(() => UIFlexboxLayout.ApplyLayout(gui))
// wait(30)
// layout.ApplyLayout()
