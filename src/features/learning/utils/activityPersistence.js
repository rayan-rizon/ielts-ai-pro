const NEWER_ACTIVITY_COLUMNS = [
  'scheduled_date',
  'stage_key',
  'completion_policy',
  'requested_mode',
  'evidence_key',
];

/**
 * Projects can receive the dashboard before the matching activity metadata migration. Keep
 * marking self-reported legacy tasks functional while the database schema catches up.
 */
export function isActivitySchemaCompatibilityError(error) {
  const message = String(error?.message || '');
  return (
    /schema cache|could not find.*column/i.test(message) &&
    NEWER_ACTIVITY_COLUMNS.some((column) => message.includes(column))
  );
}

export function toLegacyActivityPayload(payload) {
  const legacyPayload = { ...payload };
  NEWER_ACTIVITY_COLUMNS.forEach((column) => {
    delete legacyPayload[column];
  });
  return legacyPayload;
}

export async function upsertLearningPathActivity(client, payload) {
  const options = { onConflict: 'learning_path_id,activity_key' };
  const result = await client.from('learning_path_activities').upsert(payload, options);

  if (!result.error || !isActivitySchemaCompatibilityError(result.error)) return result;

  return client.from('learning_path_activities').upsert(toLegacyActivityPayload(payload), options);
}
