import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import axios from 'axios'
import { GoogleOAuthProvider } from '@react-oauth/google'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// We use the provided Google Client ID as a fallback if the env var is not set.
// This is safe because Client IDs are public and meant to be exposed in the frontend.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '101742633395-rmm6bpid906m1df01oh5p3ve4ek09m9s.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
