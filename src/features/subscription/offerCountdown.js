export function splitRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** The tiles to show: days, hours, minutes while a day or more is left, otherwise
 * hours, minutes, seconds, where the ticking seconds carry the urgency. */
export function countdownUnits(remainingMs) {
  const { days, hours, minutes, seconds } = splitRemaining(remainingMs);
  return days > 0
    ? [
        [days, 'days'],
        [hours, 'hrs'],
        [minutes, 'min'],
      ]
    : [
        [hours, 'hrs'],
        [minutes, 'min'],
        [seconds, 'sec'],
      ];
}
