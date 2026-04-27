import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero hero-pro">
        <div className="hero-content">
          <div className="logo-container">
            <Image
              src="/kare-bear-logo.png"
              alt="Kare Bear Auto Shop mascot"
              width={420}
              height={420}
              className="hero-logo"
              priority
            />

            <div className="logo-overlay">
              <h1 className="logo-script">Kare Bear Auto</h1>
              <p className="logo-subtitle">AUTO SHOP</p>
            </div>
          </div>

          <p className="hero-label">Reliable Auto Care</p>

          <h2 className="hero-main-title">
            Quality service. Simple scheduling. Honest care.
          </h2>

          <p className="tagline">
            Request your auto service appointment online and let Kare Bear Auto
            Shop review your booking quickly and professionally.
          </p>

          <div className="button-group">
            <Link href="/appointment" className="primary-btn hero-cta-btn">
              Schedule Appointment
            </Link>
          </div>

          <div className="hero-trust-row">
            <span>Easy booking</span>
            <span>Trusted service</span>
            <span>Customer-focused care</span>
          </div>
        </div>
      </section>

      <section className="about professional-section">
        <div className="section-heading">
          <p className="section-label">About Us</p>
          <h2>Auto care built around trust and convenience</h2>
        </div>

        <p>
          At Kare Bear Auto Shop, we make it easy to request service and get the
          vehicle care you need. Our goal is simple: dependable work, clear
          communication, and a smoother experience from request to appointment.
        </p>
      </section>

      <section className="services professional-section">
        <div className="section-heading">
          <p className="section-label">Why Choose Us</p>
          <h2>A better way to schedule auto service</h2>
        </div>

        <div className="card-grid">
          <div className="card feature-card">
            <div className="card-icon">📅</div>
            <h3>Simple Scheduling</h3>
            <p>
              Submit your appointment request online without calling or waiting.
            </p>
          </div>

          <div className="card feature-card">
            <div className="card-icon">🔧</div>
            <h3>Reliable Service</h3>
            <p>
              Get professional vehicle care handled with attention and respect.
            </p>
          </div>

          <div className="card feature-card">
            <div className="card-icon">✅</div>
            <h3>Clear Updates</h3>
            <p>
              Receive confirmation once your appointment is reviewed by the shop.
            </p>
          </div>
        </div>
      </section>

      <section className="cta professional-cta">
        <div className="section-heading">
          <p className="section-label">Book Today</p>
          <h2>Ready to request service?</h2>
        </div>

        <p>
          Schedule your appointment request in just a few steps. Kare Bear Auto
          Shop will review it and follow up.
        </p>

        <Link href="/appointment" className="primary-btn">
          Request Appointment
        </Link>
      </section>

      <footer className="footer">
        <p className="footer-title logo-script">Kare Bear Auto Shop</p>

        <p>Follow us</p>

        <div className="socials">
          <a
            href="https://www.instagram.com/kbear_auto_repair"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>

          <a
            href="https://www.snapchat.com/add/karebear7_7"
            target="_blank"
            rel="noopener noreferrer"
          >
            Snapchat
          </a>
        </div>
      </footer>
    </main>
  );
}