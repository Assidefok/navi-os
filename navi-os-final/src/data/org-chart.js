// Org Chart data for Navi OS
// Add agents here - visible: false hides from chart

export const orgAgents = [
  {
    id: 'navi',
    name: 'Navi',
    role: 'Chief of Staff',
    type: 'agent',
    visible: true,
    icon: 'sparkles',
    color: '#a78bfa',
    level: 2,
    workspace: '/home/user/.openclaw/workspace',
    agentId: 'navi',
    emoji: '🧚',
  },
  {
    id: 'elom',
    name: 'ELOM',
    role: 'Chief Visionary Officer',
    type: 'chief',
    visible: true,
    icon: 'rocket',
    color: '#f97316',
    level: 3,
  },
  {
    id: 'warren',
    name: 'WARREN',
    role: 'Chief Quality Officer',
    type: 'chief',
    visible: true,
    icon: 'shield',
    color: '#22c55e',
    level: 3,
  },
  {
    id: 'jeff',
    name: 'JEFF',
    role: 'Chief Operations Officer',
    type: 'chief',
    visible: true,
    icon: 'zap',
    color: '#3b82f6',
    level: 3,
  },
  {
    id: 'sam',
    name: 'SAM',
    role: 'Chief AI Officer',
    type: 'chief',
    visible: true,
    icon: 'brain',
    color: '#ec4899',
    level: 3,
  },
]

export const orgHumans = [
  {
    id: 'aleix',
    name: 'Aleix',
    role: 'Human',
    type: 'human',
    visible: true,
    icon: 'user',
    color: '#8b5cf6',
    level: 1,
  },
]

// Combined and filtered
export const getVisibleOrgMembers = () => {
  return [...orgHumans, ...orgAgents].filter(m => m.visible)
}
