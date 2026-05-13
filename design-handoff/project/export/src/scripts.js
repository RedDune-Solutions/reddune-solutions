// sparks
const sparksEl = document.getElementById('sparks');
if (sparksEl) {
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = (70 + Math.random() * 20) + '%';
    s.style.animationDuration = (10 + Math.random() * 12) + 's';
    s.style.animationDelay = (-Math.random() * 14) + 's';
    s.style.transform = `scale(${0.5 + Math.random() * 1.5})`;
    sparksEl.appendChild(s);
  }
}
// reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
// counters
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, to = +el.dataset.to, dur = 1800, start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(to * eased).toLocaleString('pt-PT');
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  cio.unobserve(el);
}), { threshold: 0.4 });
document.querySelectorAll('.count').forEach(el => cio.observe(el));
// parallax dunes
const blobs = document.querySelectorAll('.dune-blob');
if (blobs.length) document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth - 0.5);
  blobs.forEach((b, i) => { b.style.transform = `translateX(${x * (i + 1) * 6}px)`; });
});
// mobile nav toggle (simple)
const navToggle = document.querySelector('[data-nav-toggle]');
if (navToggle) navToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
