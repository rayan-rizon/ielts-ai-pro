self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const destination =
    typeof payload.destination === 'string' && payload.destination.startsWith('/')
      ? payload.destination
      : '/dashboard';
  event.waitUntil(
    self.registration.showNotification(payload.title || 'IELTS AI Pro', {
      body: payload.body || 'Your next practice activity is ready.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: payload.tag || 'learning-reminder',
      renotify: false,
      data: { destination },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = event.notification.data?.destination || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        existing.navigate(destination);
        return existing.focus();
      }
      return self.clients.openWindow(destination);
    })
  );
});
