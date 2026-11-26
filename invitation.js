const reply = document.querySelector('#reply');
const choices = document.querySelector('#choices');
const accept = document.querySelector('#accept');
const decline = document.querySelector('#decline');
const declineFace = document.querySelector('.decline-face');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let dodgeAnimation;
let hoverReadyAt = 0;
const escapeSlot = document.querySelector('.escape-slot');
const response = document.querySelector('#response');
const addToCalendar = document.querySelector('#add-to-calendar');
const hearts = document.querySelector('#hearts');

function celebrate() {
  if (reducedMotion.matches) return;
  for (let index = 0; index < 16; index += 1) {
    const heart = document.createElement('span');
    heart.textContent = '♥';
    heart.style.setProperty('--left', `${5 + Math.random() * 90}%`);
    heart.style.setProperty('--drift', `${Math.random() * 80 - 40}px`);
    heart.style.setProperty('--delay', `${index * 28}ms`);
    heart.style.setProperty('--size', `${1 + Math.random() * 1.1}rem`);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
    hearts.append(heart);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dodge(event, current = decline.getBoundingClientRect()) {
  const slot = escapeSlot.getBoundingClientRect();
  const yes = accept.getBoundingClientRect();
  const viewport = window.visualViewport;
  const width = viewport?.width ?? document.documentElement.clientWidth;
  const height = viewport?.height ?? window.innerHeight;
  const margin = Math.min(16, width * .04, height * .04);
  const left = (viewport?.offsetLeft ?? 0) + margin;
  const top = (viewport?.offsetTop ?? 0) + Math.min(64, height * .12);
  const right = Math.max(left, left + width - slot.width - margin * 2);
  const bottom = Math.max(top, (viewport?.offsetTop ?? 0) + height - slot.height - margin);
  const centerX = current.left + slot.width / 2;
  const centerY = current.top + slot.height / 2;
  const away = Math.atan2(centerY - event.clientY, centerX - event.clientX);
  const direction = away + (Math.random() - .5) * .9;
  const travel = clamp(Math.min(width, height) * .28, 92, 210) * (.82 + Math.random() * .44);
  const turns = [0, .55, -.55, 1.05, -1.05, 1.65, -1.65, 2.3, -2.3, Math.PI];
  const nearby = turns.map((turn) => [
    clamp(current.left + Math.cos(direction + turn) * travel, left, right),
    clamp(current.top + Math.sin(direction + turn) * travel, top, bottom),
  ]);
  const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
  const destination = [...nearby, ...corners].find(([x, y]) => {
    const coversYes = x < yes.right + 8 && x + slot.width > yes.left - 8
      && y < yes.bottom + 8 && y + slot.height > yes.top - 8;
    const nearPointer = event.clientX > x - 30 && event.clientX < x + slot.width + 30
      && event.clientY > y - 30 && event.clientY < y + slot.height + 30;
    return !coversYes && !nearPointer && Math.hypot(x - current.left, y - current.top) > 55;
  });
  if (!destination) return;

  const [x, y] = destination;
  const from = declineFace.getBoundingClientRect();
  dodgeAnimation?.cancel();
  // The interactive area moves immediately while the label follows the curve.
  decline.style.translate = `${x - slot.left}px ${y - slot.top}px`;
  decline.dataset.dodging = '';
  hoverReadyAt = performance.now() + 110;
  if (reducedMotion.matches) return;

  const dx = x - from.left;
  const dy = y - from.top;
  const distance = Math.hypot(dx, dy);
  const bend = Math.random() < .5 ? -.38 : .38;
  const controlX = clamp(from.left + dx * .5 - dy * bend, left, right);
  const controlY = clamp(from.top + dy * .5 + dx * bend, (viewport?.offsetTop ?? 0) + margin, bottom);
  const frames = Array.from({ length: 9 }, (_, index) => {
    const t = index / 8;
    const s = 1 - t;
    const frameX = s * s * from.left + 2 * s * t * controlX + t * t * x;
    const frameY = s * s * from.top + 2 * s * t * controlY + t * t * y;
    const tilt = Math.sign(dx) * Math.sin(Math.PI * t) * 7;
    return { transform: `translate(${frameX - x}px, ${frameY - y}px) rotate(${tilt}deg)` };
  });
  const duration = clamp(320 + distance * .6, 380, 560);
  hoverReadyAt = performance.now() + duration * .8;
  dodgeAnimation = declineFace.animate(frames, {
    duration,
    easing: 'cubic-bezier(.18, .7, .25, 1)',
  });
}

function resetDecline() {
  dodgeAnimation?.cancel();
  hoverReadyAt = 0;
  decline.style.translate = '';
  delete decline.dataset.dodging;
}

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || choices.hidden || performance.now() < hoverReadyAt) return;
  const current = decline.getBoundingClientRect();
  const proximity = reducedMotion.matches ? 0 : 25;
  const near = event.clientX >= current.left - proximity && event.clientX <= current.right + proximity
    && event.clientY >= current.top - proximity && event.clientY <= current.bottom + proximity;
  if (near) dodge(event, current);
}, { passive: true });
decline.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  dodge(event);
});
decline.addEventListener('click', (event) => event.preventDefault());
decline.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
});
window.addEventListener('resize', resetDecline);
window.addEventListener('scroll', resetDecline, { passive: true });
window.visualViewport?.addEventListener('resize', resetDecline);
window.visualViewport?.addEventListener('scroll', resetDecline, { passive: true });

accept.addEventListener('click', () => {
  choices.hidden = true;
  response.hidden = false;
  addToCalendar.focus({ preventScroll: true });
  celebrate();
});

document.querySelector('#reset').addEventListener('click', () => {
  response.hidden = true;
  resetDecline();
  choices.hidden = false;
  accept.focus({ preventScroll: true });
});

reply.hidden = false;
