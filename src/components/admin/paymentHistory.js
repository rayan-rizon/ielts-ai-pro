const normalizeText = (value) => String(value ?? '').toLocaleLowerCase();

export function mergePaymentHistory(manualRequests = [], stripePayments = []) {
  const recordedStripeTransactions = new Set(
    manualRequests
      .filter((request) => normalizeText(request.payment_method) === 'stripe')
      .map((request) => request.transaction_id)
      .filter(Boolean)
  );

  const unrecordedStripePayments = stripePayments.filter(
    (payment) => payment?.transaction_id && !recordedStripeTransactions.has(payment.transaction_id)
  );

  return [...manualRequests, ...unrecordedStripePayments].sort(
    (left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0)
  );
}

export function matchesPaymentSearch(request, search) {
  const query = normalizeText(search).trim();
  if (!query) return true;

  return [
    request?.transaction_id,
    request?.sender_phone,
    request?.payment_method,
    request?.user?.full_name,
    request?.user?.email,
  ].some((value) => normalizeText(value).includes(query));
}
