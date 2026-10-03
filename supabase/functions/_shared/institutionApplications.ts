export function validateInstitutionApplication(input: Record<string, unknown>) {
  const text = (key: string, min: number, max: number) => {
    const value = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    if (value.length < min || value.length > max)
      throw new Error(`Please check ${key.replace(/_/g, ' ')}`);
    return value;
  };
  const email = text('email', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid work email');
  if (!['number', 'string'].includes(typeof input.expected_seats))
    throw new Error('Enter the number of expected seats');
  const expected_seats = Number(input.expected_seats);
  if (!Number.isInteger(expected_seats) || expected_seats < 1 || expected_seats > 100000)
    throw new Error('Expected seats must be between 1 and 100,000');
  const request_key = text('request_key', 36, 36);
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(request_key))
    throw new Error('Invalid request reference');
  return {
    institution_name: text('institution_name', 2, 160),
    contact_name: text('contact_name', 2, 120),
    email,
    country: text('country', 2, 100),
    expected_seats,
    message: text('message', 0, 2000),
    request_key,
  };
}
