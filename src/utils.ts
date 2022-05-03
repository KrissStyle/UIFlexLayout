/*
 *
 */
export function calculateSize(size: UDim2, parent: GuiBase2d) {
	return new Vector2(
		size.X.Scale * parent.AbsoluteSize.X + size.X.Offset,
		size.Y.Scale * parent.AbsoluteSize.Y + size.Y.Offset,
	)
}

/*
 *	Returns max available size object can grow respecting AutomaticSize, AutomaticCanvasSize, uiConstraints, etc
 */
function getAvailableSize(parentObject: GuiObject): Vector2 {
	return parentObject.AbsoluteSize

	// 	assert(parentObject.Parent)

	// 	// handle ScrollingFrames separately
	// 	if (parentObject.IsA('ScrollingFrame')) {
	// 		return parentObject.AbsoluteCanvasSize
	// 	}

	// 	if (parentObject.AutomaticSize === Enum.AutomaticSize.None) {
	// 		return parentObject.AbsoluteSize
	// 	}
	// 	const size =
	// 		parentObject.Parent.IsA('GuiBase2d') && !parentObject.Parent.IsA('GuiObject')
	// 			? parentObject.Parent.AbsoluteSize
	// 			: getAvailableSize(parentObject.Parent as GuiObject)

	// 	return
}
