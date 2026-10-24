import React, { useState, useMemo } from 'react'
import { 
  X, 
  MapPin, 
  Navigation, 
  Compass, 
  Layers, 
  ExternalLink, 
  Info, 
  Check, 
  Copy, 
  Wifi, 
  Volume2, 
  Wind, 
  Footprints,
  Sparkles,
  Building
} from 'lucide-react'

// Authentic PICT Pune campus venue database
const PICT_VENUES = [
  {
    id: 'f-audi-1',
    name: 'Auditorium 1 (Main Audi)',
    building: 'F-Building (Ground Floor)',
    floor: 'Ground Floor, F-001',
    capacity: '650+ Seats',
    facilities: ['Dual 4K Projectors', 'JBL Line Array Sound', 'Centralized Air Conditioning', 'Campus eduroam Wi-Fi'],
    keywords: ['audi', 'auditorium', 'auditorium 1', 'f-building', 'f building', 'audi 1'],
    coordinates: { x: 320, y: 190, width: 140, height: 90 },
    landmark: 'Central Courtyard fountain, past the main glass doors of F-Building',
    directions: [
      'Enter PICT via the Main Gate on Pune-Satara Road.',
      'Walk straight along the main paved avenue past the Security Kiosk (approx. 40 meters).',
      'At the central quadrangle amphitheatre, enter F-Building through the central glass atrium.',
      'Auditorium 1 main double doors will be directly facing you on the ground floor.'
    ]
  },
  {
    id: 'a-seminar-hall',
    name: 'A-Building Seminar Hall (A-101)',
    building: 'A-Building (Computer Engineering Dept)',
    floor: '1st Floor, Room A-101',
    capacity: '180 Seats',
    facilities: ['Dual Laser Projectors', 'Wireless Mics', 'Tiered Seminar Seating', 'High-Speed Wi-Fi'],
    keywords: ['a-building', 'a building', 'seminar', 'a-101', 'a101', 'comp dept', 'computer dept'],
    coordinates: { x: 140, y: 150, width: 120, height: 90 },
    landmark: 'Above Computer Engineering HOD Office, 1st floor corridor',
    directions: [
      'Enter PICT Main Gate and take the immediate left path towards A-Building.',
      'Enter A-Building through Staircase 1 or take the central lift to Floor 1.',
      'Turn right at the Department Notice Board corridor.',
      'Seminar Hall A-101 is located at the middle of the hallway on your left.'
    ]
  },
  {
    id: 'robotics-lab',
    name: 'Robotics & Innovation Lab',
    building: 'Workshop & Innovation Annex',
    floor: 'Ground Floor (Mech Annex)',
    capacity: '80 Workstations',
    facilities: ['3D Printers & CNC Mills', 'Power Electronics Testing Benches', 'High-Voltage Regulated Supply', 'Robocon Arena'],
    keywords: ['robotics', 'workshop', 'mech', 'robocon', 'hardware', 'lab 4', 'makerspace'],
    coordinates: { x: 120, y: 310, width: 150, height: 80 },
    landmark: 'Behind A-Building near the Mechanical Engineering Fabrication Shed',
    directions: [
      'From the Main Gate, follow the western perimeter road towards the Workshop Block.',
      'Pass the Student Project display shed and fabrication bay.',
      'The Robotics & Robocon Arena is located inside the double iron doors of the Annex.',
      'Check in with the Lab Assistant at the entrance bay.'
    ]
  },
  {
    id: 'f-computing-labs',
    name: 'Advanced Computing Labs (F-301..304)',
    building: 'F-Building (3rd Floor)',
    floor: '3rd Floor, Labs F-301 to F-305',
    capacity: '240 High-End Terminals',
    facilities: ['Ubuntu Linux Workstations', 'NVIDIA GPU Compute Cluster', 'Gigabit Ethernet', 'Dual Displays'],
    keywords: ['lab', 'computing', 'f-301', 'f301', 'coding lab', 'hackathon lab', 'it lab'],
    coordinates: { x: 320, y: 90, width: 140, height: 75 },
    landmark: 'Take F-Building North Elevator or central staircase to 3rd floor',
    directions: [
      'Enter F-Building via the ground floor lobby.',
      'Take the central glass elevators or Staircase 2 up to the 3rd floor.',
      'Exit the elevator lobby and turn left down the Department of Information Technology corridor.',
      'Labs F-301 through F-304 are lined consecutively along the corridor.'
    ]
  },
  {
    id: 'central-library',
    name: 'Digital Library & Reading Hall',
    building: 'Central Library Block',
    floor: '2nd Floor, Main Wing',
    capacity: '250 Readers',
    facilities: ['Silent Study Zone', 'IEEE Xplore & ACM Portal Access', 'Air Conditioned', 'Charging Outlets at Desks'],
    keywords: ['library', 'reading hall', 'digital library', 'central library', 'admin block'],
    coordinates: { x: 320, y: 310, width: 140, height: 80 },
    landmark: 'Opposite PICT Cafeteria, above the Student Section Office',
    directions: [
      'Enter through the Administration Block main porch.',
      'Proceed up the wide spiral staircase to the 2nd Floor.',
      'Swipe your student Smart ID card at the turnstile entrance.',
      'Digital Reference & Presentation Hall is through the frosted glass doors.'
    ]
  },
  {
    id: 'campus-ground',
    name: 'PICT Sports Arena & Basketball Court',
    building: 'Open Air Sports Complex',
    floor: 'Ground Level (East Wing)',
    capacity: '1,000+ Outdoors',
    facilities: ['Floodlit Basketball Court', 'Open Amphitheatre', 'Volleyball Court', 'First-Aid Bay'],
    keywords: ['ground', 'sports', 'court', 'basketball', 'open air', 'quadrangle', 'amphitheatre'],
    coordinates: { x: 500, y: 200, width: 130, height: 160 },
    landmark: 'Behind the Student Canteen and Gymkhana complex',
    directions: [
      'Walk past the Central Courtyard and take the path around the Cafeteria.',
      'Follow the paved walkway toward the floodlit grounds.',
      'Grandstands and player registration desk are on the western pavilion.'
    ]
  }
]

