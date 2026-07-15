import { Router } from 'express'
import {
  createAppointment,
  getUserAppointments,
  cancelAppointment,
} from '../controllers/appointmentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/appointments', protect, createAppointment)
router.get('/appointments', protect, getUserAppointments)
router.patch('/appointments/:id/cancel', protect, cancelAppointment)

export default router
