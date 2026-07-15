import {
  CalendarClock,
  ChartColumn,
  Compass,
  LayoutDashboard,
  MessageCircleHeart,
  Smile,
  UsersRound,
} from 'lucide-react'

export const buildNavItems = (isAdmin) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Chat', icon: MessageCircleHeart },
    { id: 'appointments', label: 'Appointments', icon: CalendarClock },
    { id: 'resources', label: 'Resource Hub', icon: Compass },
    { id: 'peer-support', label: 'Peer Support', icon: UsersRound },
    { id: 'mood', label: 'Mood Tracker', icon: Smile },
  ]

  if (isAdmin) {
    items.push({ id: 'admin', label: 'Admin', icon: ChartColumn })
  }

  return items
}
