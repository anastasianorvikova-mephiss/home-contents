// Hero — the value drives the illustration and the hint under it. It is set
// in a plain field, with four quick picks for the usual home sizes.
const HOME_STAGES = [
  {
    hint: [
      'An average value for a studio:',
      ' a bed, a sofa, a TV, a fridge, a laptop, and a wardrobe of clothes',
    ],
  },
  {
    hint: [
      'An average value for a 1-bedroom:',
      ' furniture for two rooms, a kitchen, electronics, and everyday belongings',
    ],
  },
  {
    hint: [
      'An average value for a villa:',
      ' furniture for several rooms, appliances, electronics, art, and jewellery',
    ],
  },
];

// The quick picks end at "500,000+", and from there the demo stops pricing on
// the spot: the call to action turns into a callback request.
const CALLBACK_FROM = 500000;
const CALLBACK_HINT = [
  'From QAR 500,000:',
  ' we price a home this size over the phone \u2014 leave your number and we will call you back',
];

/* --- The mask: a Qatari number is 8 digits, written 4 + 4 -------------
   Shared by the hero's phone step and by both callback modals. */
const PHONE_DIGITS = 8;

const bindPhone = (phone, onInput) => {
  const groupPhone = (digits) =>
    (digits.length > 4 ? `${digits.slice(0, 4)} ${digits.slice(4)}` : digits);

  // How many digits stand to the left of a position in the field
  const digitsBefore = (index) => phone.value.slice(0, index).replace(/\D/g, '').length;

  // Writes the number back grouped and puts the caret after the same digit it
  // was after, so the space appearing or moving never drags it along
  const setPhone = (digits, caretDigits) => {
    phone.value = groupPhone(digits);
    let pos = 0;
    let seen = 0;
    while (pos < phone.value.length && seen < caretDigits) {
      if (/\d/.test(phone.value[pos])) seen += 1;
      pos += 1;
    }
    phone.setSelectionRange(pos, pos);
  };

  phone.addEventListener('input', () => {
    let caret = digitsBefore(phone.selectionStart);
    let digits = phone.value.replace(/\D/g, '');

    // A number pasted in full carries the country code the field already
    // shows, so it is dropped rather than eaten as the first four digits
    if (digits.length > PHONE_DIGITS && digits.startsWith('974')) {
      digits = digits.slice(3);
      caret = Math.max(0, caret - 3);
    }

    setPhone(digits.slice(0, PHONE_DIGITS), Math.min(caret, PHONE_DIGITS));
    onInput();
  });

  // Backspace just after the space would only eat the separator, which the
  // mask immediately puts back — so take the digit in front of it instead
  phone.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace') return;
    const at = phone.selectionStart;
    if (at !== phone.selectionEnd || at === 0 || phone.value[at - 1] !== ' ') return;
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    const caret = digitsBefore(at) - 1;
    setPhone(digits.slice(0, caret) + digits.slice(caret + 1), caret);
  });
};

