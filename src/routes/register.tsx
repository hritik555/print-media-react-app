import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { decodeJwt } from '../lib/auth'

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
})

const EXISTING_WHATSAPP_NUMBERS = [
  '9876543210',
  '9812345678',
  '9988765432',
  '9900123456',
  '9765432100',
  '9888877766',
  '9123456789',
  '9555544433'
]

async function submitSignupRequest(
  formData: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  // Validate duplicate WhatsApp number
  if (EXISTING_WHATSAPP_NUMBERS.includes(formData.whatsapp)) {
    return { success: false, error: 'An account with this WhatsApp number already exists. Please choose a different number or login.' }
  }

  if (API_BASE_URL) {
    try {
      // 1. Verify if WhatsApp mobile exists
      const checkRes = await fetch(`${API_BASE_URL}/api/auth/check-mobile?mobile=${encodeURIComponent(formData.whatsapp)}`)
      if (checkRes.ok) {
        const data = await checkRes.json()
        if (data && data.exists) {
          return { success: false, error: 'An account with this WhatsApp number already exists. Please choose a different number or login.' }
        }
      }

      // Map fields to match Spring Boot RegisterRequest DTO (whatsapp -> whatsappNo)
      const apiPayload = {
        businessName: formData.businessName,
        yourName: formData.yourName,
        whatsappNo: formData.whatsapp,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        pinCode: formData.pinCode,
        gstNumber: formData.gstNumber,
        fullAddress: formData.fullAddress,
        referenceCode: formData.referenceCode
      }

      // 2. Submit B2B registration request
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      })
      if (res.ok) {
        return { success: true }
      } else {
        const errData = await res.json().catch(() => null)
        const errMsg = errData?.error || errData?.message || await res.text() || 'Failed to submit B2B registration application.'
        return { success: false, error: errMsg }
      }
    } catch (e) {
      return { success: false, error: 'Failed to connect to backend server for B2B registration.' }
    }
  }

  // Simulation using Local Storage for dynamic flow in the client
  const existing = JSON.parse(localStorage.getItem('printpro_pending_requests') || '[]')
  
  // Check if WhatsApp is already in the pending queue
  const isPending = existing.some((req: any) => req.whatsapp === formData.whatsapp || req.whatsappNo === formData.whatsapp)
  if (isPending) {
    return { success: false, error: 'An application with this WhatsApp number is already pending verification.' }
  }

  const newRequest = {
    id: 'REQ-' + Date.now(),
    requestId: 'REQ-' + Date.now(),
    ...formData,
    whatsappNo: formData.whatsapp,
    submittedAt: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, ' '),
    createdAt: new Date().toISOString()
  }
  existing.push(newRequest)
  localStorage.setItem('printpro_pending_requests', JSON.stringify(existing))

  return { success: true }
}

function getRoleHome(roles: string[]): string {
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('staff')) return '/staff'
  return '/partner'
}

/* ── Terms & Conditions Content ─────────────────────────── */

const TERMS_CONDITIONS = [
  {
    important: true,
    text: 'Printers Club of India Limited is a B2B Company, which prints orders from Printing Press only, and these orders shall not contain Duplicate / Fake, Prohibited Content or without the permission or related organisation, will be sole responsibility of Printing Press / Channel Partner only. And if any Printing Agency Knowingly or unknowingly orders duplicate / Fake or prohibited content then its membership will be discontinued for lifetime.',
  },
  {
    important: true,
    text: 'Same color will never match with any printing previously done (whether it is from us or from elsewhere, whether it is digital or offset), if you want the same color printing in future, then get job profile saved with us, extra charges will be payable against job profiling.',
  },
  {
    important: true,
    text: "I accept the Printers Club of India Limited's responsibility ceases the moment the goods leave company's godown.",
  },
  {
    important: true,
    text: 'In all products with club printing (like visiting cards, ATM pouches, letter heads, envelopes etc.), if there is a printing mistake in 5 to 50% of the sheets / cards, then only the same proportion can be discounted. And if there is a printing mistake in more than 50% of the sheets only then the order will be reprinted.',
  },
  {
    important: false,
    text: 'If your order has been reprinted because of printing mistake, the transportation charges will be paid by you.',
  },
  {
    important: false,
    text: 'I agree that in case of any dispute / lost / delayed receipt etc. in the transaction of the product, the maximum liability of "Printers Club of India Limited" will be only up to the rate of the disputed product.',
  },
  {
    important: false,
    text: 'Printers Club of India Limited has all rights to cancel / change any membership / channel partner code.',
  },
  {
    important: false,
    text: 'The company will be responsible only for the payment made in the bank account of Printers Club of India.',
  },
  {
    important: false,
    text: 'I hereby provide "No Objection" to "Printers Club of India Limited" for sending service/transactional related sms to me and my customers too.',
  },
  {
    important: false,
    text: 'All the legal matters are subject to Jaipur Jurisdiction Only.',
  },
]

