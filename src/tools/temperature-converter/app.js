(function () {
  const root = document.getElementById('temp-calc');
  if (!root) return;

  const c = root.querySelector('#tc-celsius');
  const f = root.querySelector('#tc-fahrenheit');
  const k = root.querySelector('#tc-kelvin');
  let busy = false;

  function fmt(v) {
    return String(parseFloat(v.toFixed(2)));
  }

  function toCelsius(fromEl, value) {
    if (fromEl === c) return value;
    if (fromEl === f) return (value - 32) * 5 / 9;
    return value - 273.15; // kelvin
  }

  function update(fromEl, raw) {
    if (busy) return;
    busy = true;
    try {
      const value = raw.trim();
      if (value === '') {
        [c, f, k].forEach((el) => { if (el !== fromEl) el.value = ''; });
        k.setCustomValidity('');
        return;
      }
      const v = parseFloat(value);
      if (isNaN(v)) return;

      if (fromEl === k && v < 0) {
        k.setCustomValidity('Kelvin cannot be negative.');
        k.reportValidity();
        return;
      }
      k.setCustomValidity('');

      const celsius = toCelsius(fromEl, v);
      if (fromEl !== c) c.value = fmt(celsius);
      if (fromEl !== f) f.value = fmt(celsius * 9 / 5 + 32);
      if (fromEl !== k) k.value = fmt(celsius + 273.15);
    } finally {
      busy = false;
    }
  }

  c.addEventListener('input', () => update(c, c.value));
  f.addEventListener('input', () => update(f, f.value));
  k.addEventListener('input', () => update(k, k.value));
})();