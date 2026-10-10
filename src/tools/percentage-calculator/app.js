(function () {
  const root = document.getElementById('percentage-calc');
  if (!root) return;

  const modeBtns = Array.from(root.querySelectorAll('.mode-btn'));
  const xInput = root.querySelector('#pc-x');
  const yInput = root.querySelector('#pc-y');
  const result = root.querySelector('#pc-result');
  let mode = 'of';

  function fmt(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    return String(parseFloat(n.toFixed(6)));
  }

  function render() {
    const xRaw = xInput.value.trim();
    const yRaw = yInput.value.trim();
    const both = xRaw !== '' && yRaw !== '';

    if (!both) {
      result.innerHTML = '<p class="result-line">Enter both numbers to see the result.</p>';
      return;
    }

    const x = parseFloat(xRaw);
    const y = parseFloat(yRaw);

    if (mode === 'of') {
      const v = (x / 100) * y;
      result.innerHTML = '<p class="result-line">' + fmt(x) + '% of ' + fmt(y) + ' is <strong>' + fmt(v) + '</strong></p>';
    } else if (mode === 'what') {
      if (y === 0) {
        result.innerHTML = '<p class="result-line">Y cannot be zero.</p>';
        return;
      }
      const v = (x / y) * 100;
      result.innerHTML = '<p class="result-line">' + fmt(x) + ' is <strong>' + fmt(v) + '%</strong> of ' + fmt(y) + '</p>';
    } else {
      if (x === 0) {
        result.innerHTML = '<p class="result-line">Starting value (X) cannot be zero.</p>';
        return;
      }
      const v = (y - x) / x * 100;
      const dir = v >= 0 ? 'increase' : 'decrease';
      result.innerHTML = '<p class="result-line">From ' + fmt(x) + ' to ' + fmt(y) + ' is a <strong>' + fmt(v) + '% ' + dir + '</strong></p>';
    }
  }

  function setMode(next) {
    mode = next;
    modeBtns.forEach((b) => {
      const active = b.dataset.mode === next;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (mode === 'change') {
      xInput.placeholder = 'e.g. 80';
      yInput.placeholder = 'e.g. 100';
    } else {
      xInput.placeholder = mode === 'of' ? 'e.g. 20' : 'e.g. 10';
      yInput.placeholder = 'e.g. 50';
    }
    render();
  }

  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  xInput.addEventListener('input', render);
  yInput.addEventListener('input', render);
})();