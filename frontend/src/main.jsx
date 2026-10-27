import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import App from './OrbitApp';
import './orbit.css';

class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <img src="/orbit.svg" width="48" alt="Orbit" />
        <h1>Let’s find our orbit again.</h1>
        <p>Something unexpected happened. Your saved work is still on the server.</p>
        <button className="btn primary" onClick={() => location.reload()}>
          Reload workspace
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>,
);
