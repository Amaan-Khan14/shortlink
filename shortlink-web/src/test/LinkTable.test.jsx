import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LinkTable from '@/components/LinkTable'
import { linkStatus } from '@/lib/status'

const link = (overrides = {}) => ({
  code: 'abc1234',
  url: 'https://example.com/long',
  shortUrl: 'http://sho.rt/abc1234',
  clicks: 5,
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  expiresAt: null,
  isEnabled: true,
  collection: null,
  ...overrides,
})

describe('LinkTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders rows with status, collection and actions', async () => {
    const onOpenAnalytics = vi.fn()
    render(
      <LinkTable
        links={[
          link(),
          link({
            code: 'disabled1',
            isEnabled: false,
            collection: { id: 1, name: 'AWS Workshop' },
          }),
          link({
            code: 'expired12',
            expiresAt: new Date(Date.now() - 1000).toISOString(),
          }),
        ]}
        loading={false}
        error={null}
        collections={[{ id: 1, name: 'AWS Workshop', linkCount: 1 }]}
        collectionFilter=""
        onFilterChange={() => {}}
        onRetry={() => {}}
        onRefresh={() => {}}
        onOpenAnalytics={onOpenAnalytics}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('AWS Workshop')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /analytics for abc1234/i }))
    expect(onOpenAnalytics).toHaveBeenCalledWith('abc1234')
  })

  test('error state shows a retry button', () => {
    const onRetry = vi.fn()
    render(
      <LinkTable
        links={[]}
        loading={false}
        error={new Error('down')}
        collections={[]}
        collectionFilter=""
        onFilterChange={() => {}}
        onRetry={onRetry}
        onRefresh={() => {}}
        onOpenAnalytics={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('Could not reach the API.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('loading state', () => {
    render(
      <LinkTable links={[]} loading error={null} collections={[]}
        collectionFilter="" onFilterChange={() => {}} onRetry={() => {}}
        onRefresh={() => {}} onOpenAnalytics={() => {}} onDelete={() => {}} />
    )
    expect(screen.getByText('Loading links…')).toBeInTheDocument()
  })
})

describe('linkStatus', () => {
  test('classifies active, disabled and expired', () => {
    expect(linkStatus(link())).toBe('active')
    expect(linkStatus(link({ isEnabled: false }))).toBe('disabled')
    expect(
      linkStatus(link({ expiresAt: new Date(Date.now() - 1000).toISOString() }))
    ).toBe('expired')
  })
})
