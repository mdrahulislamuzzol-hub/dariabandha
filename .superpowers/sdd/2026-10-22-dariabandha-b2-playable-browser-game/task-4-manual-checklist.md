# B2 Task 4 Manual Browser Checklist

Status: attempted; blocked before the game page loaded. Do not treat the manual acceptance items below as passed.

## Environment and attempt

- Browser: Codex in-app browser.
- Host OS: Windows.
- Viewport resolution: not recorded because navigation timed out before the app loaded.
- Server: Vite 6.4.5 reported ready at `http://127.0.0.1:4173/`.
- Browser result: `ERR_CONNECTION_TIMED_OUT` (“127.0.0.1 took too long to respond”). Retried after starting the local server outside the sandbox; same result.
- Startup/frame-time/memory: not measured. WebGL and device/touch capability were not reached.

## Checklist

- [x] Start the local Vite server and confirm it reports ready.
- [x] Attempt to open the local URL in the available in-app browser.
- [x] Retry with the server started outside the sandbox.
- [ ] Confirm the game DOM and HUD are visible in a browser.
- [ ] Confirm WebGL scene starts and the 4v4 court/all eight players render.
- [ ] Verify HUD role/team, phase, score, clock, stamina, and latest call in the live page.
- [ ] Click Reset match after changing the fixture state; confirm the same initial seed/setup/controlled seat returns and the toss is unchanged.
- [ ] Exercise keyboard attacker, guard, and Sikka fixtures in the browser.
- [ ] Exercise touch controls on a phone or emulator.
- [ ] Capture initial-spawn and both-court-ends screenshots; inspect court/line visibility and layout.
- [ ] Record actual browser, OS, viewport/device, startup, and performance measurements if available.

## Acceptance result

B2 browser/manual acceptance remains incomplete. The in-app browser could not reach the host's local loopback server even when the server process was started outside the sandbox. No browser interaction, WebGL render, keyboard/touch behavior, or screenshot is claimed as verified.
