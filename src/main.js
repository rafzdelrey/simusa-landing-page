// Navbar: tampilan berubah saat scroll + menu mobile
const nav = document.querySelector('.nav'), panel = document.querySelector('.panel'), burger = document.querySelector('.burger');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
onScroll(); addEventListener('scroll', onScroll, { passive: true });
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', panel.classList.toggle('open')));
panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { panel.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// Gambar belum ada -> placeholder (tidak ada gambar rusak)
document.querySelectorAll('.shot img:not(.scr)').forEach(img => {
  const fail = () => img.closest('.shot').classList.add('empty');
  img.addEventListener('error', fail);
  if (img.complete && !img.naturalWidth) fail();
});
// Logo yang belum ada dihapus (tanpa ikon gambar rusak)
document.querySelectorAll('.logo img, .fl img').forEach(img => {
  const drop = () => { if (img.closest('.logo')) { const m = document.createElement('b'); m.className = 'mono'; m.textContent = 'S'; img.replaceWith(m); } else img.remove(); };
  img.addEventListener('error', drop);
  if (img.complete && !img.naturalWidth) drop();
});

// Mockup perangkat: deteksi layar transparan, taruh screenshot di dalamnya, dan pangkas ruang kosong di sekitar iPhone
// (file asli tidak diubah). Berjalan di localhost/hosting; jika dibuka langsung dari file:// dipakai nilai cadangan di CSS.
const pixels = img => {
  const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, 500 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
  return { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
};
const solid = (p, x, y) => p.d[(y * p.w + x) * 4 + 3] > 20;
const findScreen = p => { // area transparan di tengah bingkai, dalam pecahan 0-1
  const cx = p.w >> 1, cy = p.h >> 1;
  if (solid(p, cx, cy)) return null;
  let l = cx, r = cx;
  while (l > 0 && !solid(p, l - 1, cy)) l--;
  while (r < p.w - 1 && !solid(p, r + 1, cy)) r++;
  if (l === 0 || r === p.w - 1) return null;
  const x = Math.round(l + (r - l) * .2); let t = cy, b = cy; // kolom agak ke samping agar tidak kena poni/notch
  while (t > 0 && !solid(p, x, t - 1)) t--;
  while (b < p.h - 1 && !solid(p, x, b + 1)) b++;
  if (t === 0 || b === p.h - 1) return null;
  return { l: (l - 1) / p.w, r: (r + 2) / p.w, t: (t - 1) / p.h, b: (b + 2) / p.h };
};
const placeScreen = (scr, s, o) => {
  o = o || { l: 0, t: 0, r: 1, b: 1 };
  const W = o.r - o.l, H = o.b - o.t;
  Object.assign(scr.style, { left: (s.l - o.l) / W * 100 + '%', top: (s.t - o.t) / H * 100 + '%', width: (s.r - s.l) / W * 100 + '%', height: (s.b - s.t) / H * 100 + '%' });
};
document.querySelectorAll('.device .scr').forEach(s => s.addEventListener('error', () => s.remove()));
document.querySelectorAll('.device .shot').forEach(box => {
  const frame = box.querySelector('.frame'), scr = box.querySelector('.scr'), isPhone = box.classList.contains('phone');
  if (!frame) return;
  const done = () => box.classList.add('ready');
  const run = () => {
    try {
      const p = pixels(frame), s = findScreen(p); let o = null;
      if (isPhone) {
        let l = p.w, t = p.h, r = 0, b = 0;
        for (let y = 0; y < p.h; y++) for (let i = 0; i < p.w; i++) if (solid(p, i, y)) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
        if (r <= l || b <= t) throw new Error('kosong');
        o = { l: l / p.w, r: (r + 1) / p.w, t: t / p.h, b: (b + 1) / p.h };
        const w = frame.naturalWidth, h = frame.naturalHeight;
        box.style.aspectRatio = ((o.r - o.l) * w) + ' / ' + ((o.b - o.t) * h);
        Object.assign(frame.style, { position: 'absolute', maxWidth: 'none', width: 100 / (o.r - o.l) + '%', left: -o.l / (o.r - o.l) * 100 + '%', top: -o.t / (o.b - o.t) * 100 + '%' });
      }
      if (s && scr) placeScreen(scr, s, o);
    } catch (e) { if (isPhone) box.style.width = '34%'; }
    done();
  };
  if (frame.complete && frame.naturalWidth) run(); else frame.addEventListener('load', run);
  frame.addEventListener('error', done);
});

// Penanda halaman aktif di navbar (kaca bening yang bergeser)
const links = [...panel.querySelectorAll('a:not(.login)')], ind = document.querySelector('.ind');
const secs = links.map(a => document.querySelector(a.getAttribute('href')));
let cur = -1;
const place = i => {
  const a = links[i];
  if (!a || innerWidth <= 900) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
};
const spy = () => {
  let i = 0; secs.forEach((s, k) => { if (s.getBoundingClientRect().top <= innerHeight * .35) i = k; });
  if (i !== cur) { cur = i; links.forEach((a, k) => a.classList.toggle('active', k === i)); place(i); }
};
links.forEach((a, k) => { a.addEventListener('mouseenter', () => place(k)); a.addEventListener('mouseleave', () => place(cur)); });
addEventListener('scroll', spy, { passive: true }); addEventListener('resize', () => place(cur)); spy();
if (document.fonts) document.fonts.ready.then(() => place(cur));