const initHero = (hero) => {
  const amount = hero.querySelector('[data-amount]');
  if (!amount) return;

  const field = amount.parentElement;
  const shots = [...hero.querySelectorAll('.hero-c__shot')];
  const chips = [...hero.querySelectorAll('[data-chip]')];
  const hintLeads = [...hero.querySelectorAll('[data-hint-lead]')];
  const hintRests = [...hero.querySelectorAll('[data-hint-rest]')];

  // Where the illustration changes, named on the section: the quick picks'
  // own steps, 75,000 and 250,000.
  const THRESHOLDS = (hero.dataset.stages || '')
    .split(',')
    .filter(Boolean)
    .map(Number);

  // A home belongs to the stage it opens, so a value standing on a threshold
  // is already in that stage.
  const stageFor = (n) => THRESHOLDS.filter((threshold) => n >= threshold).length;

  // The QAR prefix lives outside the input, so the value is the number alone
  const format = (n) => n.toLocaleString('en-US');

  let value = Number(String(amount.value).replace(/\D/g, '')) || 0;
  let refit = () => {};

  /* --- Above the limit -------------------------------------------------
     The field takes any number; from 500,000 up the primary Continue turns
     into an outline Callback request. */
  const cta = hero.querySelector('[data-step-next]');
  const ctaLabel = cta.querySelector('.btn__content');
  const ctaIcon = cta.querySelector('.btn__icon');

  const paintCta = () => {
    const over = value >= CALLBACK_FROM;
    cta.classList.toggle('btn--primary', !over);
    cta.classList.toggle('btn--outline', over);
    ctaLabel.textContent = over ? 'Callback request' : 'Continue';
    // The white arrow would be invisible on the outline button's own white
    ctaIcon.src = over
      ? 'assets/img/icon-arrow-right-dark.svg'
      : 'assets/img/icon-arrow-right.svg';
  };

  const paint = () => {
    const stage = stageFor(value);
    shots.forEach((shot, i) => shot.classList.toggle('is-active', i === stage));

    const hint = value >= CALLBACK_FROM ? CALLBACK_HINT : HOME_STAGES[stage].hint;
    hintLeads.forEach((el) => { el.textContent = hint[0]; });
    hintRests.forEach((el) => { el.textContent = hint[1]; });

    // A quick pick stays lit only while the field still holds its number
    chips.forEach((chip) => {
      chip.classList.toggle('is-active', Number(chip.dataset.chip) === value);
    });

    paintCta();
    refit();
  };

  const setValue = (n) => {
    value = Math.max(0, n);
    amount.value = format(value);
    paint();
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setValue(Number(chip.dataset.chip)));
  });

  // Group the thousands as the field is typed in, keeping the caret the same
  // distance from the end so the separators appearing do not move it.
  amount.addEventListener('input', () => {
    const tailBefore = amount.value.length - amount.selectionEnd;
    const digits = amount.value.replace(/\D/g, '');

    // An empty field is someone clearing it to retype; Enter or blur restores it
    if (!digits) return;

    value = Number(digits);
    amount.value = format(value);
    paint();

    const caret = Math.max(0, amount.value.length - tailBefore);
    amount.setSelectionRange(caret, caret);
  });

  // Enter confirms the value and drops focus instead of submitting the form
  amount.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    amount.value = format(value);
    amount.blur();
  });

  amount.addEventListener('blur', () => {
    amount.value = format(value);
  });

  // Clicking the currency or the padding should put the caret in the number
  field.addEventListener('mousedown', (event) => {
    if (event.target === amount) return;
    event.preventDefault();
    amount.focus();
    amount.setSelectionRange(amount.value.length, amount.value.length);
  });

  /* --- Handing the visitor over to the flow --------------------------- */
  const form = hero.querySelector('form');
  const phone = hero.querySelector('.phone-field__input');
  const phoneBox = hero.querySelector('.phone-field');
  const phoneError = hero.querySelector('[data-phone-error]');

  const phoneValid = () => phone.value.replace(/\D/g, '').length === 8;

  const markPhone = (invalid) => {
    phoneBox.classList.toggle('is-invalid', invalid);
    phoneError.hidden = !invalid;
  };

  bindPhone(phone, () => {
    if (phoneValid()) markPhone(false);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // The next screen only opens once the landing has everything it asks for
    if (!phoneValid()) {
      markPhone(true);
      phone.focus();
      return;
    }
    if (!(value > 0)) {
      amount.focus();
      amount.select();
      return;
    }

    QuoteState.write({ value, phone: `+974 ${phone.value.trim()}` });
    location.href = `property.html?value=${value}`;
  });

  /* --- Two steps in one box -------------------------------------------- */
  // The value comes first and the phone second; the steps slide past each
  // other, and the box keeps the height of the taller one so that nothing
  // below it — the render included — moves when they swap.
  const steps = hero.querySelector('[data-steps]');
  const panes = [...steps.querySelectorAll('[data-step]')];

  // On the desktop the box keeps the height of the taller step, so the render
  // beside it never shifts. On the phone the render is above the card and the
  // frame simply shrinks the card to whichever step is showing.
  const narrow = window.matchMedia('(max-width: 767px)');
  const fit = () => {
    const measured = narrow.matches
      ? panes.filter((pane) => pane.classList.contains('is-active'))
      : panes;
    steps.style.height = `${Math.max(...measured.map((pane) => pane.offsetHeight))}px`;
  };
  refit = fit;
  narrow.addEventListener('change', fit);

  const show = (name) => {
    panes.forEach((pane) => {
      pane.classList.toggle('is-active', pane.dataset.step === name);
    });
    // Only the step on screen should be reachable by keyboard
    panes.forEach((pane) => {
      const off = !pane.classList.contains('is-active');
      pane.querySelectorAll('input, button, a').forEach((el) => {
        el.tabIndex = off ? -1 : 0;
      });
    });
    fit();
  };

  cta.addEventListener('click', () => {
    // From QAR 500,000 the branch is a callback: the modal collects the
    // details, so the inline phone step is skipped altogether
    if (value >= CALLBACK_FROM) {
      openModal('callback', value);
      return;
    }
    show('phone');
    // The slide is 450ms; focusing sooner scrolls the page to catch up
    setTimeout(() => phone.focus(), 450);
  });

  hero.querySelector('[data-step-back]').addEventListener('click', () => {
    markPhone(false);
    show('value');
  });

  show('value');
  fit();
  // The box is sized from its contents, which the webfont can still change
  window.addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);

  setValue(value);
};

