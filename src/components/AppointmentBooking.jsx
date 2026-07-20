import { useState, useEffect } from 'react'
import { CalendarClock, CheckCircle2, ChevronRight, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'
import { useAuth } from '../auth/authContext.js'

const SPECIALISTS_INFO = [
  {
    name: 'Dr. Ananya Sen',
    role: 'Clinical Psychologist',
    initials: 'AS',
    bg: 'from-emerald-400 to-teal-500',
    tags: ['Anxiety', 'CBT', 'Grief'],
    desc: 'For deep emotional challenges & structured clinical therapy.'
  },
  {
    name: 'Rohan Sharma',
    role: 'Wellness Coach',
    initials: 'RS',
    bg: 'from-amber-400 to-orange-500',
    tags: ['Routines', 'Habits', 'Stress'],
    desc: 'For building positive daily habits, stress management, and routines.'
  },
  {
    name: 'Sneha Kapoor',
    role: 'Therapist',
    initials: 'SK',
    bg: 'from-purple-400 to-indigo-500',
    tags: ['Self-Esteem', 'Relationship'],
    desc: 'For warm, supportive conversations and custom daily coping strategies.'
  }
]

export default function AppointmentBooking() {
  const { authFetch } = useAuth()
  const [step, setStep] = useState(1) // 1: Specialist, 2: Time & Details, 3: Confirm
  const [appointments, setAppointments] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    specialist: 'Dr. Ananya Sen (Clinical Psychologist)',
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
      specialist: 'Dr. Ananya Sen (Clinical Psychologist)',
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
      
      {/* Booking Form Card */}
      <article className="card p-6 shadow-sm">
        
        {/* Wizard Header Progress Bar */}
        <div className="mb-8 border-b border-[#E2E8E4]/60 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-extrabold text-[#1C2B2A]">Schedule a Session</h3>
              <p className="text-xs text-slate-500">Free &amp; private 1-on-1 mental support</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EDF4F0] flex items-center justify-center text-[#5C8D72]">
              <CalendarClock size={20} />
            </div>
          </div>
          
          {/* Step Progress Circles */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { num: 1, label: 'Specialist' },
              { num: 2, label: 'Date & Time' },
              { num: 3, label: 'Confirm' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-[#5C8D72] text-white ring-4 ring-[#EDF4F0]'
                    : step > s.num
                      ? 'bg-[#EDF4F0] text-[#5C8D72]'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className={`text-xs font-semibold ${step === s.num ? 'text-[#1C2B2A]' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">{error}</div>}

        {/* Step 1: Specialist Team-Member Selection */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h4 className="font-display font-bold text-slate-800 text-sm mb-3">Choose your Wellness Specialist:</h4>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {SPECIALISTS_INFO.map((spec) => {
                const combinedName = `${spec.name} (${spec.role})`
                const isSelected = form.specialist === combinedName
                return (
                  <button
                    key={spec.name}
                    type="button"
                    onClick={() => setForm({ ...form, specialist: combinedName })}
                    className={`flex flex-col text-left rounded-xl border p-5 transition-all ${
                      isSelected
                        ? 'border-[#5C8D72] bg-[#EDF4F0]/30 ring-1 ring-[#5C8D72] shadow-sm'
                        : 'border-slate-200 hover:border-[#5C8D72]/50 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Colored Avatar Box */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${spec.bg} text-white font-display text-sm font-bold flex items-center justify-center`}>
                        {spec.initials}
                      </div>
                      <div>
                        <p className="font-display font-bold text-[#1C2B2A] text-sm">{spec.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{spec.role}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                      {spec.desc}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-auto">
                      {spec.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
            
            <h4 className="font-display font-bold text-slate-800 text-sm mt-6 mb-3">Session Mode</h4>
            <div className="flex flex-wrap gap-3">
              {['Video Session', 'In-Person', 'Phone Call'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, sessionType: type })}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all ${
                    form.sessionType === type 
                      ? 'border-[#5C8D72] bg-[#EDF4F0] text-[#3f6b53]' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary py-2.5 px-6"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date, Time & Reason */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <h4 className="font-display font-bold text-slate-800 text-sm">Step 2: Date &amp; Details</h4>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Date</span>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#5C8D72] focus:ring-1 focus:ring-[#5C8D72]"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Time</span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#5C8D72] focus:ring-1 focus:ring-[#5C8D72]"
                  />
                </label>
              </div>
              <div>
                <label className="block h-full">
                  <span className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">What's on your mind? (Optional)</span>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Briefly describe what challenges or topics you'd like to share..."
                    className="w-full h-[116px] rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none resize-none focus:border-[#5C8D72] focus:ring-1 focus:ring-[#5C8D72]"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="btn-outline py-2.5 px-6"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary py-2.5 px-6"
              >
                Review <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Confirm (No Pricing) */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <h4 className="font-display font-bold text-slate-800 text-sm">Step 3: Confirm Booking</h4>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Specialist</dt>
                  <dd className="font-bold text-slate-900 mt-1">{form.specialist}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Session Mode</dt>
                  <dd className="font-bold text-slate-900 mt-1">{form.sessionType}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Date</dt>
                  <dd className="font-bold text-slate-900 mt-1">{new Date(form.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Time</dt>
                  <dd className="font-bold text-slate-900 mt-1">{form.time}</dd>
                </div>
                {form.reason && (
                  <div className="col-span-1 sm:col-span-2 mt-2 pt-4 border-t border-slate-200">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Notes</dt>
                    <dd className="text-slate-700 mt-1 italic">"{form.reason}"</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="btn-outline py-2.5 px-6"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success message */}
        {step === 4 && (
          <div className="text-center py-10 animate-in zoom-in-95 fade-in">
            <div className="w-16 h-16 bg-[#EDF4F0] text-[#5C8D72] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B5D4C3]">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-display text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h4>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto text-sm">
              Your free session is scheduled with {form.specialist.split(' (')[0]} for {new Date(form.date).toLocaleDateString()} at {form.time}.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline py-2.5 px-6"
            >
              Book Another Session
            </button>
          </div>
        )}
      </article>

      {/* Appointment List Card */}
      <article className="card p-6 shadow-sm">
        <h3 className="mb-6 font-display text-lg font-bold text-slate-900">Your Appointments</h3>
        {loadingList ? (
          <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : appointments.length === 0 ? (
          <div className="rounded-xl bg-[#EDF4F0]/40 border border-dashed border-[#B5D4C3] p-8 text-center text-slate-500 text-sm">
            No appointments scheduled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((slot) => (
              <div
                key={slot._id}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                  slot.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-[#E2E8E4]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800 text-sm">{slot.specialist}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      slot.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-[#EDF4F0] text-[#3f6b53]'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{slot.sessionType} • {slot.date} at {slot.time}</p>
                  {slot.reason && <p className="text-xs text-slate-600 mt-1 italic">"{slot.reason}"</p>}
                </div>
                {slot.status === 'booked' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(slot._id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg transition self-start sm:self-auto"
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
