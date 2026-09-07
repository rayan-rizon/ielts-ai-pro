/**
 * Audio preloader for synchronized listening tests.
 * Ensures all audio segments are buffered and playable before the countdown starts.
 */
export function preloadListeningAudios(sources) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve, reject) => {
          const audio = new Audio(src);
          audio.preload = 'auto';
          audio.muted = true;
          const timeout = setTimeout(
            () => done(new Error('Audio is taking too long to load. Try again.')),
            15000
          );
          function done(err) {
            clearTimeout(timeout);
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
          audio.oncanplay = () => {
            audio.oncanplay = null;
            audio
              .play()
              .then(() => done())
              .catch(() => done(new Error('Enable audio in your browser, then try again.')));
          };
          audio.onerror = () => done(new Error('One audio part could not load. Try again.'));
        })
    )
  );
}
