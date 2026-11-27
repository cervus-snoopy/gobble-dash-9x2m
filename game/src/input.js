// Gobble Dash — keyboard and mouse input.
// One clear job: turn raw DOM events into game intents (jump, duck, hide,
// pause, confirm) and report clicks as canvas coordinates.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let pointer = { x: 0, y: 0, clicked: false, down: false };

  function keyCode(e) {
    return e.code;
  }

  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onPointerDown(e) {
    const p = canvasPoint(e.clientX, e.clientY);
    pointer = { x: p.x, y: p.y, clicked: true, down: true };
  }

  function onPointerUp() {
    pointer.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    // Held-state queries.
    jumpHeld() {
      return keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW');
    },
    duckHeld() {
      return keys.has('ArrowDown') || keys.has('KeyS');
    },
    burstHeld() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    // Edge-triggered queries: true once per physical press.
    jumpPressed() {
      return pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW');
    },
    confirmPressed() {
      return pressed.has('Enter') || pressed.has('Space') || pointer.clicked;
    },
    pausePressed() {
      return pressed.has('KeyP') || pressed.has('Escape');
    },
    mutePressed() {
      return pressed.has('KeyM');
    },
    hidePressed() {
      return pressed.has('ArrowDown') || pressed.has('KeyS');
    },
    pointer() {
      return pointer;
    },
    // Call at the end of every frame: edges live for one frame only.
    endFrame() {
      pressed.clear();
      pointer.clicked = false;
    },
  };
}
