import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

const URGENT_COUNTDOWN_SECONDS = 2 * 60 + 19;

const PayPalButtonWrapper = ({ amount, description, onSuccess, onError }) => {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!window.paypal_sdk || !containerRef.current || renderedRef.current) return;
    if (!amount || parseFloat(amount) < 0.01) return;

    renderedRef.current = true;
    containerRef.current.innerHTML = '';

    window.paypal_sdk.Buttons({
      style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'donate', height: 45 },
      createOrder: async () => {
        try {
          const res = await api.post('/paypal/public/create-order', {
            amount: parseFloat(amount).toFixed(2),
            description: description || 'TÊKOȘÎN Donation'
          });
          return res.data.orderId;
        } catch (err) {
          onError(err.response?.data?.error || 'Network error. Please try again.');
          throw err;
        }
      },
      onApprove: async (data) => {
        try {
          const res = await api.post('/paypal/public/capture-order', { orderId: data.orderID });
          onSuccess(res.data);
        } catch (err) {
          onError(err.response?.data?.error || 'Network error. Please try again.');
        }
      },
      onError: () => onError('PayPal encountered an error. Please try again.'),
      onCancel: () => onError('Payment cancelled.')
    }).render(containerRef.current).catch(() => {
      onError('Unable to load PayPal button.');
    });

    return () => {
      renderedRef.current = false;
    };
  }, [amount, description, onSuccess, onError]);

  return <div ref={containerRef} className="min-h-[50px]" />;
};

const DonateNowButton = ({ className = '' }) => (
  <a href="#donate" className={`neon-button inline-flex items-center justify-center font-black text-sm md:text-base ${className}`}>
    Donate Now
  </a>
);

