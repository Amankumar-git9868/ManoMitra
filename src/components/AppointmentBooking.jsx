import { useState, useEffect } from 'react'
import { CalendarClock, CheckCircle2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'

export default function AppointmentBooking() {
  const { authFetch } = useAuth()
  const [step, setStep] = useState(1) // 1: Specialist, 2: Time & Details, 3: Confirm
  const [appointments, setAppointments] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    specialist: 'Clinical Psychologist',
    sessionType: 'Video Session',
    date: '',
    time: '',
    reason: '',
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await authFetch('/appointments')
      const payload = await res.json()
      if (res.ok && payload.success) {
        setAppointments(payload.data)
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
    } finally {
      setLoadingList(false)
    }
  }

  const handleNext = () => {
    if (step === 2) {
      if (!form.date || !form.time) {
        setError('Please select both date and time.')
        return
      }
    }
    setError('')
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      const res = await authFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to book appointment.')
      }
      setSuccess('Your appointment has been successfully booked.')
      setAppointments([payload.data, ...appointments])
      setStep(4) // Success step
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      specialist: 'Clinical Psychologist',
      sessionType: 'Video Session',
      date: '',
      time: '',
      reason: '',
    })
    setStep(1)
    setSuccess('')
    setError('')
  }

  const handleCancel = async (id) => {
    try {
      const res = await authFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
      const payload = await res.json()
      if (res.ok && payload.success) {
        setAppointments(appointments.map(a => a._id === id ? { ...a, status: 'cancelled' } : a))
      }
    } catch (err) {
      console.error('Failed to cancel:', err)
    }
  }

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Book an Appointment</h3>
          <CalendarClock size={24} className="text-emerald-600" />
        </div>

        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="font-medium text-slate-800 mb-3">Step 1: Choose a Specialist</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {['Clinical Psychologist', 'Wellness Coach', 'Therapist'].map((spec) => (
                <button
                  key={spec}
                  onClick={() => setForm({ ...form, specialist: spec })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.specialist === spec 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{spec}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {spec === 'Clinical Psychologist' && 'For deep emotional challenges'}
                    {spec === 'Wellness Coach' && 'For goal setting & daily routines'}
                    {spec === 'Therapist' && 'For guided conversation & coping'}
                  </p>
                </button>
              ))}
            </div>
            
            <h4 className="font-medium text-slate-800 mt-6 mb-3">Session Type</h4>
            <div className="flex flex-wrap gap-3">
              {['Video Session', 'In-Person', 'Phone Call'].map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, sessionType: type })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    form.sessionType === type 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={18} />
              </button>
              <h4 className="font-medium text-slate-800">Step 2: Date & Details</h4>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Select Date</span>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Select Time</span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>
              <div>
                <label className="block h-full">
                  <span className="block text-sm font-medium text-slate-700 mb-1">What would you like to discuss? (Optional)</span>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Briefly describe what's on your mind..."
                    className="w-full h-[116px] rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition"
              >
                Review <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={18} />
              </button>
              <h4 className="font-medium text-slate-800">Step 3: Confirm Booking</h4>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <dl className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <dt className="text-slate-500">Specialist</dt>
                  <dd className="font-semibold text-slate-900 mt-1">{form.specialist}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Session Type</dt>
                  <dd className="font-semibold text-slate-900 mt-1">{form.sessionType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Date</dt>
                  <dd className="font-semibold text-slate-900 mt-1">{new Date(form.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Time</dt>
                  <dd className="font-semibold text-slate-900 mt-1">{form.time}</dd>
                </div>
                {form.reason && (
                  <div className="col-span-2 mt-2 pt-4 border-t border-slate-200">
                    <dt className="text-slate-500">Notes</dt>
                    <dd className="text-slate-800 mt-1">{form.reason}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10 animate-in zoom-in-95 fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h4>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Your session is scheduled for {new Date(form.date).toLocaleDateString()} at {form.time}.
            </p>
            <button
              onClick={resetForm}
              className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition"
            >
              Book Another
            </button>
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-slate-900">Your Appointments</h3>
        {loadingList ? (
          <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : appointments.length === 0 ? (
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center text-slate-500">
            No appointments found.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((slot) => (
              <div
                key={slot._id}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  slot.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{slot.specialist}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      slot.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{slot.sessionType} • {slot.date} at {slot.time}</p>
                  {slot.reason && <p className="text-sm text-slate-600 mt-1 italic">"{slot.reason}"</p>}
                </div>
                {slot.status === 'booked' && (
                  <button
                    onClick={() => handleCancel(slot._id)}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition self-start sm:self-auto"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
