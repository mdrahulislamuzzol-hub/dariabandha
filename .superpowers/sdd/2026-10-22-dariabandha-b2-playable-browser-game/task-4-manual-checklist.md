# B2 Task 4 Manual Browser Checklist

Status: partially verified in host Chrome and the Codex in-app browser; B2 manual acceptance remains incomplete. Do not treat unchecked items as passed.

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
- Remaining-check retry: a direction key was sent while the HUD showed Sikka; the screenshot changed perspective, but movement was not clear enough to mark as passed. Clicking Tag while Sikka left the latest call unchanged. Sprint was tried without simultaneous movement, so stamina/acceleration behavior was not validated. Chrome zoom was adjusted to inspect the court; the view still clipped/overlapped figures and did not confirm all eight. The page exposes no role or fixture selector for a controlled Guard.
- Final Codex in-app browser retry (2026-10-23): `http://localhost:4173/` loaded successfully after binding Vite to `0.0.0.0`. The page title, HUD, WebGL court, controls, and running half clock were visible. Sustained ArrowLeft input reproduced the attacker-left-court transition to Sikka. While Sikka, a sustained ArrowRight input changed the court/camera view, confirming responsive movement. Holding Shift with ArrowDown while the attacker was controlled changed stamina from 100% to 67% and produced the expected attacker-left-court call; this confirms sprint input and its stamina drain alongside movement, although movement reached the boundary during the same sample. Clicking Tag while Sikka again left the latest call unchanged. Reset restored Attacker / Team 1, `playing`, 0–0, half 1 at 3:30, stamina 100%, and `Toss: Team 1 attacks`. A side view showed distinct player figures from both teams, but some figures/markers overlapped, so all-eight-without-occlusion remains unconfirmed. No phone/emulator, Guard fixture, saved court-end screenshots, or formal performance instrumentation was available.
- Startup/frame-time/memory: not measured. WebGL was reached; physical device/touch capability was not available for this run.

## Checklist

- [x] Start the local Vite server and confirm it reports ready.
- [x] Open the local URL in the Codex in-app browser on the final retry; earlier connection errors are documented above.
- [x] Retry with the server started outside the sandbox.
- [x] Retry through the machine's network interface with Vite bound to `0.0.0.0`.
- [x] Confirm the game DOM and HUD are visible in Chrome.
- [x] Confirm the WebGL scene starts and the court, line markings, role markers, and player figures render.
- [ ] Visually confirm all eight players render without overlap/occlusion. The side view showed distinct figures from both teams, but some figures/markers overlapped.
- [x] Verify HUD role/team, phase, score, clock, stamina, and latest call in the live page.
- [x] Click Reset match after changing the fixture state; confirm the initial role/team/setup, clock, score, stamina, and toss return unchanged.
- [x] Exercise keyboard attacker input in the browser and observe the attacker-boundary transition to Sikka.
- [x] Exercise keyboard input while controlling Sikka; sustained ArrowRight input visibly changed the court/camera view.
- [ ] Exercise a controlled Guard fixture in the browser; the fixed Quick Match page exposes no role/fixture selector.
- [x] Exercise Sprint while moving; holding Shift with ArrowDown reduced stamina from 100% to 67% and the attacker moved until the boundary transition.
- [ ] Exercise Tag effect; clicking Tag while controlling Sikka left the latest call unchanged.
- [ ] Exercise touch controls on a phone or emulator. Desktop pointer input through the movement joystick worked, but this does not verify physical touch.
- [ ] Save and inspect initial-spawn and both-court-ends screenshots. In-session Chrome captures showed the initial court and a later role view, but both court ends were not established or saved as artifacts.
- [ ] Record actual browser, OS, viewport/device, startup, and performance measurements if available.

## Acceptance result

B2 browser/manual acceptance remains incomplete. The final Codex in-app browser retry loaded the game successfully and confirmed the HUD, live clock, court rendering, attacker-to-Sikka transition, Sikka movement, sprint stamina drain during movement, and reset restoration. All-eight-player visibility without overlap, a controlled Guard fixture, a successful Tag effect, physical touch, saved court-end screenshots, and startup/performance measurements remain unverified. Earlier in-app browser connectivity failures and host Chrome checks are recorded above.
