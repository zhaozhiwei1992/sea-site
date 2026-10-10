/**
 * 工具交互逻辑验证（jsdom 无头跑真实 app.js）
 * 用法: npm i jsdom --no-save 后 node scripts/verify.mjs（每次加/改工具后跑一遍）
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src', 'tools');

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`);
  ok ? pass++ : fail++;
};

function load(slug) {
  const html = readFileSync(join(DIST, 'tools', slug, 'index.html'), 'utf8');
  const js = readFileSync(join(SRC, slug, 'app.js'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: `http://localhost/tools/${slug}/`, pretendToBeVisual: true });
  const { window } = dom;
  window.alert = () => {};
  window.eval(js);
  return window;
}
const input = (w, sel, val) => {
  const el = w.document.querySelector(sel);
  if (!el) throw new Error(`input not found: ${sel}`);
  el.value = val;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
};
const click = (w, sel) => {
  const el = w.document.querySelector(sel);
  if (!el) throw new Error(`element not found: ${sel}`);
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
};

/* percentage calculator */
{
  const w = load('percentage-calculator');
  input(w, '#pc-x', '20');
  input(w, '#pc-y', '50');
  check('pct: 20% of 50 → "10"', w.document.querySelector('#pc-result').textContent.includes('10'));
  click(w, '[data-mode="what"]');
  input(w, '#pc-x', '10');
  input(w, '#pc-y', '50');
  check('pct: 10 is 20% of 50', w.document.querySelector('#pc-result').textContent.includes('20%'));
  click(w, '[data-mode="change"]');
  input(w, '#pc-x', '80');
  input(w, '#pc-y', '100');
  check('pct: 80→100 → "25% increase"', w.document.querySelector('#pc-result').textContent.includes('25% increase'));
}

/* age calculator */
{
  const w = load('age-calculator');
  input(w, '#ac-dob', '1990-01-01');
  input(w, '#ac-asof', '2026-10-14');
  click(w, '#ac-calc');
  check('age: exact years/months/days', w.document.querySelector('#ac-age').textContent.includes('36 years, 9 months, and 13 days'));
  check('age: next birthday days > 0', Number(w.document.querySelector('#ac-next-in').textContent) > 0);
  input(w, '#ac-dob', '2000-02-29');
  input(w, '#ac-asof', '2026-02-28');
  click(w, '#ac-calc');
  check('age: leap 2/29 birthday handled', w.document.querySelector('#ac-age').textContent.includes('25 years'));
}

/* temperature converter */
{
  const w = load('temperature-converter');
  input(w, '#tc-celsius', '100');
  check('temp: 100°C → 212°F', w.document.querySelector('#tc-fahrenheit').value === '212');
  check('temp: 100°C → 373.15K', w.document.querySelector('#tc-kelvin').value === '373.15');
  input(w, '#tc-fahrenheit', '32');
  check('temp: 32°F → 0°C', w.document.querySelector('#tc-celsius').value === '0');
  input(w, '#tc-kelvin', '0');
  check('temp: 0K → -273.15°C / -459.67°F', w.document.querySelector('#tc-celsius').value === '-273.15' && w.document.querySelector('#tc-fahrenheit').value === '-459.67');
  input(w, '#tc-celsius', '');
  check('temp: clear celsius clears others', w.document.querySelector('#tc-fahrenheit').value === '' && w.document.querySelector('#tc-kelvin').value === '');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);