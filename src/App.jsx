import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'sonner'

// Lazy load pages for code splitting (Performance Optimization)
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clubs = lazy(() => import('./pages/Clubs'))
const ClubDetail = lazy(() => import('./pages/ClubDetail'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Settings = lazy(() => import('./pages/Settings'))
const MeetingRoom = lazy(() => import('./pages/MeetingRoom'))

import PageTransition from './components/PageTransition'

const dashboardLayout = (Page) => (
  <ProtectedRoute>
    <Navbar />
    <main className="pt-16">
      <PageTransition>
        <Page />
      </PageTransition>
    </main>
  </ProtectedRoute>
)

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm font-medium text-text-secondary animate-pulse">Loading...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={dashboardLayout(Dashboard)} />
        <Route path="/clubs" element={dashboardLayout(Clubs)} />
        <Route path="/clubs/:id" element={dashboardLayout(ClubDetail)} />
        <Route path="/events" element={dashboardLayout(Events)} />
        <Route path="/events/:id" element={dashboardLayout(EventDetail)} />
        <Route path="/profile" element={dashboardLayout(Profile)} />
        <Route path="/notifications" element={dashboardLayout(Notifications)} />
        <Route path="/settings" element={dashboardLayout(Settings)} />
        <Route path="/clubs/:clubId/meetings/:meetingId/room" element={
          <ProtectedRoute>
            <PageTransition>
              <MeetingRoom />
            </PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
    </>
  )
}
