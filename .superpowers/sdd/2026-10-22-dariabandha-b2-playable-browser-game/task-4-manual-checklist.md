# B2 Task 4 Manual Browser Checklist

Status: partially verified in Chrome; B2 manual acceptance remains incomplete. Do not treat unchecked items as passed.

## Environment and attempt

- Browser: Google Chrome on the host Windows device (browser version not recorded).
- Host OS: Windows.
- Viewport resolution: not recorded; the captured Chrome window was 656 × 720 pixels and the game page was scrolled to the scene.
- Server: Vite 6.4.5 reported ready at `http://127.0.0.1:4173/` with host access enabled.
- Browser result: `ERR_CONNECTION_TIMED_OUT` (“127.0.0.1 took too long to respond”). Retried after starting the local server outside the sandbox; same result.
- Follow-up attempt: Vite was bound to `0.0.0.0:4173` and reported the machine address `http://192.168.1.100:4173/`; opening that URL in the same in-app browser returned `net::ERR_ABORTED` before the game loaded.
- Chrome follow-up: after starting Vite with host access, Chrome loaded `http://127.0.0.1:4173/`. Its accessibility tree showed the game page, HUD, and controls; the captured scene showed the rendered court, line markings, role markers, and player figures. The HUD reported Sikka / Team 1, playing, 0–0, half 1, stamina 100%, and the latest call. Clock was observed counting down. Reset could not be exercised because the Chrome window became minimized to the automation target; startup and performance timings were not measured.
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
- [ ] Click Reset match after changing the fixture state; confirm the same initial seed/setup/controlled seat returns and the toss is unchanged.
- [ ] Exercise keyboard attacker, guard, and Sikka fixtures in the browser.
- [ ] Exercise touch controls on a phone or emulator.
- [ ] Capture initial-spawn and both-court-ends screenshots; inspect court/line visibility and layout.
- [ ] Record actual browser, OS, viewport/device, startup, and performance measurements if available.

## Acceptance result

B2 browser/manual acceptance remains incomplete. Chrome on the host device loaded the local game and confirmed the page/HUD and a rendered court scene. Reset behavior, visual confirmation of all eight players, keyboard fixtures, touch controls, court-end screenshots, and performance measurements remain unverified. The earlier in-app browser connectivity failures and the Chrome follow-up are recorded above.
