import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ClubSyncProvider } from './context/ClubSyncContext'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import ErrorBoundary from './components/ErrorBoundary'

registerSW({ immediate: true })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ClubSyncProvider>
              <App />
            </ClubSyncProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)