/* ── Country List ───────────────────────────────────────── */

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Singapore', 'UAE',
  'Saudi Arabia', 'Nepal', 'Bangladesh', 'Sri Lanka', 'South Africa',
  'Brazil', 'Mexico', 'Indonesia', 'Malaysia', 'Thailand',
]

/* ── Terms & Conditions Modal Component ─────────────────── */

function TermsModal({
  open,
  onClose,
  onAccept,
}: {
  open: boolean
  onClose: () => void
  onAccept: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="terms-modal-overlay">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" id="terms-modal">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center">Terms &amp; Conditions</h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Language:</span>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" id="terms-language-select">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
            id="terms-close-btn"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <ol className="space-y-5">
            {TERMS_CONDITIONS.map((term, idx) => (
              <li key={idx} className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900 mr-1">{idx + 1}.</span>
                {term.important && (
                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-extrabold rounded mr-2 uppercase">
                    Important :
                  </span>
                )}
                {term.important ? (
                  <span className="font-semibold">{term.text}</span>
                ) : (
                  <span>{term.text}</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex-shrink-0 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            id="terms-decline-btn"
          >
            Close
          </button>
          <button
            onClick={onAccept}
            type="button"
            className="px-6 py-2.5 text-sm font-bold text-white bg-purple-700 hover:bg-purple-600 rounded-xl shadow-md hover:shadow-lg transition-all"
            id="terms-accept-btn"
          >
            I Accept Terms &amp; Conditions
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── SVG Icon Helpers ───────────────────────────────────── */

function IconBuilding() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function IconHash() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
    </svg>
  )
}

function IconAddress() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  )
}

/* ── Registration Form Component ────────────────────────── */

function RegisterComponent() {
  const navigate = useNavigate()

  // Form fields
  const [businessName, setBusinessName] = useState('')
  const [yourName, setYourName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [country, setCountry] = useState('India')
  const [pinCode, setPinCode] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [fullAddress, setFullAddress] = useState('')

  // Terms & conditions
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleTermsAcceptFromModal = () => {
    setTermsAccepted(true)
    setTermsModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!businessName.trim()) {
      setError('Business / Firm Name is required.')
      return
    }
    if (!yourName.trim()) {
      setError('Your Name is required.')
      return
    }
    if (!whatsapp.trim() || whatsapp.length < 10) {
      setError('A valid WhatsApp number is required (at least 10 digits).')
      return
    }
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!country) {
      setError('Please select your country.')
      return
    }
    if (!pinCode.trim()) {
      setError('Pin code is required.')
      return
    }
    if (!fullAddress.trim()) {
      setError('Full address is required.')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to continue.')
      return
    }

    setSubmitting(true)
    try {
      const formData = {
        businessName: businessName.trim(),
        yourName: yourName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        password,
        referenceCode: referenceCode.trim(),
        country,
        pinCode: pinCode.trim(),
        gstNumber: gstNumber.trim(),
        fullAddress: fullAddress.trim(),
      }
      const res = await submitSignupRequest(formData)
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error || 'Failed to complete registration. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Registration Form ─────────────────────── */
  return (
    <div className="min-h-screen bg-[#0d091e] relative overflow-hidden font-sans flex flex-col justify-between">
      {/* Premium background mesh and decorative graphics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf607_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf607_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#4f46e50e_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#c084fc0e_0%,transparent_50%)] pointer-events-none" />
      
      {/* Floating blur shapes for rich aesthetics */}
      <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-purple-700/20 to-indigo-700/20 blur-[130px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-fuchsia-700/15 to-violet-700/15 blur-[130px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
      <div className="absolute top-[25%] right-[5%] w-[35vw] h-[35vw] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Header */}
      <div className="relative z-10 text-center pt-16 pb-8 px-4">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-indigo-200 mb-3 tracking-tight animate-fadeIn">
          Join Our Printer Network
        </h1>
        <p className="text-purple-200/80 text-sm sm:text-base max-w-xl mx-auto font-medium">
          Access exclusive wholesale benefits and grow your business with Printers Club of India
        </p>
      </div>

      {/* Form Card */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-20 w-full">
        <div className="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-purple-100/10 overflow-hidden transform transition-all duration-300 hover:shadow-purple-950/20">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-center gap-3 mb-1">
              <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Printer ID Registration</h2>
            </div>
            <div className="border-b-2 border-purple-600/80 mb-5" />

            {/* Info Note */}
            <div className="bg-purple-50/50 border border-purple-100/80 rounded-xl px-5 py-3.5 flex items-start gap-3">
              <span className="text-purple-600 text-lg mt-0.5">ℹ</span>
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-purple-950">Note:</span> You are applying for a{' '}
                <strong className="text-purple-700">Printer ID</strong> for exclusive wholesale benefits. Requests are approved after
                internal verification (1–2 working days).
              </p>
            </div>
          </div>

          {/* Success Overlay */}
          {success && (
            <div className="absolute inset-0 bg-white/98 rounded-3xl z-20 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mb-6 text-5xl animate-bounce">
                ✓
              </div>
              <h3 className="text-2xl font-extrabold text-purple-950 mb-3">Application Submitted!</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
                Your B2B Printer ID application has been sent for Admin verification. 
                We will contact you via WhatsApp or Email once your credentials are approved (typically 1-2 working days).
              </p>
              <button
                onClick={() => navigate({ to: '/' })}
                className="px-6 py-2.5 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-md"
              >
                Back to Home
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-8 pb-8">
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium" id="register-error">
                {error}
              </div>
            )}

            {/* ── Section: Basic Info ────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-8">
              {/* Business / Firm Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-business">
                  Business / Firm Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconBuilding /></span>
                  <input
                    id="reg-business"
                    type="text"
                    required
                    disabled={submitting}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Your business name"
                  />
                </div>
              </div>

              {/* Your Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-name">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconUser /></span>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    disabled={submitting}
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Full name"
                  />
                </div>
              </div>

              {/* WhatsApp No. */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-whatsapp">
                  WhatsApp No. <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconPhone /></span>
                  <input
                    id="reg-whatsapp"
                    type="tel"
                    required
                    disabled={submitting}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-red-400 mt-1 font-medium">Do not include 0 or country code</p>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconMail /></span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* ── Section: Security & Reference ──────── */}
            <fieldset className="mb-8">
              <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span className="flex-1 h-px bg-gray-200" />
                <span>Security &amp; Reference</span>
                <span className="flex-1 h-px bg-gray-200" />
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {/* Create Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-password">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconLock /></span>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      disabled={submitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                {/* Reference Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-refcode">
                    Reference Code <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconBadge /></span>
                    <input
                      id="reg-refcode"
                      type="text"
                      disabled={submitting}
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="Employee Code"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* ── Section: Location Details ──────────── */}
            <fieldset className="mb-8">
              <legend className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span className="flex-1 h-px bg-gray-200" />
                <span>Location Details</span>
                <span className="flex-1 h-px bg-gray-200" />
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {/* Country */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-country">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconGlobe /></span>
                    <select
                      id="reg-country"
                      required
                      disabled={submitting}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors appearance-none"
                    >
                      <option value="">--Select Country--</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Pin Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-pincode">
                    Pin Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconHash /></span>
                    <input
                      id="reg-pincode"
                      type="text"
                      required
                      disabled={submitting}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="6-digit pin code"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* GST / Tax Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-gst">
                    GST / Tax Number <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <input
                    id="reg-gst"
                    type="text"
                    disabled={submitting}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="e.g. 27AABCS1234B1Z5"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Full Address — full width */}
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2" htmlFor="reg-address">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3"><IconAddress /></span>
                  <textarea
                    id="reg-address"
                    required
                    disabled={submitting}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-y"
                    placeholder="Street address, city, state"
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Terms & Conditions ─────────────────── */}
            <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 w-5 h-5 text-purple-700 border-gray-300 rounded focus:ring-purple-500 accent-purple-700 cursor-pointer"
                />
                <label htmlFor="reg-terms" className="text-sm text-gray-700 cursor-pointer">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-purple-700 font-semibold underline underline-offset-2 hover:text-purple-900 transition-colors"
                    id="open-terms-btn"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  of Printers Club of India Limited. <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            {/* ── Submit Button ──────────────────────── */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              id="register-submit-btn"
            >
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              By registering, you agree to our Privacy Policy and Terms of Service.
            </p>
          </form>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={handleTermsAcceptFromModal}
      />
    </div>
  )
}
