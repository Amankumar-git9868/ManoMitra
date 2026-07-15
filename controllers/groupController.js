import { Group } from '../models/Group.js'
import { GroupMessage } from '../models/GroupMessage.js'
import { detectSevereDistress } from '../services/chatbotService.js'

export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find().lean()
    const userId = req.user.id.toString()
    
    // Add joined flag
    const formatted = groups.map(g => ({
      ...g,
      joined: g.members.some(m => m.toString() === userId)
    }))

    res.status(200).json({ success: true, data: formatted })
  } catch (error) {
    next(error)
  }
}

export const toggleJoinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) {
      const error = new Error('Group not found')
      error.statusCode = 404
      throw error
    }

    const userId = req.user.id
    const isMember = group.members.some(m => m.toString() === userId.toString())

    if (isMember) {
      group.members = group.members.filter(m => m.toString() !== userId.toString())
    } else {
      group.members.push(userId)
    }
    
    await group.save()

    res.status(200).json({ success: true, data: { joined: !isMember } })
  } catch (error) {
    next(error)
  }
}

export const getGroupMessages = async (req, res, next) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: 1 })
      .limit(50)

    res.status(200).json({ success: true, data: messages })
  } catch (error) {
    next(error)
  }
}

export const postGroupMessage = async (req, res, next) => {
  try {
    const { text } = req.body
    
    const isDistress = detectSevereDistress(text)
    
    const message = await GroupMessage.create({
      group: req.params.id,
      user: req.user.id,
      text,
      distressFlagged: isDistress
    })

    const populatedMessage = await message.populate('user', 'name')

    res.status(201).json({ success: true, data: populatedMessage })
  } catch (error) {
    next(error)
  }
}

export const createGroup = async (req, res, next) => {
  try {
    // Basic admin check (could also use requireAdmin middleware)
    if (req.user.role !== 'admin') {
      const error = new Error('Unauthorized')
      error.statusCode = 403
      throw error
    }

    const { name, description, category } = req.body
    const group = await Group.create({ name, description, category, members: [] })

    res.status(201).json({ success: true, data: group })
  } catch (error) {
    next(error)
  }
}
