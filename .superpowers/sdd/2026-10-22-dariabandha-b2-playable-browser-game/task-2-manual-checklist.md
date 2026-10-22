# B2 Task 2 — Manual Court Screenshot Checklist

Status: checklist prepared; manual browser/WebGL validation has not been performed. Automated Task 2 review is clean (68/68 tests and production build; no code/scope findings).

Record browser, OS, viewport resolution, and whether WebGL starts. Capture screenshots at the page's initial viewport and inspect both court ends.

- [ ] Initial spawn: entire 4v4 court visible; all eight primitive players present; identify the single human and seven inactive AI markers by shape.
- [ ] Initial spawn: verify team emblems and attacker/guard/Sikka role markers are distinguishable without relying on color alone.
- [ ] Initial spawn: row, front/back end, and left/right side lines are visible and aligned with ground edges; lane strips and central spine are separately visible.
- [ ] Initial spawn: attacker stamina bar and each actor's state ring are visible and do not obscure court lines.
- [ ] Resize to a narrow and a wide viewport; verify the canvas fills its container, the court is not geometrically stretched, and both ends remain in view.
- [ ] Court end A: capture the end line and nearest row line, confirm the court remains centred and all actors remain on the ground plane.
- [ ] Court end B: capture the opposite end and nearest row line; verify symmetrical visibility and no line omission.
- [ ] Note any clipping, marker overlap, illegible line/strip contrast, or WebGL startup failure with a screenshot and environment details.
