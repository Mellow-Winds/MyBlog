const body = document.body;
const liquidGlassBackground = [
  'radial-gradient(circle at 88% 10%, rgba(74, 144, 217, .48), transparent 58%)',
  'radial-gradient(circle at 10% 88%, rgba(211, 228, 253, .82), transparent 60%)',
  'linear-gradient(148deg, rgba(211, 228, 253, .92), rgba(249, 249, 255, .96) 52%, rgba(74, 144, 217, .28))'
].join(', ');

const mediaMatches = query => (
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches
);

const shouldUseSolidMaterial = () => (
  mediaMatches('(prefers-contrast: more)') ||
  mediaMatches('(forced-colors: active)')
);

function paintLiquidBackground() {
  if (shouldUseSolidMaterial()) {
    body.style.removeProperty('background-image');
    body.style.removeProperty('background-attachment');
    return;
  }

  body.style.backgroundImage = liquidGlassBackground;
  body.style.backgroundAttachment = 'fixed';
}

function watchPreference(query) {
  if (typeof window.matchMedia !== 'function') return;

  const mediaQuery = window.matchMedia(query);
  const listener = () => paintLiquidBackground();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(listener);
  }
}

body.dataset.materialMode = 'liquid-glass';
paintLiquidBackground();
watchPreference('(prefers-contrast: more)');
watchPreference('(forced-colors: active)');
