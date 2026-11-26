const reply = document.querySelector('#reply');
const choices = document.querySelector('#choices');
const accept = document.querySelector('#accept');
const decline = document.querySelector('#decline');
const declineFace = document.querySelector('.decline-face');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let dodgeAnimation;
let hoverReadyAt = 0;
let layer = 0;
let shell;
let acceptPulse;

const layers = [
  { label: 'ㄴㄴ', size: 1 },
  { label: '싫어', size: .89 },
  { label: '진짜 싫어', size: .79 },
];
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

function setLayer(index) {
  layer = index;
  declineFace.textContent = layers[layer].label;
  declineFace.dataset.layer = layer;
  decline.style.setProperty('--layer-size', layers[layer].size);
}

function animateShell(from, frames, duration) {
  shell?.remove();
  const outgoing = declineFace.cloneNode(true);
  outgoing.classList.add('decline-shell');
  outgoing.setAttribute('aria-hidden', 'true');
  Object.assign(outgoing.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  });
  document.body.append(outgoing);
  shell = outgoing;
  outgoing.animate(frames, { duration, easing: 'cubic-bezier(.2, .65, .28, 1)', fill: 'forwards' }).onfinish = () => outgoing.remove();
}

function mergeIntoAccept(from, yes) {
  dodgeAnimation?.cancel();
  if (!reducedMotion.matches) {
    const x = yes.left + (yes.width - from.width) / 2 - from.left;
    const y = yes.top + (yes.height - from.height) / 2 - from.top;
    animateShell(from, [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${x * .55}px, ${y * .55 - 24}px) rotate(-9deg) scale(.82)`, offset: .55 },
      { transform: `translate(${x}px, ${y}px) scale(.2)`, opacity: 0 },
    ], 420);
    acceptPulse = accept.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.14)', offset: .45 },
      { transform: 'scale(1)' },
    ], { delay: 330, duration: 250, easing: 'ease-out' });
  }
  decline.hidden = true;
  accept.focus({ preventScroll: true });
}

function dodge(event, current = decline.getBoundingClientRect()) {
  const slot = escapeSlot.getBoundingClientRect();
  const yes = accept.getBoundingClientRect();
  const from = declineFace.getBoundingClientRect();
  const next = layers[layer + 1];
  if (!next) {
    mergeIntoAccept(from, yes);
    return;
  }
  const nextWidth = slot.width * next.size;
  const nextHeight = slot.height * next.size;
  const viewport = window.visualViewport;
  const width = viewport?.width ?? document.documentElement.clientWidth;
  const height = viewport?.height ?? window.innerHeight;
  const margin = Math.min(16, width * .04, height * .04);
  const left = (viewport?.offsetLeft ?? 0) + margin;
  const top = (viewport?.offsetTop ?? 0) + Math.min(64, height * .12);
  const right = Math.max(left, left + width - nextWidth - margin * 2);
  const bottom = Math.max(top, (viewport?.offsetTop ?? 0) + height - nextHeight - margin);
  const centerX = current.left + current.width / 2;
  const centerY = current.top + current.height / 2;
  const away = Math.atan2(centerY - event.clientY, centerX - event.clientX);
  const direction = away + (Math.random() - .5) * .9;
  const travel = clamp(Math.min(width, height) * .28, 92, 210) * (.82 + Math.random() * .44);
  const turns = [0, .55, -.55, 1.05, -1.05, 1.65, -1.65, 2.3, -2.3, Math.PI];
  const nearby = turns.map((turn) => [
    clamp(centerX - nextWidth / 2 + Math.cos(direction + turn) * travel, left, right),
    clamp(centerY - nextHeight / 2 + Math.sin(direction + turn) * travel, top, bottom),
  ]);
  const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
  const destination = [...nearby, ...corners].find(([x, y]) => {
    const coversYes = x < yes.right + 8 && x + nextWidth > yes.left - 8
      && y < yes.bottom + 8 && y + nextHeight > yes.top - 8;
    const nearPointer = event.clientX > x - 30 && event.clientX < x + nextWidth + 30
      && event.clientY > y - 30 && event.clientY < y + nextHeight + 30;
    return !coversYes && !nearPointer && Math.hypot(x - current.left, y - current.top) > 55;
  });
  if (!destination) return;

  const [x, y] = destination;
  const startX = from.left + (from.width - nextWidth) / 2;
  const startY = from.top + (from.height - nextHeight) / 2;
  const dx = x - startX;
  const dy = y - startY;
  dodgeAnimation?.cancel();
  if (!reducedMotion.matches) {
    const tilt = Math.sign(dx) * -18;
    animateShell(from, [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${-dx * .13}px, ${-dy * .13}px) rotate(${tilt}deg) scale(1.18)`, opacity: 0 },
    ], 300);
  }
  setLayer(layer + 1);
  // Move the hit area first while the smaller label emerges from the shell.
  decline.style.translate = `${x - slot.left}px ${y - slot.top}px`;
  hoverReadyAt = performance.now() + 110;
  if (reducedMotion.matches) return;

  const distance = Math.hypot(dx, dy);
  const bend = Math.random() < .5 ? -.38 : .38;
  const controlX = clamp(startX + dx * .5 - dy * bend, left, right);
  const controlY = clamp(startY + dy * .5 + dx * bend, (viewport?.offsetTop ?? 0) + margin, bottom);
  const frames = Array.from({ length: 9 }, (_, index) => {
    const t = index / 8;
    const s = 1 - t;
    const frameX = s * s * startX + 2 * s * t * controlX + t * t * x;
    const frameY = s * s * startY + 2 * s * t * controlY + t * t * y;
    const tilt = Math.sign(dx) * Math.sin(Math.PI * t) * 7;
    return { transform: `translate(${frameX - x}px, ${frameY - y}px) rotate(${tilt}deg) scale(${.72 + .28 * Math.min(1, t * 2)})` };
  });
  const duration = clamp(320 + distance * .6, 380, 560);
  hoverReadyAt = performance.now() + duration * .8;
  dodgeAnimation = declineFace.animate(frames, {
    duration,
    easing: 'cubic-bezier(.18, .7, .25, 1)',
  });
}

function recenterDecline() {
  dodgeAnimation?.cancel();
  acceptPulse?.cancel();
  shell?.remove();
  hoverReadyAt = 0;
  decline.style.translate = '';
}

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || choices.hidden || decline.hidden || performance.now() < hoverReadyAt) return;
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
window.addEventListener('resize', recenterDecline);
window.addEventListener('scroll', recenterDecline, { passive: true });
window.visualViewport?.addEventListener('resize', recenterDecline);
window.visualViewport?.addEventListener('scroll', recenterDecline, { passive: true });

accept.addEventListener('click', () => {
  recenterDecline();
  choices.hidden = true;
  response.hidden = false;
  addToCalendar.focus({ preventScroll: true });
  celebrate();
});

document.querySelector('#reset').addEventListener('click', () => {
  response.hidden = true;
  setLayer(0);
  decline.hidden = false;
  choices.hidden = false;
  accept.focus({ preventScroll: true });
});

reply.hidden = false;
