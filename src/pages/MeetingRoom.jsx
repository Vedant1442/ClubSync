import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useClubSync } from '../context/ClubSyncContext';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MeetingRoom() {
  const { clubId, meetingId } = useParams();
  const navigate = useNavigate();
  const { currentUser, syncData } = useClubSync();
  const apiRef = useRef(null);
  
  // Keep track of all participants who joined at any point
  const [participants, setParticipants] = useState(new Map());

  // Add the current user to the list initially
  useEffect(() => {
    if (currentUser) {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(currentUser.id || 'me', {
          name: currentUser.name || currentUser.full_name || 'Host',
          joinTime: new Date().toLocaleTimeString()
        });
        return newMap;
      });
    }
  }, [currentUser]);

  const handleJitsiIFrameRef1 = (iframeRef) => {
    iframeRef.style.background = '#09090b'; // zinc-950
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
    iframeRef.style.border = 'none';
  };

  const handleReadyToClose = () => {
    navigate(`/clubs/${clubId}`);
  };

  const handleApiReady = (api) => {
    apiRef.current = api;
    
    // Listen for new participants joining
    api.addListener('participantJoined', (participant) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(participant.id)) {
          newMap.set(participant.id, {
            name: participant.formattedDisplayName || participant.displayName || 'Guest',
            joinTime: new Date().toLocaleTimeString()
          });
        }
        return newMap;
      });
    });
  };

  const downloadAttendance = () => {
    if (participants.size === 0) {
      toast.error('No participants to download');
      return;
    }

    // Convert Map to CSV
    let csvContent = "Name,Join Time\n";
    participants.forEach((info) => {
      // Escape names with commas just in case
      const name = `"${info.name.replace(/"/g, '""')}"`;
      csvContent += `${name},${info.joinTime}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_meeting_${meetingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Attendance downloaded successfully!');
  };

  // Find meeting info if we want to use the title
  const meeting = syncData?.meetings?.find(m => m.id === parseInt(meetingId));
  const roomName = `ClubSync-${clubId}-Meeting-${meetingId}`;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/clubs/${clubId}`)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{meeting ? meeting.title : 'Live Meeting'}</h1>
            <p className="text-xs text-zinc-400">{roomName}</p>
          </div>
        </div>
        <button
          onClick={downloadAttendance}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download Attendance
        </button>
      </div>

      {/* Jitsi Meeting Wrapper */}
      <div className="flex-1 w-full relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: currentUser?.name || currentUser?.full_name || 'Member',
          }}
          onApiReady={handleApiReady}
          getIFrameRef={handleJitsiIFrameRef1}
          onReadyToClose={handleReadyToClose}
        />
      </div>
    </div>
  );
}