document.querySelectorAll('[data-hero]').forEach(initHero);

// Tab groups.
document.querySelectorAll('.tabs').forEach((group) => {
  const tabs = [...group.querySelectorAll('.tabs__tab')];

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
    });
  });
});

// FAQ accordion.
document.querySelectorAll('.faq-item__head').forEach((head) => {
  head.addEventListener('click', () => {
    const item = head.closest('.faq-item');
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', String(open));
    const icon = head.querySelector('.faq-item__icon');
    icon.src = open
      ? 'assets/img/icon-minus-circle.svg'
      : 'assets/img/icon-plus-circle.svg';
  });
});

// Article slider arrows — one card plus its gap per click.
document.querySelectorAll('.slider').forEach((slider) => {
  const track = slider.querySelector('.slider__track');
  const step = 280; // 264px card + 16px gap

  slider.querySelectorAll('[data-slide]').forEach((btn) => {
    btn.addEventListener('click', () => {
      track.scrollBy({ left: btn.dataset.slide === 'next' ? step : -step });
    });
  });
});

// Review slider dots.
document.querySelectorAll('.slider-dots').forEach((group) => {
  const dots = [...group.querySelectorAll('.slider-dots__dot')];

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      dots.forEach((item) => {
        const active = item === dot;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
    });
  });
});


/* ---------------------------------------------------------------
   Callback modals — the hero's +QAR 500,000 branch (36016:192310 ->
   36016:192968) and the owners card (35715:175762 -> 35719:180345 ->
   35719:182399). One shell each, the panes swap inside it, and the
   stepper counts only the steps that collect something.
   --------------------------------------------------------------- */
const MODAL_STEPS = ['Step 1: Property details', 'Step 2: Address and policy details'];

// Spelled out rather than taken from toLocaleDateString, which now renders
// September as "Sept" in en-GB while the design asks for "Sep"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const humanDate = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
// A policy runs for a year from its start, so the cover ends the day before
const endOfPolicy = (start) => {
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return end;
};

const modals = new Map();

