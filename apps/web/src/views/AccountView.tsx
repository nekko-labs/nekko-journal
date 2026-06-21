import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, CloudOff, RefreshCw, LogOut, Mail, Check, Sparkles } from 'lucide-react';
import { PageHeader, Section } from '../components/ui';
import { useCloud } from '../state/cloud';
import { isCloudConfigured, signInWithEmail } from '../lib/supabase';

function SyncBadge() {
  const status = useCloud((s) => s.status);
  const lastSyncedAt = useCloud((s) => s.lastSyncedAt);
  const map: Record<string, { label: string; color: string }> = {
    idle: { label: 'Ready', color: 'var(--text-faint)' },
    syncing: { label: 'Syncing…', color: 'var(--info)' },
    synced: { label: 'Synced', color: 'var(--success)' },
    error: { label: 'Sync error', color: 'var(--error)' },
    offline: { label: 'Offline', color: 'var(--text-faint)' },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className="flex items-center gap-1.5 text-sm" style={{ color: s.color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
      {s.label}
      {lastSyncedAt && status === 'synced' && (
        <span style={{ color: 'var(--text-faint)' }}>· {new Date(lastSyncedAt).toLocaleTimeString()}</span>
      )}
    </span>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    if (error) setError(error);
    else setSent(true);
  };
  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
        <Check size={16} /> Check your email for a magic sign-in link.
      </div>
    );
  }
  return (
    <div>
      <p className="mb-3 text-sm" style={{ color: 'var(--text-soft)' }}>
        Sign in with a magic link — no password. Your local journal stays exactly as it is and merges with the cloud.
      </p>
      <div className="flex gap-2">
        <input className="input" type="email" placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="btn btn-primary shrink-0" onClick={submit}><Mail size={16} /> Send link</button>
      </div>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>We couldn't send the link — {error.toLowerCase()}. Check the address and try again.</p>}
    </div>
  );
}

export default function AccountView() {
  const configured = isCloudConfigured();
  const session = useCloud((s) => s.session);
  const plan = useCloud((s) => s.plan);
  const sync = useCloud((s) => s.sync);
  const signOut = useCloud((s) => s.signOut);
  const status = useCloud((s) => s.status);

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <PageHeader title="Account & sync" subtitle="Your journal is yours — local-first, always. Cloud sync is optional." />

      {!configured ? (
        <Section title="Local only">
          <div className="flex items-start gap-3">
            <CloudOff size={20} style={{ color: 'var(--text-faint)' }} className="mt-0.5" />
            <div>
              <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                This build runs fully offline — every feature works and your data lives on this device.
                Cloud sync isn't configured here.
              </p>
              <Link to="/pricing" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                <Sparkles size={14} /> See what cloud adds →
              </Link>
            </div>
          </div>
        </Section>
      ) : !session ? (
        <Section title="Sign in to sync"><SignInForm /></Section>
      ) : (
        <div className="space-y-5">
          <Section title="Signed in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">{session.user.email}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{
                  background: plan === 'cloud' ? 'var(--accent)' : 'var(--surface-2)',
                  color: plan === 'cloud' ? 'white' : 'var(--text-soft)',
                }}>
                  {plan === 'cloud' ? 'Cloud' : 'Free'}
                </span>
                <button className="btn !py-1.5" onClick={signOut}><LogOut size={15} /> Sign out</button>
              </span>
            </div>
          </Section>

          {plan === 'cloud' ? (
            <Section title="Sync">
              <div className="flex items-center justify-between">
                <SyncBadge />
                <button className="btn" onClick={() => void sync()} disabled={status === 'syncing'}>
                  <RefreshCw size={15} className={status === 'syncing' ? 'animate-spin' : ''} /> Sync now
                </button>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-soft)' }}>
                <Cloud size={15} style={{ color: 'var(--accent)' }} /> Your journal syncs automatically across your devices.
              </p>
            </Section>
          ) : (
            <Section title="Upgrade to Cloud">
              <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                You're on the free plan — fully functional, on this device. Add sync, encrypted backup, cloud photos and web access for <strong>$2/month</strong>.
              </p>
              <Link to="/pricing" className="btn btn-primary mt-3"><Sparkles size={15} /> See Cloud plan</Link>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
