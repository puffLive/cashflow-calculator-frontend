import { describe, it, expect } from 'vitest'
import reducer, {
  setActiveTab,
  showExpiryWarning,
  hideExpiryWarning,
  addNotification,
  removeNotification,
  clearNotifications,
  setReconnecting,
  setLoading,
  openModal,
  closeModal,
  resetUI,
  selectExpiryWarning,
} from '@/store/slices/uiSlice'

const notif = (over: Partial<any> = {}) => ({
  id: 'n1',
  type: 'info' as const,
  message: 'hi',
  duration: 3000,
  ...over,
})

describe('uiSlice', () => {
  it('initial state', () => {
    const s = reducer(undefined, { type: '@@INIT' })
    expect(s.activeTab).toBe('dashboard')
    expect(s.expiryWarningVisible).toBe(false)
    expect(s.notifications).toEqual([])
    expect(s.modalOpen).toBeNull()
  })

  it('setActiveTab updates the active tab', () => {
    const s = reducer(undefined, setActiveTab('income'))
    expect(s.activeTab).toBe('income')
  })

  describe('expiry warning', () => {
    it('showExpiryWarning sets visible + minutesRemaining', () => {
      const s = reducer(undefined, showExpiryWarning(3))
      expect(s.expiryWarningVisible).toBe(true)
      expect(s.expiryMinutesRemaining).toBe(3)
    })

    it('hideExpiryWarning resets both fields', () => {
      let s = reducer(undefined, showExpiryWarning(2))
      s = reducer(s, hideExpiryWarning())
      expect(s.expiryWarningVisible).toBe(false)
      expect(s.expiryMinutesRemaining).toBe(0)
    })

    it('selectExpiryWarning memoized selector returns the combined shape', () => {
      const state = {
        ui: { expiryWarningVisible: true, expiryMinutesRemaining: 4 },
      } as any
      expect(selectExpiryWarning(state)).toEqual({ visible: true, minutesRemaining: 4 })
    })
  })

  describe('notifications', () => {
    it('addNotification appends to the queue', () => {
      let s = reducer(undefined, addNotification(notif()))
      s = reducer(s, addNotification(notif({ id: 'n2' })))
      expect(s.notifications).toHaveLength(2)
    })

    it('removeNotification removes by id', () => {
      let s = reducer(undefined, addNotification(notif()))
      s = reducer(s, addNotification(notif({ id: 'n2' })))
      s = reducer(s, removeNotification('n1'))
      expect(s.notifications).toHaveLength(1)
      expect(s.notifications[0].id).toBe('n2')
    })

    it('clearNotifications wipes the queue', () => {
      let s = reducer(undefined, addNotification(notif()))
      s = reducer(s, clearNotifications())
      expect(s.notifications).toEqual([])
    })
  })

  it('setReconnecting + setLoading toggle their flags', () => {
    let s = reducer(undefined, setReconnecting(true))
    expect(s.isReconnecting).toBe(true)
    s = reducer(s, setLoading(true))
    expect(s.isLoading).toBe(true)
  })

  describe('modal', () => {
    it('openModal sets the id; closeModal clears it', () => {
      let s = reducer(undefined, openModal('session_expired'))
      expect(s.modalOpen).toBe('session_expired')
      s = reducer(s, closeModal())
      expect(s.modalOpen).toBeNull()
    })

    it('openModal with a different id replaces the open one', () => {
      let s = reducer(undefined, openModal('session_expired'))
      s = reducer(s, openModal('rejected'))
      expect(s.modalOpen).toBe('rejected')
    })
  })

  it('resetUI returns to initial state', () => {
    let s = reducer(undefined, openModal('session_expired'))
    s = reducer(s, addNotification(notif()))
    s = reducer(s, showExpiryWarning(2))
    s = reducer(s, resetUI())
    expect(s.modalOpen).toBeNull()
    expect(s.notifications).toEqual([])
    expect(s.expiryWarningVisible).toBe(false)
  })
})
