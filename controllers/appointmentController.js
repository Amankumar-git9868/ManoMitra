import { Appointment } from '../models/Appointment.js'

export const createAppointment = async (req, res, next) => {
  try {
    const { specialist, sessionType, date, time, reason } = req.body

    const appointment = await Appointment.create({
      user: req.user.id,
      specialist,
      sessionType,
      date,
      time,
      reason,
    })

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}

export const getUserAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json({
      success: true,
      data: appointments,
    })
  } catch (error) {
    next(error)
  }
}

export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'cancelled' },
      { new: true }
    )

    if (!appointment) {
      const error = new Error('Appointment not found.')
      error.statusCode = 404
      throw error
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled.',
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}
