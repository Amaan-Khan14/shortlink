import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LinkDashboard from '@/components/LinkDashboard'

vi.mock('@/api', () => ({
  getLink: vi.fn(),
  getAnalytics: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
}))

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKE') },
}))

import { getLink, getAnalytics, updateLink, deleteLink } from '@/api'

const linkFixture = {
  code: 'aws-lab',
  url: 'https://example.com/lab',
  shortUrl: 'http://sho.rt/aws-lab',
  clicks: 12,
  createdAt: '2026-10-01T10:00:00Z',
  expiresAt: null,
  isEnabled: true,
  collection: { id: 1, name: 'AWS Workshop' },
}

const analyticsFixture = {
  code: 'aws-lab',
  days: 14,
  totals: { clicks: 12, recorded: 12, today: 3, week: 7 },
  timeline: [{ date: '2026-10-05', clicks: 3 }],
  referrers: [{ name: 'github.com', clicks: 8 }, { name: 'Direct', clicks: 4 }],
  devices: [{ name: 'desktop', clicks: 9 }, { name: 'mobile', clicks: 3 }],
  browsers: [{ name: 'chrome', clicks: 10 }],
  operatingSystems: [{ name: 'macos', clicks: 11 }],
}

function setup() {
  getLink.mockResolvedValue(linkFixture)
  getAnalytics.mockResolvedValue(analyticsFixture)
}

describe('LinkDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setup()
  })

  test('renders stats, breakdowns and QR from the API', async () => {
    render(
      <LinkDashboard
        code="aws-lab"
        collections={[{ id: 1, name: 'AWS Workshop', linkCount: 1 }]}
        onBack={() => {}}
        onChanged={() => {}}
      />
    )
    expect(await screen.findByText('Total clicks')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument() // total
    expect(screen.getAllByText('3').length).toBeGreaterThan(0) // today / mobile clicks
    expect(screen.getByText('Clicks today')).toBeInTheDocument()
    expect(screen.getByText('This week')).toBeInTheDocument()
    expect(screen.getByText('github.com')).toBeInTheDocument()
    expect(screen.getByText('desktop')).toBeInTheDocument()
    expect(await screen.findByAltText(/QR code for/)).toHaveAttribute(
      'src',
      'data:image/png;base64,FAKE'
    )
  })

  test('saving settings calls updateLink with the edited values', async () => {
    render(
      <LinkDashboard code="aws-lab" collections={[]} onBack={() => {}} onChanged={() => {}} />
    )
    const urlInput = await screen.findByLabelText(/destination url/i)
    fireEvent.change(urlInput, { target: { value: 'https://example.com/updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(updateLink).toHaveBeenCalledWith('aws-lab', {
        url: 'https://example.com/updated',
        expiresAt: null,
        collection: 'AWS Workshop',
      })
    )
  })

  test('toggle enable calls updateLink with the flipped flag', async () => {
    render(
      <LinkDashboard code="aws-lab" collections={[]} onBack={() => {}} onChanged={() => {}} />
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Disable' }))
    await waitFor(() => expect(updateLink).toHaveBeenCalledWith('aws-lab', { isEnabled: false }))
  })

  test('delete confirms, calls the API and goes back', async () => {
    const onBack = vi.fn()
    window.confirm = vi.fn(() => true)
    render(
      <LinkDashboard code="aws-lab" collections={[]} onBack={onBack} onChanged={() => {}} />
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Delete link' }))
    await waitFor(() => expect(deleteLink).toHaveBeenCalledWith('aws-lab'))
    await waitFor(() => expect(onBack).toHaveBeenCalled())
  })

  test('shows a retryable error state when the API fails', async () => {
    getLink.mockRejectedValue(new Error('down'))
    render(
      <LinkDashboard code="aws-lab" collections={[]} onBack={() => {}} onChanged={() => {}} />
    )
    expect(await screen.findByText('Could not load this link.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
