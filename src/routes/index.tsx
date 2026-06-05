import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  login,
  AuthError,
  MissingIdentityError,
  useIdentity,
} from '../lib/identity-context'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function getRoleHome(roles: string[]): string {
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('staff')) return '/staff'
  return '/partner'
}

function LandingPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  const [enquiryData, setEnquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
  })
  const [enquirySent, setEnquirySent] = useState(false)

  // Redirect already-logged-in users
  useEffect(() => {
    if (ready && user) {
      navigate({ to: getRoleHome(user.roles ?? []) })
    }
  }, [ready, user, navigate])

  // Invite validation is now handled strictly on the dedicated /register route

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate({ to: getRoleHome(u.roles ?? []) })
    } catch (err) {
      if (err instanceof MissingIdentityError) {
        setLoginError('Authentication service not available. Please try again later.')
      } else if (err instanceof AuthError) {
        if (err.status === 401) setLoginError('Invalid email or password. Please try again.')
        else if (err.status === 422) setLoginError('Invalid email or password format.')
        else setLoginError(err.message || 'Login failed. Please try again.')
      } else {
        setLoginError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    // In production this posts to the Java Spring Boot backend
    // For now we simulate success
    await new Promise((r) => setTimeout(r, 800))
    setEnquirySent(true)
    setEnquiryData({ name: '', email: '', phone: '', company: '', service: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PrintPro</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#services" className="hover:text-purple-700 transition-colors">Services</a>
            <a href="#about" className="hover:text-purple-700 transition-colors">About</a>
            <a href="#portfolio" className="hover:text-purple-700 transition-colors">Portfolio</a>
            <a href="#enquiry" className="hover:text-purple-700 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/register' })}
              className="px-4 py-2 border border-purple-700 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Create Account
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.3) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.3) 2px, transparent 0)', backgroundSize: '100px 100px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-semibold rounded-full mb-4 uppercase tracking-widest">
              India's Premium Print Partner
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Excellence in<br />
              <span className="text-yellow-400">Print Media</span><br />
              Publications
            </h1>
            <p className="text-lg md:text-xl text-purple-100 mb-8 leading-relaxed">
              From high-volume commercial printing to bespoke luxury stationery — we deliver precision,
              colour accuracy, and on-time delivery across India. Trusted by 500+ brands.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#enquiry"
                className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Get a Free Quote
              </a>
              <a
                href="#services"
                className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Our Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="bg-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Projects Delivered', value: '50,000+' },
            { label: 'Happy Clients', value: '500+' },
            { label: 'Cities Served', value: '30+' },
            { label: 'Years of Experience', value: '18+' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-yellow-400">{s.value}</div>
              <div className="text-sm text-purple-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER SECTION ────────────────────────────────── */}
      <div className="ticker-section">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={index} className="ticker-item">
              <span className="t-dot">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full mb-4 uppercase tracking-widest">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              End-to-End <span className="text-purple-700">Print Solutions</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From single-sheet digital printouts to full-run book publishing — we do it all with precision.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <div
                key={s.title}
                className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                {/* Accent Top Line */}
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-purple-500 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors duration-300">
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-300">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <span className="text-purple-700 font-semibold text-sm uppercase tracking-widest">About Us</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-6">
              Crafting <span className="text-purple-700">Stories</span> Through Print
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              PrintPro was founded in 2007 with a single offset press and a vision to redefine print quality in India.
              Today we operate 12 state-of-the-art digital and offset presses with ISO 9001:2015 certification.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our partnerships with leading paper mills and ink manufacturers ensure we deliver consistent,
              vibrant, and durable print materials — from 250 GSM business cards to large-format
              exhibition banners and saddle-stitched magazines.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'ISO 9001:2015 Certified', icon: '✅' },
                { label: 'On-Time Delivery', icon: '🚚' },
                { label: 'Eco-Friendly Inks', icon: '🌿' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>{b.icon}</span> {b.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {portfolioItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl overflow-hidden aspect-square flex items-end p-4"
                style={{ background: item.bg }}
              >
                <span className="text-white text-xs font-semibold bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ───────────────────────────────────────── */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Featured <span className="text-purple-700">Work</span>
            </h2>
            <p className="text-gray-500 text-lg">A glimpse of what we produce for our clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredWork.map((w) => (
              <div key={w.title} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="h-48 flex items-center justify-center" style={{ background: w.bg }}>
                  <span className="text-5xl">{w.icon}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-1">{w.title}</h3>
                  <p className="text-gray-500 text-sm">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────── */}
      <section className="py-20 bg-[#f8faff] border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-12 h-1 bg-gradient-to-r from-rose-500 via-[#8b5cf6] to-blue-500 mx-auto mb-6 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Why Do Printers <span className="text-purple-700">Choose Us?</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
              The reasons thousands of printing professionals trust Printers Club as their growth partner
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsData.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.025)] hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 border border-gray-50 flex flex-col items-center text-center group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 text-white transition-transform duration-300 group-hover:scale-110 ${item.bgColor}`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENQUIRY FORM ────────────────────────────────────── */}
      <section id="enquiry" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Send an <span className="text-purple-700">Enquiry</span>
            </h2>
            <p className="text-gray-500">Tell us about your project and we'll get back within 24 hours.</p>
          </div>

          {enquirySent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Enquiry Received!</h3>
              <p className="text-green-700">Our team will contact you within 24 hours.</p>
              <button
                onClick={() => setEnquirySent(false)}
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleEnquiry}
              className="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={enquiryData.name}
                    onChange={(e) => setEnquiryData({ ...enquiryData, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={enquiryData.email}
                    onChange={(e) => setEnquiryData({ ...enquiryData, email: e.target.value })}
                    placeholder="rahul@company.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={enquiryData.phone}
                    onChange={(e) => setEnquiryData({ ...enquiryData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={enquiryData.company}
                    onChange={(e) => setEnquiryData({ ...enquiryData, company: e.target.value })}
                    placeholder="Your Company Ltd."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Required *</label>
                <select
                  required
                  value={enquiryData.service}
                  onChange={(e) => setEnquiryData({ ...enquiryData, service: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s.title} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message / Project Details *</label>
                <textarea
                  required
                  rows={4}
                  value={enquiryData.message}
                  onChange={(e) => setEnquiryData({ ...enquiryData, message: e.target.value })}
                  placeholder="Describe your project requirements, quantity, timeline, etc."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Send Enquiry
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PP</span>
                </div>
                <span className="text-white font-bold">PrintPro</span>
              </div>
              <p className="text-sm leading-relaxed">
                India's trusted print media publication partner since 2007.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-sm">
                {services.slice(0, 4).map((s) => (
                  <li key={s.title}>{s.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Press</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>📍 Mumbai, India</li>
                <li>📞 +91 22 1234 5678</li>
                <li>✉️ hello@printpro.in</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            © {new Date().getFullYear()} PrintPro Publications Pvt. Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ─────────────────────────────────────── */}
      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-purple-700 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">PP</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your PrintPro account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                <input
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Protected by custom JWT security · Role-based access control
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const services = [
  { icon: '🖨️', title: 'Digital Color Print', desc: 'Up to 51 inch prints with paper weights up to 350 GSM. Vivid, sharp, and professionally finished.' },
  { icon: '📚', title: 'Book Binding', desc: 'Spiral, wire, glue binding, hard binding, wiro, and magazine binding options for all volumes.' },
  { icon: '✂️', title: 'Cutting & Finishing', desc: 'Half cut, die cut, round corner, tag hole, hard lamination — precision finishing at competitive rates.' },
  { icon: '🤝', title: 'Dealer Network', desc: 'Join our growing regional dealer network. Earn referral points and get priority order processing.' },
  { icon: '⚙️', title: 'Machine Sales', desc: 'Buy and sell premium digital printing machines with full expert consultation and after-sales support.' },
  { icon: '✨', title: 'Metallic & Specialty', desc: 'Metallic gumming, metallic sheets, milky sheets, avery gumming and specialty paper finishes.' },
]

const portfolioItems = [
  { label: 'Corporate Catalogue', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Magazine Layout', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Packaging Design', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Exhibition Banners', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
]

const featuredWork = [
  { icon: '📰', title: 'TechVision Monthly', desc: 'A 48-page technology magazine printed on 100 GSM Art Paper with gloss lamination.', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { icon: '🛍️', title: 'RetailMart Catalogue', desc: '200-page seasonal product catalogue delivered in 72 hours for a national retail chain.', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { icon: '🏢', title: 'Summit Corporate Kit', desc: 'Premium conference stationery kit with foiled business cards and custom folders.', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
]

const whyChooseUsData = [
  {
    title: 'Dedicated Team',
    desc: 'A highly skilled team of 350+ professionals committed to delivering excellence in every product and service.',
    bgColor: 'bg-[#d1264c]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Free Software',
    desc: 'Complimentary Order Management Software and monthly magazine subscription for every member printer.',
    bgColor: 'bg-[#0c2356]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Lowest Prices',
    desc: 'Guaranteed wholesale pricing that maximizes your profit margins — we serve the industry, not profit from it.',
    bgColor: 'bg-[#10b981]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Wide Product Range',
    desc: 'From die-cut cards to stickers, pouches to stationery — a continuously growing catalog of premium products.',
    bgColor: 'bg-[#e28714]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'On-Time Delivery',
    desc: 'We never leave till tomorrow what we can do today. Committed timelines backed by a 5,000 sq. mtr. factory.',
    bgColor: 'bg-[#8b5cf6]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Unity is Strength',
    desc: "Coming together is a beginning, working together is success. Join India's largest community of printing professionals.",
    bgColor: 'bg-[#00a884]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Grow With Us',
    desc: 'We are dedicated to the growth and development of every printer — your success is our mission.',
    bgColor: 'bg-[#d32f2f]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    title: 'World-Class Quality',
    desc: 'Quality is the result of intelligent effort — advanced Komori offset presses and premium materials every time.',
    bgColor: 'bg-[#2196f3]',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

const tickerItems = [
  "Digital Print",
  "B/W Printout",
  "Half Cut",
  "Die Cut",
  "Lamination",
  "Spiral / Wiro",
  "Glue Binding",
  "Hard Binding",
  "Round Corner",
  "Tag Hole",
  "Magazine",
  "Envelope",
  "Metallic Sheet",
  "Texture Print",
  "Avery Gumming",
  "Hole Punching"
]
