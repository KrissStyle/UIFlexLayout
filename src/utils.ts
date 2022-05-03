/**
 * Translates UDim2 to Vector2
 */
export function calculateSize(udim2: UDim2, vec: Vector2) {
	return new Vector2(udim2.X.Scale * vec.X + udim2.X.Offset, udim2.Y.Scale * vec.Y + udim2.Y.Offset)
}

/**
 * Returns max available size object can grow
 * respecting AutomaticSize, AutomaticCanvasSize, uiConstraints, etc
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
