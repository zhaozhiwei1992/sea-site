(function () {
  const root = document.getElementById('age-calc');
  if (!root) return;

  const dobInput = root.querySelector('#ac-dob');
  const asofInput = root.querySelector('#ac-asof');
  const btn = root.querySelector('#ac-calc');
  const resultBox = root.querySelector('#ac-result');
  const ageEl = root.querySelector('#ac-age');
  const daysEl = root.querySelector('#ac-days');
  const nextInEl = root.querySelector('#ac-next-in');
  const nextDateEl = root.querySelector('#ac-next-date');

  function todayStr() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  dobInput.max = todayStr();
  if (!asofInput.value) asofInput.value = todayStr();

  function fullDiff(from, to) {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
  }

  function calc() {
    const dobStr = dobInput.value;
    const asofStr = asofInput.value || todayStr();
    if (!dobStr) {
      alert('Please pick your date of birth.');
      return;
    }
    const dob = new Date(dobStr + 'T00:00:00');
    const asof = new Date(asofStr + 'T00:00:00');
    if (dob > asof) {
      alert('Your date of birth cannot be after the "as of" date.');
      return;
    }

    const diff = fullDiff(dob, asof);
    const totalDays = Math.floor((asof - dob) / 86400000);

    // next birthday
    let nb = new Date(asof.getFullYear(), dob.getMonth(), dob.getDate());
    if (nb <= asof) nb = new Date(asof.getFullYear() + 1, dob.getMonth(), dob.getDate());
    const daysToNext = Math.ceil((nb - asof) / 86400000);
    const nbStr = nb.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    ageEl.textContent = diff.years + ' years, ' + diff.months + ' months, and ' + diff.days + ' days';
    daysEl.textContent = String(totalDays.toLocaleString('en-US'));
    nextInEl.textContent = String(daysToNext);
    nextDateEl.textContent = '(' + nbStr + ')';
    resultBox.classList.remove('hidden');
  }

  btn.addEventListener('click', calc);
  dobInput.addEventListener('change', () => { if (dobInput.value) dobInput.max = todayStr(); });
})();