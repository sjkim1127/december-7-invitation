const reply = document.querySelector('#reply');
const choices = document.querySelector('#choices');
const accept = document.querySelector('#accept');
const decline = document.querySelector('#decline');
const declineFace = document.querySelector('.decline-face');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let dodgeAnimation;
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

function dodge(event) {
  const pointer = { x: event.clientX, y: event.clientY };
  const slot = escapeSlot.getBoundingClientRect();
  const current = decline.getBoundingClientRect();
  const yes = accept.getBoundingClientRect();
  const viewport = window.visualViewport;
  const width = viewport?.width ?? document.documentElement.clientWidth;
  const height = viewport?.height ?? window.innerHeight;
  const margin = Math.min(16, width * .04, height * .04);
  const left = (viewport?.offsetLeft ?? 0) + margin;
  const top = (viewport?.offsetTop ?? 0) + Math.min(72, height * .13);
  const right = Math.max(left, left + width - slot.width - margin * 2);
  const bottom = Math.max(top, (viewport?.offsetTop ?? 0) + height - slot.height - margin);
  const middle = (left + right) / 2;
  const center = (top + bottom) / 2;
  const candidates = [
    [left, top], [right, top],
    [left, bottom], [right, bottom],
    [middle, top], [middle, bottom],
    [left, center], [right, center],
  ];

  const distance = ([x, y]) => Math.hypot(x + slot.width / 2 - pointer.x, y + slot.height / 2 - pointer.y);
  const openSpots = candidates.filter(([x, y]) => {
    const coversYes = x < yes.right + 8 && x + slot.width > yes.left - 8
      && y < yes.bottom + 8 && y + slot.height > yes.top - 8;
    const stillHere = Math.hypot(x - current.left, y - current.top) < slot.width;
    return !coversYes && !stillHere;
  });
  const [x, y] = (openSpots.length ? openSpots : candidates)
    .sort((first, second) => distance(second) - distance(first))[0];

  const from = declineFace.getBoundingClientRect();
  dodgeAnimation?.cancel();
  // Move the hit target first so the pointer cannot catch the moving label.
  decline.style.translate = `${x - slot.left}px ${y - slot.top}px`;
  decline.dataset.dodging = '';
  if (reducedMotion.matches) return;

  const offsetX = from.left - x;
  const offsetY = from.top - y;
  const tilt = offsetX > 0 ? -10 : 10;
  const lift = Math.min(24, Math.max(from.top, y) - (viewport?.offsetTop ?? 0));
  dodgeAnimation = declineFace.animate([
    { transform: `translate(${offsetX}px, ${offsetY}px)` },
    { transform: `translate(${offsetX * .48}px, ${offsetY * .48 - lift}px) rotate(${tilt}deg) scale(1.06)`, offset: .52 },
    { transform: `rotate(${-tilt / 3}deg) scale(1.02)`, offset: .87 },
    { transform: 'none' },
  ], {
    duration: Math.min(470, 285 + Math.hypot(offsetX, offsetY) * .26),
    easing: 'cubic-bezier(.22, .7, .26, 1)',
  });
}

function resetDecline() {
  dodgeAnimation?.cancel();
  decline.style.translate = '';
  delete decline.dataset.dodging;
}

decline.addEventListener('pointerenter', (event) => {
  if (event.pointerType !== 'touch') dodge(event);
});
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
