/* ---------------------------------------------------------------
   Callback request — the modal both the landing and the flow open
   when a home is worth QAR 500,000 or more.

   The markup lives here rather than in either page because both need
   exactly the same dialog; the owners modal is the landing's alone and
   stays in its markup. Every [data-modal] on the page is wired up the
   same way, whichever of the two it came from.
   --------------------------------------------------------------- */

// From here the demo stops pricing on the spot and asks for a callback
const CALLBACK_FROM = 500000;

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

/* --- The shared dialog, frames 36016:192310 -> 36016:192968 ---------- */
const CALLBACK_MODAL = `
  <div class="modal" id="callback-modal" data-modal="callback" hidden>
    <button class="modal__scrim" type="button" tabindex="-1" aria-label="Close" data-modal-close></button>
    <div class="modal__dialog" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="callback-modal-title">
      <div class="modal__head">
        <h2 class="heading-6 modal__title" id="callback-modal-title">Callback request</h2>
        <button class="modal__close" type="button" aria-label="Close" data-modal-close>
          <img src="assets/img/icon-x-close-24.svg" alt="" width="24" height="24">
        </button>
      </div>
      <form class="modal__form" action="#" novalidate data-modal-form>
        <section class="modal__pane" data-pane="details">
          <div class="modal__body">
            <div class="modal__group">
              <div class="modal__group-head">
                <h3 class="heading-6">What&rsquo;s your home contents value?</h3>
              </div>
            <div class="modal__picker">
              <div class="field">
                <div class="field__body">
                  <div class="field__content">
                    <label class="field__label" for="cb-contents">QAR</label>
                    <input class="field__input" id="cb-contents" type="text" inputmode="numeric" placeholder=" " data-amount>
                  </div>
                </div>
              </div>
              <div class="chips" role="group" aria-label="Quick picks">
                <button class="chip" type="button" data-chip="40000">QAR 40,000</button>
                <button class="chip" type="button" data-chip="75000">QAR 75,000</button>
                <button class="chip" type="button" data-chip="250000">QAR 250,000</button>
                <button class="chip" type="button" data-chip="500000">QAR 500,000+</button>
              </div>
            </div>
            </div>
          <div class="modal__group modal__fields">
            <div class="field">
              <div class="field__body">
                <div class="field__content">
                  <label class="field__label" for="cb-address">Address and city</label>
                  <input class="field__input" id="cb-address" type="text" placeholder=" " autocomplete="street-address">
                </div>
              </div>
              <p class="text-small-regular field__caption">Example: Apartment 1, Building 2, Street 3, Zone 4, Doha</p>
            </div>
            <div class="modal__row">
              <div class="modal__phone">
                <div class="phone-field">
                  <button class="phone-field__country" type="button" aria-label="Select country code" tabindex="-1">
                    <span class="phone-field__flag"><img src="assets/img/flag-qa.svg" alt=""></span>
                    <img class="phone-field__chevron" src="assets/img/icon-chevron-down-24.svg" alt="">
                  </button>
                  <div class="phone-field__body">
                    <span class="phone-field__code">+974</span>
                    <input class="phone-field__input" type="tel" inputmode="numeric" placeholder="0000 0000" maxlength="9" autocomplete="tel-national" aria-label="Phone number" data-phone>
                  </div>
                </div>
                <p class="text-small-regular field-error" data-phone-error hidden>Enter your 8-digit phone number to continue</p>
              </div>
              <div class="field field--filled field--date modal__date">
                <div class="field__body">
                  <div class="field__content">
                    <label class="field__label" for="cb-date">Policy start date</label>
                    <span class="field__input field__input--static" data-date-text>&nbsp;</span>
                  </div>
                  <img class="field__icon" src="assets/img/icon-calendar-24.svg" alt="" width="24" height="24">
                  <!-- The native control drives the value but is invisible: it
                       renders the date in its own locale format, not the design's -->
                  <input class="field__date" id="cb-date" type="date" data-date>
                </div>
                <p class="text-small-regular field__caption">Valid until <span data-valid-until></span></p>
              </div>
            </div>
          </div>
          </div>
          <div class="modal__foot">
            <button class="btn btn--l btn--primary" type="submit">
              <span class="btn__content">Send</span>
            </button>
            <p class="text-small-regular modal__legal">By continuing, you agree to our <a href="#">Privacy Policy</a></p>
          </div>
        </section>
        <section class="modal__pane" data-pane="success" hidden>
          <div class="modal__success">
            <span class="modal__badge">
              <img src="assets/img/icon-check-36.svg" alt="" width="36" height="36">
            </span>
            <div class="modal__success-text">
              <h3 class="heading-3">Your request received</h3>
              <p class="text-regular">We&rsquo;ll contact you soon to gather more details about the property and finish the purchase</p>
            </div>
          </div>
          <div class="modal__foot">
            <button class="btn btn--l btn--outline" type="button" data-modal-close>
              <span class="btn__content">Close</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  </div>
`;

// Either page gets the dialog appended once, unless it already carries one
if (!document.querySelector('[data-modal="callback"]')) {
  document.body.insertAdjacentHTML('beforeend', CALLBACK_MODAL);
}

document.querySelectorAll('[data-modal]').forEach(initModal);

document.querySelectorAll('[data-modal-open]').forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
});
