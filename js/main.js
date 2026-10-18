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
      'An average value for a 2-3 bedroom:',
      ' furniture for the whole family, appliances, electronics, and everyone\u2019s belongings',
    ],
  },
  // Reached only from QAR 500,000, where the callback hint speaks instead
  {
    hint: [
      'An average value for a villa:',
      ' furniture for several rooms, appliances, electronics, art, and jewellery',
    ],
  },
];

const CALLBACK_HINT = [
  'From QAR 500,000:',
  ' we price a home this size over the phone \u2014 leave your number and we will call you back',
];

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
