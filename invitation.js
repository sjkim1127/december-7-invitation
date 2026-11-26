const reply = document.querySelector('#reply');
const choices = document.querySelector('#choices');
const accept = document.querySelector('#accept');
const decline = document.querySelector('#decline');
const escapeSlot = document.querySelector('.escape-slot');
const response = document.querySelector('#response');
const title = document.querySelector('#response-title');
const note = document.querySelector('#response-note');
const replyText = document.querySelector('#reply-text');
const copy = document.querySelector('#copy');
const status = document.querySelector('#copy-status');
const hearts = document.querySelector('#hearts');

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
  const margin = 16;
  const right = Math.max(margin, document.documentElement.clientWidth - slot.width - margin);
  const bottom = Math.max(margin, window.innerHeight - slot.height - margin);
  const middle = (margin + right) / 2;
  const center = (margin + bottom) / 2;
  const candidates = [
    [margin, margin], [right, margin],
    [margin, bottom], [right, bottom],
    [middle, margin], [middle, bottom],
    [margin, center], [right, center],
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

  decline.style.translate = `${x - slot.left}px ${y - slot.top}px`;
}

function resetDecline() {
  decline.style.translate = '';
}

decline.addEventListener('pointerenter', (event) => {
  if (event.pointerType !== 'touch') dodge(event);
});
for (const eventName of ['pointerdown', 'click']) {
  decline.addEventListener(eventName, (event) => {
    event.preventDefault();
    dodge(event);
  });
}
decline.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
});
window.addEventListener('resize', resetDecline);
window.addEventListener('scroll', resetDecline, { passive: true });

accept.addEventListener('click', () => {
  title.textContent = '좋아, 그날 보자!';
  note.textContent = '답장을 복사해서 보낸 사람에게 보내줘.';
  replyText.value = '오키! 12월 7일에 데이트하자 ♡ 시간하고 장소는 같이 정하자!';
  choices.hidden = true;
  response.hidden = false;
  title.focus({ preventScroll: true });
  celebrate();
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(replyText.value);
    status.textContent = '복사했어! 메시지에 붙여넣으면 돼.';
  } catch {
    replyText.hidden = false;
    replyText.focus();
    replyText.select();
    status.textContent = '선택한 문구를 직접 복사해 줘.';
  }
});

document.querySelector('#reset').addEventListener('click', () => {
  status.textContent = '';
  replyText.hidden = true;
  response.hidden = true;
  resetDecline();
  choices.hidden = false;
  accept.focus({ preventScroll: true });
});

reply.hidden = false;
