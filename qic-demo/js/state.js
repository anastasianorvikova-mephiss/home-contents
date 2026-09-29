/* ---------------------------------------------------------------
   Quote state — the data the landing collects and the flow reads.

   sessionStorage carries it across the navigation; the query string
   carries it too, so a link to a step opens with the same numbers
   even in a browser that never saw the landing.
   --------------------------------------------------------------- */
const QuoteState = (() => {
  const KEY = 'qic-demo-quote';

  const read = () => {
    let saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(KEY)) || {};
    } catch (error) {
      saved = {}; // private mode, or someone left junk under the key
    }

    // The query string wins: a shared link must open with what it carries
    const params = new URLSearchParams(location.search);
    const value = Number(params.get('value'));
    if (Number.isFinite(value) && value > 0) saved.value = value;

    return saved;
  };

  const write = (patch) => {
    const next = { ...read(), ...patch };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch (error) {
      /* storage unavailable — the query string still carries the value */
    }
    return next;
  };

  return { read, write };
})();
