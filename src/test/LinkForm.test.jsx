import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LinkForm from '@/components/LinkForm'
import { createLink } from '@/api'

vi.mock('@/api', () => ({
  createLink: vi.fn(),
  ApiError: class ApiError extends Error {},
  NetworkError: class NetworkError extends Error {},
}))

function fillAndSubmit(url, alias) {
  const urlInput = screen.getByLabelText(/long url/i)
  fireEvent.change(urlInput, { target: { value: url } })
  if (alias !== undefined) {
    fireEvent.change(screen.getByLabelText(/custom alias/i), {
      target: { value: alias },
    })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Shorten' }))
}

describe('LinkForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows a validation error and skips the API for an invalid URL', async () => {
    render(<LinkForm />)
    fillAndSubmit('not a url')
    expect(await screen.findByText('Enter a valid URL.')).toBeVisible()
    expect(createLink).not.toHaveBeenCalled()
  })

  test('shows a validation error for a bad alias', async () => {
    render(<LinkForm />)
    fillAndSubmit('https://example.com', 'a!')
    expect(await screen.findByText(/Use 3-32 characters/i)).toBeVisible()
    expect(createLink).not.toHaveBeenCalled()
  })

  test('calls createLink with the entered values on a valid submit', async () => {
    createLink.mockResolvedValue({
      code: 'launch',
      url: 'https://example.com',
      shortUrl: 'https://sho.rt/launch',
      clicks: 0,
      createdAt: new Date().toISOString(),
    })
    const onCreated = vi.fn()
    render(<LinkForm onCreated={onCreated} />)
    fillAndSubmit('https://example.com', 'launch')
    await waitFor(() => expect(createLink).toHaveBeenCalledWith({
      url: 'https://example.com',
      alias: 'launch',
    }))
    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(screen.getByLabelText(/copy https:\/\/sho\.rt\/launch/i)).toBeInTheDocument()
  })

  test('shows the API error message when the call fails', async () => {
    createLink.mockRejectedValue(
      Object.assign(new Error('alias already in use'), { status: 409 })
    )
    render(<LinkForm />)
    fillAndSubmit('https://example.com', 'taken')
    expect(await screen.findByText('alias already in use')).toBeVisible()
  })
})
