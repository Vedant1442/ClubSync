const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const ClubSyncContext = createContext(null)

export const useClubSync = () => {
  const context = useContext(ClubSyncContext)
  if (!context) throw new Error('useClubSync must be used within a ClubSyncProvider')
  return context
}

export function ClubSyncProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const queryClient = useQueryClient()

  const { data: syncData, isLoading: syncLoading, refetch: fetchData } = useQuery({
    queryKey: ['sync', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const res = await fetch(`${API_URL}/api/sync`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const allMembers = (data.clubMemberships || []).map(m => ({
        id: m.id, club_id: m.club_id, user_id: m.user_id, role: m.role
      }))
      return { ...data, allClubMembers: allMembers };
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  const loading = authLoading || (!!currentUser && syncLoading);

  const clubs = syncData?.clubs || []
  const events = syncData?.events || []
  const clubMemberships = syncData?.clubMemberships || []
  const allClubMembers = syncData?.allClubMembers || []
  const eventMembers = syncData?.eventMembers || []
  const constitutions = syncData?.constitutions || []
  const meetings = syncData?.meetings || []
  const elections = syncData?.elections || []
  const electionCandidates = syncData?.candidates || []
  const electionVotes = syncData?.votes || []
  const documents = syncData?.documents || []
  const tasks = syncData?.tasks || []
  const notifications = syncData?.notifications || []

  const updateCache = (updater) => {
    queryClient.setQueryData(['sync', currentUser?.id], (old) => {
      if (!old) return old;
      return updater(old);
    });
  };

  useEffect(() => {
    // Check if token was passed via OAuth redirect
    const hash = window.location.hash;
    let urlToken = null;
    if (hash.includes('?token=')) {
      urlToken = hash.split('?token=')[1].split('&')[0];
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      // Clean up URL without refreshing
      window.history.replaceState(null, '', window.location.pathname + '#/dashboard');
    }

    const fetchMe = async () => {
      const activeToken = urlToken || token;
      if (!activeToken) {
        setAuthLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        })
        const data = await res.json()
        if (res.ok) {
          setCurrentUser({ ...data.user, name: data.user.full_name, role: 'member' })
        } else if (res.status === 401 || res.status === 403) {
          logout()
        }
      } catch (e) {
        console.error("Network error during auth fetch:", e)
      } finally {
        setAuthLoading(false)
      }
    }
    fetchMe()
  }, [token])

  useEffect(() => {
    if (!currentUser) return;
    
    const updateCache = (table, payload) => {
      queryClient.setQueryData(['sync', currentUser.id], (old) => {
        if (!old) return old;
        const list = old[table] || [];
        let newList = [...list];

        if (payload.eventType === 'INSERT') {
          if (!list.some(item => item.id === payload.new.id)) {
            // Notifications sort newest first
            if (table === 'notifications') newList = [payload.new, ...list];
            else newList = [...list, payload.new];
          }
        } else if (payload.eventType === 'UPDATE') {
          newList = list.map(item => item.id === payload.new.id ? payload.new : item);
        } else if (payload.eventType === 'DELETE') {
          newList = list.filter(item => item.id !== payload.old.id);
        }
        return { ...old, [table]: newList };
      });
    };

    const channel = supabase.channel('public:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, p => updateCache('tasks', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, p => updateCache('meetings', p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, p => {
        if (p.eventType === 'INSERT' && p.new.user_id !== currentUser.id) return;
        updateCache('notifications', p);
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Auth Functions
  const register = async (email, password, fullName) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setCurrentUser({ ...data.user, name: data.user.full_name, role: 'member' })
    return { data }
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setCurrentUser({ ...data.user, name: data.user.full_name, role: 'member' })
    return { data }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    setToken(null)
    setCurrentUser(null)
  }

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentUser(prev => ({ ...prev, ...data.user, name: data.user.full_name }));
      toast.success('Profile updated successfully!');
      return { data };
    } catch (e) {
      console.error(e);
      toast.error('Failed to update profile');
      return { error: 'Failed' };
    }
  }

  // Event Functions
  const createEvent = async (eventData) => {
    const res = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(eventData)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    updateCache(old => ({ ...old, events: [...(old.events || []), data] }))
    return data
  }

  const toggleRSVP = async (eventId) => {
    const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    updateCache(old => {
      const prev = old.eventMembers || [];
      const existing = prev.some(m => m.event_id === eventId && m.user_id === currentUser.id)
      if (existing) {
        return { ...old, eventMembers: prev.filter(m => !(m.event_id === eventId && m.user_id === currentUser.id)) }
      } else {
        return { ...old, eventMembers: [...prev, { event_id: eventId, user_id: currentUser.id, status: 'going' }] }
      }
    })
    
    return data.status
  }

  // Helper to check if current user is an officer of a club
  const getUserClubRole = (clubId) => {
    const membership = clubMemberships.find(m => m.club_id === clubId)
    return membership ? membership.role : null
  }

  const isClubOfficer = (clubId) => {
    const role = getUserClubRole(clubId)
    return role && ['President', 'Vice President', 'Secretary', 'Treasurer'].includes(role)
  }

  // Create standard notification
  const addNotification = async (title, message) => {
    try {
      const res = await fetch(`${API_URL}/api/sync/notifications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, message })
      })
      if (res.ok) {
        const data = await res.json()
        updateCache(old => ({ ...old, notifications: [data, ...(old.notifications || [])] }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Clear/Mark notification read
  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sync/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        updateCache(old => ({ ...old, notifications: (old.notifications || []).map(n => n.id === id ? { ...n, read: true } : n) }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const createClub = async (name, description, category) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, description, category })
      })
      if (res.ok) {
        toast.success(`Club ${name} created successfully!`)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Join a Club
  const joinClub = async (clubId) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        updateCache(old => ({ ...old, clubMemberships: [...(old.clubMemberships || []), { club_id: clubId, user_id: currentUser.id, role: 'Member' }] }))
        toast.success('Joined club successfully!')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Leave a Club
  const leaveClub = async (clubId) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs/${clubId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        updateCache(old => ({ ...old, clubMemberships: (old.clubMemberships || []).filter(m => !(m.club_id === clubId && m.user_id === currentUser.id)) }))
        toast.success('Left club successfully')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Update Member Role
  const updateMemberRole = async (clubId, userId, role) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs/${clubId}/members/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role })
      })
      if (res.ok) {
        if (userId === currentUser.id) {
          updateCache(old => ({ ...old, clubMemberships: (old.clubMemberships || []).map(m => m.club_id === clubId ? { ...m, role } : m) }))
        }
        toast.success('Role updated!')
        fetchData()
      } else {
        toast.error('Failed to update role')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // RSVP Event
  const rsvpEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('RSVP successful!')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Cancel RSVP
  const cancelRsvp = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: 'POST', // Same endpoint toggles or we can assume it removes if exists
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('RSVP cancelled.')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const isUserRSVPed = (eventId) => {
    return eventMembers.some(em => em.event_id === eventId && em.user_id === currentUser.id)
  }

  // Add Constitution Version
  const addConstitutionVersion = async (clubId, title, content, version) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs/${clubId}/constitution`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ version, content, title })
      })
      if (res.ok) {
        const newVersion = await res.json()
        updateCache(old => ({ ...old, constitutions: [newVersion, ...(old.constitutions || [])] }))
        toast.success('Constitution updated!')
        fetchData()
        return { data: newVersion }
      }
    } catch (e) {
      console.error(e)
    }
    return { error: 'Failed' }
  }

  // Schedule a Meeting
  const addMeeting = async (clubId, { title, date, time, location, description }) => {
    try {
      const res = await fetch(`${API_URL}/api/clubs/${clubId}/meetings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, date, time, location, description })
      })
      if (res.ok) {
        const newMeeting = await res.json()
        updateCache(old => ({ ...old, meetings: [...(old.meetings || []), newMeeting] }))
        toast.success('Meeting scheduled!')
        fetchData()
        return { data: newMeeting }
      }
    } catch (e) {
      console.error(e)
    }
    return { error: 'Failed' }
  }

  // Update Minutes and AI summary
  const updateMeetingMinutes = async (meetingId, minutes) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/summarize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ meetingId, minutes })
      });
      if (!res.ok) throw new Error('Failed to summarize')
      
      const { summary } = await res.json()
      
      updateCache(old => ({ ...old, meetings: (old.meetings || []).map(m => m.id === meetingId ? { ...m, minutes, ai_summary: summary } : m) }))
      await addNotification('Meeting Minutes Logged', `Minutes have been saved and AI summarized.`)
    } catch (e) {
      console.error(e)
    }
  }

  // Create Election
  const createElection = async (clubId, title, description, candidateNames) => {
    try {
      const res = await fetch(`${API_URL}/api/elections`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          club_id: clubId,
          title,
          description,
          candidates: candidateNames
        })
      });
      if (!res.ok) throw new Error('Failed to create election')
      
      await addNotification('New Election Started', `Election "${title}" is now live!`)
      fetchData() // Re-sync to get the new election + candidates
      toast.success('Election started successfully!')
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to start election')
    }
  }

  // Cast Vote
  const castVote = async (electionId, candidateId) => {
    try {
      const res = await fetch(`${API_URL}/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ candidate_id: candidateId })
      });
      
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 403) toast.error(data.error) // "Already voted"
        return false
      }

      await addNotification('Vote Cast', `Your vote has been counted securely.`)
      fetchData() // Re-sync to update vote counts locally
      toast.success('Vote cast successfully!')
      return true
    } catch (e) {
      console.error(e)
      toast.error('Failed to cast vote')
      return false
    }
  }

  // Add Task
  const addTask = async (clubId, { title, description, assignee_id, due_date }) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          club_id: clubId,
          title,
          description,
          assignee_id,
          due_date
        })
      });
      if (!res.ok) throw new Error('Failed to create task')
      
      const newTask = await res.json()
      updateCache(old => ({ ...old, tasks: [...(old.tasks || []), newTask] }))
      await addNotification('Task Assigned', `New task "${title}" has been created.`)
      toast.success('Task created successfully!')
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to create task')
    }
  }

  // Update Task Status
  const updateTaskStatus = async (taskId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update task')
      
      updateCache(old => ({ ...old, tasks: (old.tasks || []).map(t => t.id === taskId ? { ...t, status } : t) }))
      toast.success('Task status updated!')
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to update task')
    }
  }

  // Upload Document
  const uploadDocument = async (clubId, file, folderPath) => {
    const fileName = `${clubId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return { error: uploadError }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB'

    const res = await fetch(`${API_URL}/api/clubs/${clubId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: file.name,
        file_url: publicUrl,
        folder_path: folderPath,
        file_size: fileSize
      })
    })

    if (res.ok) {
      const newDoc = await res.json()
      updateCache(old => ({ ...old, documents: [...(old.documents || []), newDoc] }))
      toast.success('Document uploaded!')
      fetchData()
      return { data: newDoc }
    }
    return { error: 'Failed' }
  }

  // Ask AI Assistant
  const askAI = async (clubId, question) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ clubId, question })
      });
      
      if (!res.ok) throw new Error('Failed to chat')
      
      const { answer } = await res.json()
      return answer
    } catch (e) {
      console.error(e)
      return "Sorry, I am having trouble connecting to my brain."
    }
  }

  return (
    <ClubSyncContext.Provider
      value={{
        clubs,
        events,
        clubMemberships,
        allClubMembers,
        eventMembers,
        constitutions,
        meetings,
        elections,
        electionCandidates,
        electionVotes,
        documents,
        tasks,
        notifications,
        loading,
        currentUser,
        getUserClubRole,
        isClubOfficer,
        createClub,
        joinClub,
        leaveClub,
        updateMemberRole,
        createEvent,
        toggleRSVP,
        rsvpEvent,
        cancelRsvp,
        isUserRSVPed,
        addConstitutionVersion,
        addMeeting,
        updateMeetingMinutes,
        createElection,
        castVote,
        addTask,
        updateTaskStatus,
        uploadDocument,
        askAI,
        markNotificationRead,
        refreshData: fetchData,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </ClubSyncContext.Provider>
  )
}
