import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clubs from './pages/Clubs'
import ClubDetail from './pages/ClubDetail'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

const dashboardLayout = (Page) => (
  <>
    <Navbar />
    <main className="pt-16">
      <Page />
    </main>
  </>
)

export default function App() {
  return (
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
    </Routes>
  )
}
