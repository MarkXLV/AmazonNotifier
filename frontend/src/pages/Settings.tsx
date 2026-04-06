import { useEffect, useState } from "react";
import { Mail, Bell, Target, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "../api/client";

export default function Settings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [email, setEmail] = useState("");
  const [notifyDrop, setNotifyDrop] = useState(true);
  const [notifyTarget, setNotifyTarget] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    try {
      const res = await updateNotificationSettings({
        email,
        notify_on_drop: notifyDrop,
        notify_on_target: notifyTarget,
      });
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure email notifications and price alert preferences.
        </p>
      </div>

      {/* SMTP Status */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          settings?.email_configured
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {settings?.email_configured ? (
          <>
            <CheckCircle2 size={20} className="text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Email service configured
              </p>
              <p className="text-xs text-emerald-600">
                SMTP settings detected from environment variables. Emails will be sent on price drops.
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Email service not configured
              </p>
              <p className="text-xs text-amber-600">
                Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables on the backend to enable email alerts.
                For Gmail, use an App Password.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Email Settings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Mail size={20} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Email Notifications
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notification email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Price drop alerts will be sent to this email address.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDrop}
                onChange={(e) => setNotifyDrop(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Bell size={14} />
                  Notify on any price drop
                </span>
                <span className="text-xs text-gray-400">
                  Get an email whenever any tracked product's price drops.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTarget}
                onChange={(e) => setNotifyTarget(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Target size={14} />
                  Notify when target price reached
                </span>
                <span className="text-xs text-gray-400">
                  Get an email when a product hits your set target price.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Settings
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} />
              Saved!
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          How it works
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              1
            </span>
            <p>
              <strong>Automatic checks</strong> -- The backend checks all tracked product prices every 6 hours automatically.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              2
            </span>
            <p>
              <strong>Price drop detected</strong> -- When a price drops, an alert is created on the dashboard and an email is sent to your configured address.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              3
            </span>
            <p>
              <strong>Target price</strong> -- Set a target price on any product. You'll get a special alert when the price hits your target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
