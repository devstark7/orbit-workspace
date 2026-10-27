// Keep a logical submission stable across network failures, but rotate its key
// when the user changes the payload or opens a new form.
export function createSubmissionKey(generate = () => crypto.randomUUID()) {
  let previous;
  let key;
  return (payload) => {
    const next = JSON.stringify(payload);
    if (next !== previous) {
      key = generate();
      previous = next;
    }
    return key;
  };
}