const initModal = (modal) => {
  const dialog = modal.querySelector('.modal__dialog');
  const form = modal.querySelector('[data-modal-form]');
  const panes = [...modal.querySelectorAll('[data-pane]')];
  const stepper = modal.querySelector('.modal__stepper');
  const stepLabel = modal.querySelector('[data-stepper-label]');
  const segments = [...modal.querySelectorAll('[data-segment]')];

  /* --- amount fields, with the hero's quick picks under them ---------- */
  const format = (n) => n.toLocaleString('en-US');

  const pickers = [...modal.querySelectorAll('.modal__picker')].map((picker) => {
    const input = picker.querySelector('[data-amount]');
    const chips = [...picker.querySelectorAll('[data-chip]')];
    const read = () => Number(input.value.replace(/\D/g, '')) || 0;

    // A quick pick stays lit only while the field still holds its number
    const paint = () => {
      const value = read();
      chips.forEach((chip) => {
        chip.classList.toggle('is-active', Number(chip.dataset.chip) === value);
      });
    };

    const set = (value) => {
      input.value = value ? format(value) : '';
      paint();
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => set(Number(chip.dataset.chip)));
    });

    // Group the thousands as the field is typed in, keeping the caret the
    // same distance from the end so the separators never move it
    input.addEventListener('input', () => {
      const tail = input.value.length - input.selectionEnd;
      const digits = input.value.replace(/\D/g, '');
      input.value = digits ? format(Number(digits)) : '';
      const caret = Math.max(0, input.value.length - tail);
      input.setSelectionRange(caret, caret);
      paint();
    });

    return { input, read, set, pane: input.closest('[data-pane]') };
  });

  const missing = () => pickers.find((picker) => !picker.pane.hidden && !picker.read());

  /* --- phone and policy date ------------------------------------------ */
  const phone = modal.querySelector('.phone-field__input');
  const phoneBox = modal.querySelector('.phone-field');
  const phoneError = modal.querySelector('[data-phone-error]');
  const phoneValid = () => phone.value.replace(/\D/g, '').length === PHONE_DIGITS;
  const markPhone = (invalid) => {
    phoneBox.classList.toggle('is-invalid', invalid);
    phoneError.hidden = !invalid;
  };
  bindPhone(phone, () => {
    if (phoneValid()) markPhone(false);
  });

  const date = modal.querySelector('[data-date]');
  const dateText = modal.querySelector('[data-date-text]');
  const validUntil = modal.querySelector('[data-valid-until]');
  const paintDate = (day) => {
    date.value = isoDate(day);
    dateText.textContent = humanDate(day);
    validUntil.textContent = humanDate(endOfPolicy(day));
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.min = isoDate(today); // cover cannot start in the past
  paintDate(today);
  date.addEventListener('change', () => {
    if (date.value) paintDate(new Date(`${date.value}T00:00:00`));
  });

  /* --- the panes ------------------------------------------------------- */
  let index = 0;

  const show = (next) => {
    index = next;
    panes.forEach((pane, n) => { pane.hidden = n !== next; });

    // The success frame drops both the stepper and the header's title
    const done = panes[next].dataset.pane === 'success';
    modal.classList.toggle('is-done', done);
    if (stepper) {
      stepper.hidden = done;
      if (!done) {
        stepLabel.textContent = MODAL_STEPS[next];
        segments.forEach((segment, n) => {
          segment.classList.toggle('is-done', n < next);
          segment.classList.toggle('is-active', n === next);
        });
      }
    }
    dialog.scrollTop = 0;
  };

  let opener = null;

  const open = (value) => {
    // The hero already asked for the home contents value, so the modal
    // opens with it rather than asking again
    if (value) pickers[pickers.length - 1].set(value);
    show(0);
    modal.hidden = false;
    document.body.classList.add('is-modal-open');
    opener = document.activeElement;
    dialog.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('is-modal-open');
    if (opener) opener.focus();
  };

  modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', close);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });

  const next = modal.querySelector('[data-modal-next]');
  if (next) {
    next.addEventListener('click', () => {
      const empty = missing();
      if (empty) {
        empty.input.focus();
        return;
      }
      show(index + 1);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const empty = missing();
    if (empty) {
      empty.input.focus();
      return;
    }
    if (!phoneValid()) {
      markPhone(true);
      phone.focus();
      return;
    }

    QuoteState.write({
      callback: {
        kind: modal.dataset.modal,
        values: pickers.map((picker) => picker.read()),
        address: modal.querySelector('input[autocomplete="street-address"]').value.trim(),
        phone: `+974 ${phone.value.trim()}`,
        startDate: date.value,
      },
    });
    show(panes.length - 1);
  });

  show(0);
  modals.set(modal.dataset.modal, { open, close });
};

const openModal = (name, value) => {
  const modal = modals.get(name);
  if (modal) modal.open(value);
};

document.querySelectorAll('[data-modal]').forEach(initModal);

document.querySelectorAll('[data-modal-open]').forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
});
