/* ---------------------------------------------------------------
   Quote flow — step 1, About property
   --------------------------------------------------------------- */
(() => {
  /* --- Skeleton — the transition between screens ----------------------- */
  // Scheduled first so a later failure cannot leave the page loading forever
  const SKELETON_MS = 900;
  const skeleton = document.querySelector('[data-skeleton]');
  const content = document.querySelector('[data-step-content]');

  document.body.setAttribute('aria-busy', 'true');
  setTimeout(() => {
    skeleton.hidden = true;
    content.hidden = false;
    document.body.removeAttribute('aria-busy');
  }, SKELETON_MS);

  const state = QuoteState.read();

  /* --- Home contents value — carried over from the landing ------------- */
  const amount = document.querySelector('[data-contents-value]');
  const format = (n) => n.toLocaleString('en-US');
  // 50,000 is what the frame shows, so that is what a direct visit gets
  let value = Number(state.value) > 0 ? Number(state.value) : 50000;

  const paintValue = () => {
    amount.value = format(value);
  };

  // Group the thousands as the field is typed in, keeping the caret the same
  // distance from the end so the separators appearing do not move it.
  amount.addEventListener('input', () => {
    const tailBefore = amount.value.length - amount.selectionEnd;
    const digits = amount.value.replace(/\D/g, '');
    if (!digits) return; // an empty field is someone clearing it to retype
    value = Number(digits);
    QuoteState.write({ value });
    paintValue();
    const caret = Math.max(0, amount.value.length - tailBefore);
    amount.setSelectionRange(caret, caret);
  });

  amount.addEventListener('blur', paintValue);

  paintValue();

  /* --- Policy start date — today unless the visitor picks another ------ */
  const dateInput = document.querySelector('[data-start-date]');
  const dateText = document.querySelector('[data-start-date-text]');
  const validUntil = document.querySelector('[data-valid-until]');
  const policyDates = document.querySelector('[data-policy-dates]');

  const iso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Spelled out rather than taken from toLocaleDateString, which now renders
  // September as "Sept" in en-GB while the design asks for "Sep"
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const human = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  // A policy runs for a year from its start, so the cover ends the day before
  const endOf = (start) => {
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    return end;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const saved = state.startDate ? new Date(`${state.startDate}T00:00:00`) : null;
  const start = saved && !Number.isNaN(saved.valueOf()) && saved >= today ? saved : today;

  const paintDate = (date) => {
    const end = endOf(date);
    dateInput.value = iso(date);
    dateText.textContent = human(date);
    validUntil.textContent = human(end);
    policyDates.textContent = `${human(date)} – ${human(end)}`;
    QuoteState.write({ startDate: iso(date) });
  };

  dateInput.min = iso(today); // cover cannot start in the past
  paintDate(start);

  dateInput.addEventListener('change', () => {
    if (!dateInput.value) return;
    paintDate(new Date(`${dateInput.value}T00:00:00`));
  });

  // The control is invisible, so its own calendar indicator is unreachable —
  // clicking anywhere on the field has to ask for the picker instead
  dateInput.addEventListener('click', () => {
    if (typeof dateInput.showPicker !== 'function') return;
    try {
      dateInput.showPicker();
    } catch (error) {
      /* the browser refused it — the keyboard still edits the field */
    }
  });

  /* --- Address --------------------------------------------------------- */
  const address = document.querySelector('#address');
  if (state.address) address.value = state.address;
  address.addEventListener('change', () => {
    QuoteState.write({ address: address.value.trim() });
  });

  /* --- Continue -------------------------------------------------------- */
  // Step 2 is not built yet, so this only banks what the step collected
  document.querySelector('#property-form').addEventListener('submit', (event) => {
    event.preventDefault();
    QuoteState.write({ value, address: address.value.trim(), startDate: dateInput.value });
  });
})();
