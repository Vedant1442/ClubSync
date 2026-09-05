import { Navigate } from 'react-router-dom'
import { useClubSync } from '../context/ClubSyncContext'
import { SkeletonPage } from './Skeleton'

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useClubSync()

  if (loading) {
    return <SkeletonPage />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
