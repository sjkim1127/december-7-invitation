const reply = document.querySelector('#reply');
const choices = document.querySelector('#choices');
const response = document.querySelector('#response');
const title = document.querySelector('#response-title');
const note = document.querySelector('#response-note');
const replyText = document.querySelector('#reply-text');
const copy = document.querySelector('#copy');
const status = document.querySelector('#copy-status');
const hearts = document.querySelector('#hearts');

const replies = {
  yes: {
    title: '좋아, 그날 보자!',
    note: '답장을 복사해서 보낸 사람에게 보내줘.',
    text: '좋아! 12월 7일에 데이트하자 ♡ 시간하고 장소는 같이 정하자!',
  },
  later: {
    title: '좋아, 우리 다른 날 보자!',
    note: '가능한 날을 답장에 덧붙여 보내줘.',
    text: '12월 7일 말고 다른 날은 어때? 우리 같이 날짜 정하자!',
  },
};

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

for (const button of choices.querySelectorAll('[data-reply]')) {
  button.addEventListener('click', () => {
    const choice = button.dataset.reply;
    title.textContent = replies[choice].title;
    note.textContent = replies[choice].note;
    replyText.value = replies[choice].text;
    choices.hidden = true;
    response.hidden = false;
    title.focus({ preventScroll: true });
    if (choice === 'yes') celebrate();
  });
}

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
  choices.hidden = false;
  choices.querySelector('button').focus({ preventScroll: true });
});

reply.hidden = false;
