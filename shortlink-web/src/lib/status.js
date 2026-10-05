// Link display status, computed from the flags the API returns.
export function linkStatus(link) {
  if (!link.isEnabled) return 'disabled'
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
    return 'expired'
  }
  return 'active'
}

export const STATUS_LABELS = {
  active: 'Active',
  disabled: 'Disabled',
  expired: 'Expired',
}