export default function CampusVenueMapModal({ event, club, isOpen, onClose }) {
  if (!isOpen) return null

  // Determine initial selected venue based on event.location
  const detectedVenue = useMemo(() => {
    if (!event?.location) return PICT_VENUES[0]
    const locLower = event.location.toLowerCase()
    const match = PICT_VENUES.find(v => 
      v.keywords.some(k => locLower.includes(k)) || 
      v.name.toLowerCase().includes(locLower) ||
      locLower.includes(v.building.toLowerCase())
    )
    return match || PICT_VENUES[0]
  }, [event?.location])

  const [selectedVenue, setSelectedVenue] = useState(detectedVenue)
  const [copiedDirections, setCopiedDirections] = useState(false)

  const handleCopyDirections = () => {
    const text = `📍 ${selectedVenue.name} - PICT Pune\n🏢 ${selectedVenue.building} (${selectedVenue.floor})\n🔍 Landmark: ${selectedVenue.landmark}\n\nDirections:\n${selectedVenue.directions.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nEvent: ${event?.title || 'ClubSync Event'}`
    navigator.clipboard.writeText(text)
    setCopiedDirections(true)
    setTimeout(() => setCopiedDirections(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-surface border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-border flex items-center justify-between bg-surface-dim/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Compass size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  PICT Pune Campus GPS
                </span>
                <span className="text-xs text-text-secondary">Survey No. 27, Dhankawadi</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-text mt-0.5">
                Campus Venue & Indoor Direction Navigator
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-dim hover:bg-surface-muted border border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Target Event Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Scheduled Event Venue</span>
              <div className="font-bold text-sm text-text">{event?.location || 'PICT Main Auditorium'}</div>
              <div className="text-xs text-text-secondary mt-0.5">
                Event: <span className="font-medium text-text">{event?.title}</span> • Host: <span className="font-medium text-text">{club?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles size={12} /> Matched: {selectedVenue.name.split('(')[0]}
              </span>
            </div>
          </div>

          {/* Interactive SVG Campus Layout Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-text">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                PICT Pune Schematic Map (Click any zone to navigate)
              </span>
              <span className="text-text-secondary text-[11px] font-normal">North ↑</span>
            </div>

            <div className="relative rounded-2xl border border-border bg-slate-900 overflow-hidden shadow-inner p-2">
              <svg viewBox="0 0 680 430" className="w-full h-auto select-none font-sans">
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="680" height="430" fill="#0f172a" />
                <rect width="680" height="430" fill="url(#grid)" />

                {/* Campus Perimeter Roadways */}
                <path d="M 40 400 L 40 50 L 640 50 L 640 400 Z" fill="none" stroke="#334155" strokeWidth="24" strokeLinejoin="round" />
                <path d="M 40 250 L 640 250" fill="none" stroke="#1e293b" strokeWidth="16" />

                {/* Main Gate Entry (South) */}
                <rect x="250" y="392" width="180" height="26" rx="6" fill="#6366f1" />
                <text x="340" y="409" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  🚪 PICT MAIN GATE (Pune-Satara Rd)
                </text>

                {/* Central Courtyard / Amphitheatre */}
                <circle cx="340" cy="250" r="32" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 2" />
                <text x="340" y="248" textAnchor="middle" fill="#c7d2fe" fontSize="9" fontWeight="bold">
                  Central
                </text>
                <text x="340" y="259" textAnchor="middle" fill="#c7d2fe" fontSize="8">
                  Quadrangle
                </text>

                {/* Canteen & Cafeteria */}
                <rect x="470" y="90" width="100" height="70" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="520" y="125" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                  PICT Cafeteria
                </text>
                <text x="520" y="138" textAnchor="middle" fill="#64748b" fontSize="8">
                  Student Hub
                </text>

                {/* Interactive Buildings */}
                {PICT_VENUES.map(v => {
                  const isSelected = selectedVenue.id === v.id
                  const isDetected = detectedVenue.id === v.id
                  return (
                    <g 
                      key={v.id} 
                      onClick={() => setSelectedVenue(v)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      <rect
                        x={v.coordinates.x}
                        y={v.coordinates.y}
                        width={v.coordinates.width}
                        height={v.coordinates.height}
                        rx="10"
                        fill={isSelected ? '#4f46e5' : isDetected ? '#312e81' : '#1e293b'}
                        stroke={isSelected ? '#a5b4fc' : isDetected ? '#818cf8' : '#334155'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-colors hover:fill-indigo-600"
                      />
                      {isSelected && (
                        <circle
                          cx={v.coordinates.x + v.coordinates.width / 2}
                          cy={v.coordinates.y - 10}
                          r="6"
                          fill="#f59e0b"
                          className="animate-bounce"
                        />
                      )}
                      <text
                        x={v.coordinates.x + v.coordinates.width / 2}
                        y={v.coordinates.y + v.coordinates.height / 2 - 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {v.name.split('(')[0]}
                      </text>
                      <text
                        x={v.coordinates.x + v.coordinates.width / 2}
                        y={v.coordinates.y + v.coordinates.height / 2 + 10}
                        textAnchor="middle"
                        fill={isSelected ? '#e0e7ff' : '#94a3b8'}
                        fontSize="8"
                        className="pointer-events-none"
                      >
                        {v.floor.split(',')[0]}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Quick Switcher Venue Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PICT_VENUES.map(v => {
              const isSelected = selectedVenue.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenue(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-surface-dim border border-border text-text-secondary hover:text-text'
                  }`}
                >
                  <Building size={13} />
                  {v.name.split('(')[0]}
                </button>
              )
            })}
          </div>

          {/* Selected Venue Deep Dive Card */}
          <div className="p-5 rounded-2xl bg-surface-dim border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{selectedVenue.building}</span>
                  <span className="text-xs text-text-secondary">•</span>
                  <span className="text-xs font-medium text-text-secondary">{selectedVenue.floor}</span>
                </div>
                <h3 className="text-lg font-bold text-text mt-0.5">{selectedVenue.name}</h3>
                <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-500 shrink-0" />
                  Landmark: {selectedVenue.landmark}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyDirections}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-surface border border-border text-xs font-semibold hover:border-primary/50 text-text transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copiedDirections ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Guide</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Pune+Institute+of+Computer+Technology+PICT+Pune"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Navigation size={14} />
                  <span>Google Maps GPS</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Facilities Badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-surface border border-border text-text flex items-center gap-1.5">
                <Users size={12} className="text-primary" /> Capacity: {selectedVenue.capacity}
              </span>
              {selectedVenue.facilities.map((fac, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border text-text-secondary flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-500" />
                  {fac}
                </span>
              ))}
            </div>

            {/* Step-by-Step Directions */}
            <div className="pt-3 border-t border-border/60">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Footprints size={14} className="text-primary" /> Walking Directions from Main Gate:
              </h4>
              <ol className="space-y-2 text-xs text-text-secondary">
                {selectedVenue.directions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-dim/40 flex items-center justify-between text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Info size={13} className="text-primary" />
            Official PICT Campus Infrastructure Directory · Pune, Maharashtra
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface border border-border font-semibold hover:bg-surface-muted text-text transition-colors"
          >
            Close Navigator
          </button>
        </div>
      </div>
    </div>
  )
}
