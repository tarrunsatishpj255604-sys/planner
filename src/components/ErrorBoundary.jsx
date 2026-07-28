import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) }
  }

  componentDidCatch(error) {
    console.error('App crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#666', marginBottom: 16 }}>{this.state.message}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
