import { Navigate } from 'react-router-dom'
import { useClubSync } from '../context/ClubSyncContext'

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useClubSync()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-sm font-medium animate-pulse">Loading...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
