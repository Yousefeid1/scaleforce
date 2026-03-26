/* =============================================================
   ScaleForce — Main JavaScript
   Handles: Mobile menu · Scroll animations · Active nav ·
            Multi-step contact form · Telegram submission
   ============================================================= */

// ── Config — Replace with your real values ──────────────────
const TELEGRAM_BOT_TOKEN = '8350390838:AAEurfYHJHuhSQWwLjuOykvPTWM1njD60ng';
const TELEGRAM_CHAT_ID   = '5764585492';
// ────────────────────────────────────────────────────────────

/* ── Multi-step form state ─────────────────────────────────── */
let currentStep = 1;
const totalSteps = 4;

function updateProgress(step) {
  document.getElementById('progressFill').style.width = (step / totalSteps * 100) + '%';
  for (let i = 1; i <= totalSteps; i++) {
    const si = document.getElementById('si' + i);
    si.classList.remove('active', 'done');
    if (i === step) si.classList.add('active');
    else if (i < step) si.classList.add('done');
    if (i < totalSteps) {
      const sl = document.getElementById('sl' + i);
      sl.classList.toggle('done', i < step);
    }
  }
}

function validateStep(step) {
  let valid = true;
  if (step === 1) {
    if (!document.getElementById('name').value.trim()) { showError('f-name'); valid = false; }
    if (!document.getElementById('phone').value.trim()) { showError('f-phone'); valid = false; }
    const email = document.getElementById('email').value;
    if (!email || !email.includes('@')) { showError('f-email'); valid = false; }
  }
  if (step === 2) {
    if (!document.getElementById('bname').value.trim()) { showError('f-bname'); valid = false; }
    if (!document.getElementById('btype').value) { showError('f-btype'); valid = false; }
    if (!document.getElementById('bdesc').value.trim()) { showError('f-bdesc'); valid = false; }
  }
  if (step === 3) {
    const checks = document.querySelectorAll('#challengeGroup input:checked');
    if (checks.length === 0) { showError('f-challenge'); valid = false; }
  }
  if (step === 4) {
    const radio = document.querySelector('#serviceGroup input:checked');
    if (!radio) { showError('f-service'); valid = false; }
  }
  return valid;
}

function showError(id) {
  document.getElementById(id).classList.add('error');
}
function clearError(id) {
  document.getElementById(id).classList.remove('error');
}

function nextStep(step) {
  if (!validateStep(step)) return;
  document.getElementById('step' + step).classList.remove('active');
  currentStep = step + 1;
  document.getElementById('step' + currentStep).classList.add('active');
  updateProgress(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
  document.getElementById('step' + step).classList.remove('active');
  currentStep = step - 1;
  document.getElementById('step' + currentStep).classList.add('active');
  updateProgress(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCheck(el) {
  el.classList.toggle('selected');
  clearError('f-challenge');
}

function selectRadio(el, groupId) {
  document.querySelectorAll('#' + groupId + ' .radio-item').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  clearError('f-service');
}

function updateCount(inputId, countId) {
  const val = document.getElementById(inputId).value.length;
  document.getElementById(countId).textContent = val;
}

/* ── Form submission (sends to Telegram) ──────────────────── */
async function submitForm() {
  if (!validateStep(4)) return;

  const challenges = [...document.querySelectorAll('#challengeGroup input:checked')].map(c => c.value).join(', ');
  const service = document.querySelector('#serviceGroup input:checked')?.value || '';

  const data = {
    name:        document.getElementById('name').value,
    phone:       document.getElementById('phone').value,
    email:       document.getElementById('email').value,
    source:      document.getElementById('source').value || 'Not specified',
    bname:       document.getElementById('bname').value,
    btype:       document.getElementById('btype').value,
    bdesc:       document.getElementById('bdesc').value,
    social:      document.getElementById('social').value || 'Not provided',
    age:         document.getElementById('age').value || 'Not specified',
    challenges,
    goal:        document.getElementById('goal').value || 'Not specified',
    budget:      document.getElementById('budget').value || 'Not specified',
    service,
    notes:       document.getElementById('notes').value || 'None',
    contactTime: document.getElementById('contactTime').value || 'Any time',
    submittedAt: new Date().toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })
  };

  const message = `
🚀 *NEW CLIENT REQUEST — ScaleForce*
━━━━━━━━━━━━━━━━━━━━━

👤 *CONTACT INFO*
• Name: ${data.name}
• WhatsApp: ${data.phone}
• Email: ${data.email}
• Source: ${data.source}

🏢 *BUSINESS INFO*
• Business: ${data.bname}
• Type: ${data.btype}
• Age: ${data.age}
• Description: ${data.bdesc}
• Social/Website: ${data.social}

⚡ *CHALLENGES*
${data.challenges}

🎯 *GOALS & BUDGET*
• Goal: ${data.goal}
• Budget: ${data.budget}

💼 *SERVICE REQUESTED*
${data.service}

📝 *NOTES*
${data.notes}

🕐 *Best contact time:* ${data.contactTime}
📅 *Submitted:* ${data.submittedAt}

━━━━━━━━━━━━━━━━━━━━━
Reply within 24 hours ⏰
  `.trim();

  // Show loading state while sending
  document.getElementById('step4').classList.remove('active');
  document.getElementById('loadingScreen').style.display = 'block';

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await res.json();
    document.getElementById('loadingScreen').style.display = 'none';

    if (result.ok) {
      document.getElementById('successSummary').innerHTML = `
        <strong>Name:</strong> ${data.name}<br>
        <strong>Business:</strong> ${data.bname}<br>
        <strong>Service:</strong> ${data.service}<br>
        <strong>WhatsApp:</strong> ${data.phone}<br>
        <strong>Submitted:</strong> ${data.submittedAt}
      `;
      document.getElementById('successScreen').style.display = 'block';
      document.getElementById('stepsBar').style.display = 'none';
      document.getElementById('progressFill').parentElement.style.display = 'none';
    } else {
      throw new Error('Telegram API error');
    }
  } catch (err) {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('step4').classList.add('active');
    alert('Something went wrong. Please try again or contact us directly on WhatsApp.');
    console.error(err);
  }
}

/* ── Mobile menu ──────────────────────────────────────────── */
function toggleMenu() {
  const m = document.getElementById('mobileMenu');
  m.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ── Scroll-reveal animations (IntersectionObserver) ─────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ── Navbar shadow on scroll ──────────────────────────────── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 4px 24px rgba(11,61,145,0.12)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

/* ── Active section highlighting in nav ──────────────────── */
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.getAttribute('id');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.style.color      = a.getAttribute('href') === '#' + current ? '#1A56C4' : '';
    a.style.fontWeight = a.getAttribute('href') === '#' + current ? '600'     : '';
  });
});
