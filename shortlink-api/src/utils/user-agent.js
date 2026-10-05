// Lightweight, privacy-conscious user-agent classification.
// We store only coarse categories (device/browser/OS), never the raw
// user-agent string, and do no fingerprinting.
function classifyDevice(ua) {
  if (!ua) return 'other'
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

function classifyBrowser(ua) {
  if (!ua) return 'other'
  if (/Edg\//i.test(ua)) return 'edge'
  if (/OPR\//i.test(ua)) return 'opera'
  if (/Firefox\//i.test(ua)) return 'firefox'
  if (/Chrome\//i.test(ua)) return 'chrome'
  if (/Safari\//i.test(ua)) return 'safari'
  return 'other'
}

function classifyOs(ua) {
  if (!ua) return 'other'
  if (/Windows/i.test(ua)) return 'windows'
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Mac OS X/i.test(ua)) return 'macos'
  if (/Linux|X11/i.test(ua)) return 'linux'
  return 'other'
}

function parseUserAgent(userAgent) {
  return {
    device: classifyDevice(userAgent),
    browser: classifyBrowser(userAgent),
    operatingSystem: classifyOs(userAgent),
  }
}

// Reduce a Referer header to a hostname, or "Direct" when absent/invalid.
function normalizeReferrer(referer) {
  if (!referer) return 'Direct'
  try {
    return new URL(referer).hostname || 'Direct'
  } catch {
    return 'Direct'
  }
}

module.exports = { parseUserAgent, normalizeReferrer }
