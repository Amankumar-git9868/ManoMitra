import { Group } from '../models/Group.js'

const initialGroups = [
  {
    name: 'Night Owls Circle',
    description: 'For those struggling with sleep anxiety, late-night overthinking, or insomnia.',
    category: 'Sleep',
  },
  {
    name: 'Students Support Group',
    description: 'A place to discuss exam stress, academic pressure, and balancing life and studies.',
    category: 'Stress',
  },
  {
    name: 'Anxiety Management',
    description: 'Share coping strategies, grounding techniques, and daily wins against anxiety.',
    category: 'Anxiety',
  },
]

export const seedGroups = async () => {
  try {
    for (const group of initialGroups) {
      const existing = await Group.findOne({ name: group.name })
      if (!existing) {
        await Group.create({ ...group, members: [] })
        console.log(`Group created: ${group.name}`)
      }
    }
  } catch (error) {
    console.error('Failed to seed groups:', error)
  }
}
