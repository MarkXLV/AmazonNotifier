import { useEffect, useState } from "react";
import {
  Mail,
  Bell,
  Target,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "../api/client";

export default function Settings() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [email, setEmail] = useState("");
  const [notifyDrop, setNotifyDrop] = useState(true);
  const [notifyTarget, setNotifyTarget] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotificationSettings();
        setSettings(res.data);
        setEmail(res.data.email);
        setNotifyDrop(res.data.notify_on_drop);
        setNotifyTarget(res.data.notify_on_target);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateNotificationSettings({
        email,
        notify_on_drop: notifyDrop,
        notify_on_target: notifyTarget,
      });
      setSettings(res.data);
      notify("Settings saved.", "success");
    } catch {
      notify("Couldn't save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 text-base text-muted">
          Configure email notifications and price alert preferences.
        </p>
      </div>

      {/* SMTP status */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          settings?.email_configured
            ? "border-savings/25 bg-savings-soft"
            : "border-amber-ink/25 bg-amber-soft"
        }`}
      >
        {settings?.email_configured ? (
          <>
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-savings-ink" />
            <div>
              <p className="text-sm font-semibold text-savings-ink">
                Email service configured
              </p>
              <p className="mt-0.5 text-xs text-savings-ink/80">
                SMTP settings detected from environment variables. Emails will be
                sent on price drops.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-ink" />
            <div>
              <p className="text-sm font-semibold text-amber-ink">
                Email service not configured
              </p>
              <p className="mt-0.5 text-xs text-amber-ink/80">
                Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD on the backend to
                enable email alerts. For Gmail, use an App Password.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Email settings */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-2.5">
          <Mail size={19} className="text-savings-ink" />
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Email notifications
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Notification email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-savings focus:ring-[3px] focus:ring-[var(--ring)]"
            />
            <p className="mt-1.5 text-xs text-faint">
              Price drop alerts will be sent to this address.
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                checked: notifyDrop,
                set: setNotifyDrop,
                icon: Bell,
                title: "Notify on any price drop",
                desc: "Get an email whenever a tracked product's price drops.",
              },
              {
                checked: notifyTarget,
                set: setNotifyTarget,
                icon: Target,
                title: "Notify when target price reached",
                desc: "Get an email when a product hits your set target price.",
              },
            ].map(({ checked, set, icon: Icon, title, desc }) => (
              <label
                key={title}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-2 p-3.5 transition-colors hover:bg-surface-2/50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => set(e.target.checked)}
                  style={{ accentColor: "var(--savings)" }}
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Icon size={14} />
                    {title}
                  </span>
                  <span className="text-xs text-muted">{desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save settings
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
          How it works
        </h2>
        <div className="space-y-3.5 text-sm text-muted">
          {[
            ["Automatic checks", "The backend checks all tracked product prices every 6 hours automatically."],
            ["Price drop detected", "When a price drops, an alert appears on the dashboard and an email is sent to your address."],
            ["Target price", "Set a target on any product and get a special alert when the price hits it."],
          ].map(([title, body], i) => (
            <div key={title} className="flex items-start gap-3">
              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-savings-soft text-xs font-bold text-savings-ink">
                {i + 1}
              </span>
              <p>
                <strong className="font-semibold text-ink">{title}</strong> — {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
