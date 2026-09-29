import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onError: (error: Error) => void
}

/** If the 3D view crashes (e.g. the graphics driver fails), fall back to text-only mode. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error('3D view failed, switching to text-only mode:', error)
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
