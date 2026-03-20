# Wall Tool Guide - SketchUp-Style Line Drawing

## Overview
The wall drawing tool has been refactored to use **SketchUp's continuous click-based polyline drawing pattern**, replacing the previous drag-based approach. This provides better precision and a more familiar UX for CAD users.

## Drawing Behavior

### 1. **Start Drawing**
- Click on the canvas with the **Wall Tool** active
- The first click establishes the starting vertex
- State transitions to: `wallDrawingMode: 'drawing'`

### 2. **Add Vertices (Continuous Mode)**
- Each subsequent click adds a new vertex and continues the line
- A **live preview line** (red, semi-transparent) shows from the last vertex to your cursor in real-time
- The preview updates as you move your mouse

### 3. **Visual Feedback**

#### Snap Indicators (at cursor position):
- **Endpoint Snap** (blue crosshair + label): Snapping to an existing wall endpoint
- **Midpoint Snap** (orange crosshair + label): Snapping to the middle of a wall segment
- **Intersection Snap** (red crosshair + label): Snapping to where two walls meet
- **Segment Snap** (teal dashed line + label): Snapping cursor to the nearest point on a existing wall
- **Grid Snap** (gray crosshair + label): Snapping to the grid (fallback)

#### Angle & Distance Labels:
- **Angle Badge** (top-right of cursor): Displays the angle of the current segment (0-359°)
- **Distance Badge** (mid-point of preview): Displays the length of the current preview segment

#### Committed Points:
- Previous vertices appear as blue circles with white strokes
- These are **draggable** — click and drag a vertex to move it while still in drawing mode

### 4. **Closing the Loop**

#### Option 1: Click Near the First Point
- When within snap distance (~grid-size) of the starting point, a close indicator appears
- Click to automatically close the loop and create the area

#### Option 2: Press Enter Key
- Finishes the drawing and automatically closes the loop (if ≥3 points exist)
- Creates the enclosed area with walls

#### Option 3: Press Escape Key
- Cancels the entire drawing operation
- Returns the tool to waiting mode without creating any walls

### 5. **Undo Last Vertex**
- Press **Backspace** or **Z** (while drawing) to remove the last added vertex
- Does not cancel the entire drawing — you can continue adding more vertices afterward

### 6. **Keyboard Modifiers**

| Key | Effect |
|-----|--------|
| **Shift** | Lock angle to 45° increments (perfect right angles, diagonals) |
| **Enter** | Finish drawing and create the enclosed area |
| **Escape** | Cancel drawing without saving |
| **Backspace / Z** | Undo the last vertex |
| **Right-Click** | Context menu with finish/cancel options |

## Snap Masks (Fine Control)

In the **Tool Sidebar**, individual snap types can be toggled on/off:
- **PT** — Endpoint/point snapping (blue)
- **MID** — Midpoint snapping (orange)
- **INT** — Intersection snapping (red)
- **SEG** — Segment/line snapping (teal)
- **GRID** — Grid snapping (gray fallback)

Toggling these controls which snap targets are considered when you move your cursor or click.

## State Machine

The wall drawing tool uses these internal states:

```
idle (wallDrawingMode: 'waiting')
  ↓ [First Click]
drawing (wallDrawingMode: 'drawing', currentWallPoints: [...])
  ├─ [Add Vertex] → drawing (currentWallPoints.length++)
  ├─ [Close Loop / Press Enter] → idle (create area)
  ├─ [Press Escape] → idle (cancel, no area created)
  └─ [Drag Vertex] → drawing (vertex position updated)
```

## Example Workflow

1. **Select Wall Tool** from toolbar
2. **Click to place first point** → wall tool enters drawing mode
3. **Move cursor** → see live red preview line + angle/distance labels
4. **Click to place second point** → add vertex, preview updates
5. **Click to place third point** → now able to close the loop
6. **Move toward the first point** → close indicator appears when near
7. **Click on that close indicator** → loop closes, area is created ✓

OR alternative finish:

7. **Press Enter** → finishes automatically, closes loop if ≥3 points

## Technical Implementation

**Modified Files:**
- `src/features/floorplan/floorPlanStore.js` — Added `wallDrawingMode`, `lastSnapTarget` state
- `src/components/floorplan/FloorCanvas.jsx` — Refactored to click-based (not drag-based) interaction
- `src/components/floorplan/canvas/LineDrawingOverlay.jsx` — Enhanced with snap type labels

**Snap Engine (unchanged but integrated):**
- `src/features/floorplan/snapEngine.js` — Provides granular snap mask (point, midpoint, intersection, segment, grid)

**Key Changes vs Previous Behavior:**
- ~~Drag to draw~~ → Click to add vertices
- ~~Single continuous drag~~ → Multiple click operations
- Added visual snap type labels
- Added angle and distance badges in real-time
- Added keyboard shortcuts for finish/cancel/undo

---

**Ready to use!** Select the Wall Tool and start clicking. The visual feedback should feel familiar to SketchUp or AutoCAD users.