const HomePage = () => {
  const [showDonatePopup, setShowDonatePopup] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [donateAmount, setDonateAmount] = useState('25');
  const [donateDesc, setDonateDesc] = useState('TÊKOȘÎN Donation');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const deadlineRef = useRef(Date.now() + URGENT_COUNTDOWN_SECONDS * 1000);

  const bannerClass = useMemo(() => {
    if (scrollY > 1400) return 'from-orange-500 via-red-500 to-pink-500';
    if (scrollY > 700) return 'from-emerald-400 via-cyan-400 to-blue-500';
    return 'from-fuchsia-500 via-pink-500 to-red-500';
  }, [scrollY]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const remainingMs = Math.max(0, deadlineRef.current - nowMs);
  const secondsLeft = Math.floor(remainingMs / 1000);
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050510] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-16 -left-24 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 pride-overlay" />
      </div>

      <div className={`fixed left-0 top-20 z-40 hidden h-[65vh] w-12 rounded-r-xl bg-gradient-to-b ${bannerClass} lg:flex items-center justify-center shadow-2xl`}>
        <p className="rotate-180 [writing-mode:vertical-rl] text-[11px] font-black tracking-wider text-black px-1 text-center">TÊKOȘÎN is a self-organized association. ZERO bureaucracy</p>
      </div>
      <div className={`fixed right-0 top-20 z-40 hidden h-[65vh] w-12 rounded-l-xl bg-gradient-to-b ${bannerClass} lg:flex items-center justify-center shadow-2xl`}>
        <p className="[writing-mode:vertical-rl] text-[11px] font-black tracking-wider text-black px-1 text-center">TÊKOȘÎN is a self-organized association. ZERO bureaucracy</p>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070718]/90 backdrop-blur-xl">
        <div className="crisis-banner text-xs font-black tracking-wider">WARNING: Hate, violence, and exclusion are rising. Community response cannot wait.</div>
        <div className="ticker-wrap border-y border-fuchsia-500/30 bg-black/30">
          <div className="ticker-track text-xs font-bold text-yellow-300">
            <span>LIVE: Safe housing requests surged this week</span><span> | </span>
            <span>New legal clinic slots open now</span><span> | </span>
            <span>Every 5 minutes, a new support request arrives</span><span> | </span>
            <span>Community-funded crisis care is active right now</span><span> | </span>
            <span>LIVE: Safe housing requests surged this week</span><span> | </span>
            <span>New legal clinic slots open now</span><span> | </span>
            <span>Every 5 minutes, a new support request arrives</span>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <a href="#top" className="font-black text-lg neon-text">TÊKOȘÎN</a>
          <div className="hidden items-center gap-5 text-sm font-bold md:flex">
            <a href="#help" className="hover:text-neon-cyan">Get Help</a>
            <a href="#services" className="hover:text-neon-cyan">Services</a>
            <a href="#movement" className="hover:text-neon-cyan">Join Movement</a>
            <a href="#about" className="hover:text-neon-cyan">About</a>
            <a href="#impact" className="hover:text-neon-cyan">Impact</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="/portal" className="rounded-lg border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10">TÊKOȘÎN Portal</a>
            <DonateNowButton className="px-3 py-2 text-xs md:text-sm" />
          </div>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-14 pt-16 md:px-8">
          <p className="mb-3 inline-block rounded-full border border-red-400/50 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-300">Crisis Response in Vienna</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-7xl">Your Journey to <span className="text-yellow-300">Safety</span> and <span className="text-fuchsia-300">Pride</span> Starts Here</h1>
          <p className="mt-6 max-w-4xl text-lg text-gray-200 md:text-xl">TÊKOȘÎN - Verein für LGBTIQ-Geflüchtete und Migrant*innen in Wien is your compass and your community in Austria. We support LGBTIQ+ asylum seekers, refugees, and migrants with legal guidance, trauma-aware care, and collective power.</p>
          <p className="mt-4 max-w-4xl text-base text-gray-300">We are self-organized: bottom-up, fast, and people-led. While bureaucracy stalls, community acts.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="stat-card"><p className="text-3xl font-black text-neon-cyan">847</p><p className="text-sm text-gray-300">People supported last year</p></div>
            <div className="stat-card"><p className="text-3xl font-black text-yellow-300">680</p><p className="text-sm text-gray-300">Therapy sessions delivered</p></div>
            <div className="stat-card"><p className="text-3xl font-black text-neon-pink">1,250+</p><p className="text-sm text-gray-300">Legal interventions and referrals</p></div>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#help" className="neon-button">Get Urgent Help Now</a>
            <a href="#donate" className="neon-button neon-button-green">Become a Sanctuary Builder</a>
            <a href="#movement" className="neon-button neon-button-cyan">Join Our Movement</a>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="help" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-black md:text-5xl">Get Urgent Help</h2>
          <p className="mt-3 max-w-4xl text-gray-200">We are here for you: safe, confidential, LGBTIQ+ affirming. You do not have to face this alone.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="glass-card p-6"><p className="text-xs font-black text-red-300">24/7 Crisis Hotline</p><p className="mt-2 text-lg font-bold">+43 650 8924805</p></div>
            <div className="glass-card p-6"><p className="text-xs font-black text-cyan-300">Secure Email Support</p><p className="mt-2 text-lg font-bold">tekosinlgbti@gmx.at</p></div>
            <div className="glass-card p-6"><p className="text-xs font-black text-emerald-300">Visit Our Office</p><p className="mt-2 text-lg font-bold">Schwarzhorngasse 1, 1050 Wien</p></div>
            <div className="glass-card p-6"><p className="text-xs font-black text-yellow-300">Your Privacy Is Priority</p><p className="mt-2 text-base">All communications are confidential and encrypted.</p></div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-black md:text-5xl">Our Services</h2>
          <p className="mt-3 max-w-4xl text-gray-200">Comprehensive support for your safety, stability, and future.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="stat-card"><h3 className="text-xl font-black text-neon-cyan">Legal Support & Asylum</h3><p className="mt-2 text-sm text-gray-300">Asylum applications, appeals, documentation, and case strategy.</p></div>
            <div className="stat-card"><h3 className="text-xl font-black text-neon-pink">Mental Health & Wellness</h3><p className="mt-2 text-sm text-gray-300">Trauma-informed counseling with LGBTIQ+ affirming professionals.</p></div>
            <div className="stat-card"><h3 className="text-xl font-black text-emerald-300">Housing & Basic Needs</h3><p className="mt-2 text-sm text-gray-300">Emergency placement, food, hygiene, and survival support.</p></div>
            <div className="stat-card"><h3 className="text-xl font-black text-yellow-300">Community & Belonging</h3><p className="mt-2 text-sm text-gray-300">Safe spaces, peer circles, and events that restore connection.</p></div>
            <div className="stat-card"><h3 className="text-xl font-black text-cyan-200">Education & Resources</h3><p className="mt-2 text-sm text-gray-300">German classes, skills training, integration support, and mentoring.</p></div>
            <div className="stat-card"><h3 className="text-xl font-black text-fuchsia-300">Advocacy & Activism</h3><p className="mt-2 text-sm text-gray-300">Campaigns, rights awareness, and voice amplification for systemic change.</p></div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="donate" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="glass-card p-8">
            <h2 className="text-3xl font-black md:text-5xl">Become a Sanctuary Builder</h2>
            <p className="mt-3 text-gray-200">Every donation protects lives and builds long-term belonging for LGBTIQ+ refugees.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-black text-yellow-300">Tax-deductible in the EU</p></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-black text-cyan-300">Secure payment via PayPal</p></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-black text-emerald-300">Annual financial transparency reports</p></div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-neon-cyan mb-1">Amount (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  className="neon-input text-xl font-black text-center"
                />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonateAmount(String(amt))}
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${parseFloat(donateAmount) === amt ? 'bg-neon-pink/30 text-neon-pink border border-neon-pink/50' : 'bg-neon-pink/10 text-neon-pink'}`}
                    >
                      EUR {amt}
                    </button>
                  ))}
                </div>
                <input
                  value={donateDesc}
                  onChange={(e) => setDonateDesc(e.target.value)}
                  className="neon-input mt-3 text-sm"
                  placeholder="Donation description"
                />
              </div>
              <div className="flex flex-col justify-center">
                {parseFloat(donateAmount) >= 0.01 ? (
                  <PayPalButtonWrapper
                    key={`${donateAmount}-${donateDesc}`}
                    amount={donateAmount}
                    description={donateDesc}
                    onSuccess={(data) => {
                      setPaymentError('');
                      setPaymentSuccess(`Payment completed. Capture ID: ${data.captureId || 'n/a'}`);
                    }}
                    onError={(message) => {
                      setPaymentSuccess('');
                      setPaymentError(message);
                    }}
                  />
                ) : (
                  <p className="text-sm text-neon-yellow">Enter amount to enable PayPal.</p>
                )}
                {paymentSuccess && <p className="mt-2 text-xs text-neon-green font-bold">{paymentSuccess}</p>}
                {paymentError && <p className="mt-2 text-xs text-red-400 font-bold">{paymentError}</p>}
              </div>
            </div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="movement" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-black md:text-5xl">Join Our Movement</h2>
          <p className="mt-3 max-w-4xl text-gray-200">From peer support to translation and education mentoring, your time can change outcomes now.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="stat-card"><p className="font-black text-neon-pink">Peer Support Volunteer</p><p className="text-sm text-gray-300 mt-1">4-8 hours/month</p></div>
            <div className="stat-card"><p className="font-black text-neon-cyan">Translator / Interpreter</p><p className="text-sm text-gray-300 mt-1">Flexible</p></div>
            <div className="stat-card"><p className="font-black text-emerald-300">Education Mentor</p><p className="text-sm text-gray-300 mt-1">4-6 hours/month</p></div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-black md:text-5xl">About TÊKOȘÎN</h2>
          <p className="mt-4 max-w-5xl text-gray-200">Founded by LGBTIQ+ refugees, TÊKOȘÎN is built on lived experience. We know the weight of exile, fear, and uncertainty. Our mission is practical: legal support, mental health care, and strong community structures that turn survival into momentum.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="glass-card p-6"><h3 className="text-xl font-black text-cyan-300">Mission</h3><p className="mt-2 text-sm text-gray-300">Culturally sensitive, comprehensive support for LGBTIQ+ asylum seekers, refugees, and migrants in Austria.</p></div>
            <div className="glass-card p-6"><h3 className="text-xl font-black text-fuchsia-300">Vision</h3><p className="mt-2 text-sm text-gray-300">A future where LGBTIQ+ refugees are not only safe, but thriving, visible, and celebrated.</p></div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>

        <section id="impact" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <h2 className="text-3xl font-black md:text-5xl">Social Proof & Impact</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="stat-card text-center"><p className="text-4xl font-black text-yellow-300">4.9/5</p><p className="text-sm text-gray-300">Community trust rating</p></div>
            <div className="stat-card text-center"><p className="text-4xl font-black text-neon-cyan">93%</p><p className="text-sm text-gray-300">Users report improved stability</p></div>
            <div className="stat-card text-center"><p className="text-4xl font-black text-neon-pink">2,700+</p><p className="text-sm text-gray-300">Urgent interventions completed</p></div>
            <div className="stat-card text-center"><p className="text-4xl font-black text-emerald-300">24/7</p><p className="text-sm text-gray-300">Crisis response readiness</p></div>
          </div>
          <div className="mt-8"><DonateNowButton /></div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-black neon-text">TÊKOȘÎN LGBTIQ+ Sanctuary</h3>
          <p className="mt-2 text-sm text-gray-300">Building sanctuary. Fostering pride. Creating change.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <DonateNowButton />
            <a href="/portal" className="inline-flex items-center rounded-xl border border-cyan-300/40 px-5 py-3 text-sm font-black text-cyan-200 hover:bg-cyan-400/10">Go to TÊKOȘÎN Portal</a>
          </div>
          <p className="mt-6 text-xs text-gray-400">Copyright © 2026 TÊKOȘÎN</p>
        </div>
      </footer>

      {showDonatePopup && (
        <div className="fixed bottom-4 right-4 z-[60] w-[92vw] max-w-sm rounded-2xl border border-red-400/40 bg-[#0e0b1f]/95 p-5 shadow-[0_0_40px_rgba(255,0,100,0.35)] backdrop-blur-xl">
          <button type="button" onClick={() => setShowDonatePopup(false)} className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-black text-gray-300 hover:bg-white/10">X</button>
          <p className="text-xs font-black uppercase tracking-wider text-red-300">Urgent Donation Window</p>
          <p className="mt-2 text-lg font-black">Keep crisis support active right now.</p>
          <div className="countdown-timer mt-3 text-center">
            <p className="text-xs text-red-200">Timer ends in</p>
            <p className="text-3xl font-black text-red-100">{minutes}:{seconds}</p>
          </div>
          <p className="mt-3 text-xs text-gray-300">Your contribution directly funds legal protection and emergency care.</p>
          <div className="mt-4">
            <a href="#donate" className="neon-button inline-flex w-full items-center justify-center">Donate Now</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
