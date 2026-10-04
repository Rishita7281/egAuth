import { Button, Panel, SectionHeader } from '../components/Ui';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page-stack">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Project Intro</p>
          <h1>Digital Identity Verification for Fraud-Resistant Access</h1>
          <p className="subtitle">
            eGAuth is built to stop identity forgery with rotating, encrypted QR credentials. We thrive to solve
            high-trust verification gaps for departments, employees, and users in seconds.
          </p>
          <div className="actions">
            <Button as={Link} to="/auth/department">Department Portal</Button>
            <Button as={Link} to="/auth/employee" variant="ghost">Employee Login</Button>
            <Button as={Link} to="/auth/user/login" variant="ghost">User Login</Button>
          </div>
        </div>
        <div className="landing-card">
          <p className="label">What we solve</p>
          <h3>Protecting high-trust identities</h3>
          <p className="note">
            Our system eliminates replay attacks with AES-encrypted QR codes that refresh frequently, backed by
            RSA key exchange and LavinMQ on CloudAMQP for secure microservice communication.
          </p>
          <div className="pill-row">
            <span className="pill neutral">AES + RSA</span>
            <span className="pill neutral">QR Rotation</span>
            <span className="pill neutral">Microservices</span>
          </div>
        </div>
      </section>

      <div className="grid">
        <Panel title="Department" subtitle="Signup and login for department owners">
          <SectionHeader title="What you can do" />
          <ul className="bullet">
            <li>Create department account</li>
            <li>Login and manage employees</li>
            <li>CRUD employee records with scoped access</li>
          </ul>
        </Panel>

        <Panel title="Employees" subtitle="Employee login, profile, and QR generation">
          <SectionHeader title="What you can do" />
          <ul className="bullet">
            <li>Login and view profile</li>
            <li>Generate QR and refresh in real time</li>
            <li>Share secure ID for verification</li>
          </ul>
        </Panel>

        <Panel title="Users" subtitle="Registration, profile, and QR scan verification">
          <SectionHeader title="What you can do" />
          <ul className="bullet">
            <li>Register and update profile</li>
            <li>Verify QR scans and view history</li>
            <li>Access verified services instantly</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
