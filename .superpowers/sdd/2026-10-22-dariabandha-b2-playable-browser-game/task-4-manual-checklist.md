# B2 Task 4 Manual Browser Checklist

Status: partially verified in Chrome; B2 manual acceptance remains incomplete. Do not treat unchecked items as passed.

## Environment and attempt

- Browser: Google Chrome on the host Windows device (browser version not recorded).
- Host OS: Windows.
- Viewport resolution: not recorded; the captured Chrome window was 656 × 720 pixels and the game page was scrolled to the scene.
- Server: Vite 6.4.5 reported ready at `http://127.0.0.1:4173/` with host access enabled.
- Browser result: `ERR_CONNECTION_TIMED_OUT` (“127.0.0.1 took too long to respond”). Retried after starting the local server outside the sandbox; same result.
- Follow-up attempt: Vite was bound to `0.0.0.0:4173` and reported the machine address `http://192.168.1.100:4173/`; opening that URL in the same in-app browser returned `net::ERR_ABORTED` before the game loaded.
- Chrome follow-up: after starting Vite with host access, Chrome loaded `http://127.0.0.1:4173/`. Its accessibility tree showed the game page, HUD, and controls; captured scenes showed the rendered court, line markings, role markers, and player figures. The HUD reported the live controlled role/team, phase, score, half clock, stamina, and latest call. Clock was observed counting down. A Chrome memory-usage label was seen during browser inspection, but no formal performance measurement was made.
- Repeat verification: after gameplay changed the controlled seat from Attacker to Sikka with the `attacker-left-court` call, clicking Reset restored Attacker / Team 1, phase `playing`, score 0–0, half 1 at 3:30, stamina 100%, and `Toss: Team 1 attacks`. This matches the initial opening state and toss observed in the same page session.
- Input verification: a keyboard direction input caused the attacker to leave the court and the HUD to show the resulting Sikka role/call. A pointer drag on the on-screen movement joystick visibly changed the scene/camera position. The on-screen Sprint and Tag controls were visible, but their gameplay effects were not confirmed. No physical touchscreen or phone/emulator was used.
- Startup/frame-time/memory: not measured. WebGL and device/touch capability were not reached.

## Checklist

- [x] Start the local Vite server and confirm it reports ready.
- [x] Attempt to open the local URL in the available in-app browser.
- [x] Retry with the server started outside the sandbox.
- [x] Retry through the machine's network interface with Vite bound to `0.0.0.0`.
- [x] Confirm the game DOM and HUD are visible in Chrome.
- [x] Confirm the WebGL scene starts and the court, line markings, role markers, and player figures render.
- [ ] Visually confirm all eight players render without overlap/occlusion.
- [x] Verify HUD role/team, phase, score, clock, stamina, and latest call in the live page.
- [x] Click Reset match after changing the fixture state; confirm the initial role/team/setup, clock, score, stamina, and toss return unchanged.
- [x] Exercise keyboard attacker input in the browser and observe the attacker-boundary transition to Sikka.
- [ ] Exercise keyboard input while controlling Sikka; Sikka appeared as the controlled role, but movement behavior was not clearly confirmed.
- [ ] Exercise a controlled Guard fixture in the browser; the fixed Quick Match page exposes no role/fixture selector.
- [ ] Exercise touch controls on a phone or emulator. Desktop pointer input through the movement joystick worked, but this does not verify physical touch.
- [ ] Save and inspect initial-spawn and both-court-ends screenshots. In-session Chrome captures showed the initial court and a later role view, but both court ends were not established or saved as artifacts.
- [ ] Record actual browser, OS, viewport/device, startup, and performance measurements if available.

## Acceptance result

B2 browser/manual acceptance remains incomplete. Chrome on the host device confirmed the game/HUD, live clock, court rendering, and a pointer-driven scene change. Reset restored the initial controlled seat and same toss after gameplay changed the role; attacker keyboard input produced the observed boundary transition to Sikka. All-eight-player visibility, keyboard control while Sikka, a controlled Guard fixture, Sprint/Tag effects, physical touch, saved court-end screenshots, and performance measurements remain unverified. The earlier in-app browser connectivity failures and Chrome checks are recorded above.
