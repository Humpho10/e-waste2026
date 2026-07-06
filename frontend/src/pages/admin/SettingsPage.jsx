import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getSettings, updateSettings } from '../../api/admin';

const TABS = [
  { key: 'general',       label: 'General',       icon: 'building-fill-gear' },
  { key: 'branding',      label: 'Branding',       icon: 'palette-fill' },
  { key: 'marketplace',   label: 'Marketplace',    icon: 'shop' },
  { key: 'security',      label: 'Security',       icon: 'shield-lock-fill' },
  { key: 'notifications', label: 'Notifications',  icon: 'bell-fill' },
  { key: 'maintenance',   label: 'Maintenance',    icon: 'cone-striped' },
  { key: 'account',       label: 'Your Account',   icon: 'person-circle' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-md">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TextField({ value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      className={`border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

function SaveBar({ dirty, saving, onSave, onDiscard }) {
  if (!dirty) return null;
  return (
    <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-gray-100 dark:border-slate-800">
      <button
        onClick={onDiscard}
        type="button"
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
      >
        Discard
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        type="button"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
      >
        {saving ? <Bi name="arrow-repeat" size={14} className="animate-spin" /> : <Bi name="check-lg" size={14} />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => getSettings().then(res => res.data.settings),
  });

  // Seed the editable form once the real settings arrive (and whenever a
  // save round-trips fresh data back in), without clobbering in-progress edits.
  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (payload) => updateSettings(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['admin-settings'], res.data.settings);
      setForm(res.data.settings);
      toast('Settings saved', 'success');
    },
    onError: (err) => {
      toast(err.response?.data?.message || 'Failed to save settings', 'error');
    },
  });

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const dirty = form && data && JSON.stringify(form) !== JSON.stringify(data);
  const discard = () => setForm(data);

  // Only PUT the fields relevant to the active tab, so saving "General"
  // doesn't accidentally resend (and re-log-audit) unrelated sections.
  const fieldsByTab = {
    general:       ['platform_name', 'support_email', 'support_phone', 'contact_address'],
    branding:      ['tagline', 'facebook_url', 'twitter_url', 'instagram_url'],
    marketplace:   ['auto_approve_listings', 'max_images_per_listing', 'max_image_upload_size_kb', 'min_listing_price', 'max_listing_price'],
    security:      [
      'min_password_length', 'require_strong_password', 'require_email_verification',
      'allow_google_login', 'allow_public_registration',
      'max_login_attempts', 'lockout_duration_minutes', 'session_lifetime_minutes',
    ],
    notifications: ['notify_admins_on_new_user', 'notify_admins_on_new_listing', 'notify_admins_on_new_message'],
    maintenance:   ['maintenance_mode', 'maintenance_message'],
  };

  const save = () => {
    const keys = fieldsByTab[activeTab] || [];
    const payload = {};
    keys.forEach(k => { payload[k] = form[k]; });
    mutation.mutate(payload);
  };

  if (loading || !form) {
    return (
      <AdminLayout>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Loading platform configuration...</p>
        </div>
        <div className="h-96 bg-gray-50 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Bi name="gear-fill" size={20} className="text-blue-600 dark:text-blue-400" />
          Settings
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Exhaustive controls for how E-Waste Mart runs — every change here takes effect immediately.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab rail */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bi name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">

          {activeTab === 'general' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">General</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Basic identity and contact details of the platform.</p>
              <SettingRow label="Platform name" description="Shown across the admin console and the maintenance banner.">
                <TextField value={form.platform_name} onChange={v => set('platform_name', v)} className="w-64" />
              </SettingRow>
              <SettingRow label="Support email" description="Where visitors can reach you — displayed if maintenance mode is on.">
                <TextField type="email" value={form.support_email} onChange={v => set('support_email', v)} placeholder="support@ewaste.org" className="w-64" />
              </SettingRow>
              <SettingRow label="Support phone" description="Optional — shown alongside the support email on public pages.">
                <TextField value={form.support_phone} onChange={v => set('support_phone', v)} placeholder="+256 700 000000" className="w-64" />
              </SettingRow>
              <SettingRow label="Contact address" description="Physical address or PO box, shown in the site footer.">
                <TextField value={form.contact_address} onChange={v => set('contact_address', v)} placeholder="Kampala, Uganda" className="w-64" />
              </SettingRow>
              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'branding' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Branding & Social</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Powers the homepage footer — tagline and social links.</p>
              <SettingRow label="Footer tagline" description="Short line of copy shown in the site footer, under the platform name.">
                <TextField value={form.tagline} onChange={v => set('tagline', v)} placeholder="Empowering circular economy in Uganda" className="w-72" />
              </SettingRow>
              <SettingRow label="Facebook URL" description="Leave blank to hide the icon in the footer.">
                <TextField value={form.facebook_url} onChange={v => set('facebook_url', v)} placeholder="https://facebook.com/..." className="w-72" />
              </SettingRow>
              <SettingRow label="Twitter / X URL" description="Leave blank to hide the icon in the footer.">
                <TextField value={form.twitter_url} onChange={v => set('twitter_url', v)} placeholder="https://x.com/..." className="w-72" />
              </SettingRow>
              <SettingRow label="Instagram URL" description="Leave blank to hide the icon in the footer.">
                <TextField value={form.instagram_url} onChange={v => set('instagram_url', v)} placeholder="https://instagram.com/..." className="w-72" />
              </SettingRow>
              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Marketplace Rules</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Controls that apply the moment a seller submits a listing.</p>
              <SettingRow label="Auto-approve listings" description="New listings publish immediately instead of waiting in the review queue.">
                <Toggle checked={!!form.auto_approve_listings} onChange={v => set('auto_approve_listings', v)} />
              </SettingRow>
              <SettingRow label="Max images per listing" description="Sellers cannot upload more than this many photos on one listing.">
                <TextField type="number" value={form.max_images_per_listing} onChange={v => set('max_images_per_listing', v)} className="w-24 text-center" />
              </SettingRow>
              <SettingRow label="Max image upload size (KB)" description="Each individual photo — applies to listings and profile avatars alike.">
                <TextField type="number" value={form.max_image_upload_size_kb} onChange={v => set('max_image_upload_size_kb', v)} className="w-28 text-center" />
              </SettingRow>
              <SettingRow label="Min listing price (UGX)" description="Leave blank for no minimum.">
                <TextField type="number" value={form.min_listing_price} onChange={v => set('min_listing_price', v)} placeholder="No minimum" className="w-40 text-center" />
              </SettingRow>
              <SettingRow label="Max listing price (UGX)" description="Leave blank for no price cap.">
                <TextField type="number" value={form.max_listing_price} onChange={v => set('max_listing_price', v)} placeholder="No cap" className="w-40 text-center" />
              </SettingRow>
              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Security & Access</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Password policy, login protection, sign-in methods, and session length.</p>

              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-4 mb-1">Password policy</p>
              <SettingRow label="Minimum password length" description="Enforced on registration, password resets, and admin-created accounts.">
                <TextField type="number" value={form.min_password_length} onChange={v => set('min_password_length', v)} className="w-24 text-center" />
              </SettingRow>
              <SettingRow label="Require strong passwords" description="Must contain at least one letter and one number.">
                <Toggle checked={!!form.require_strong_password} onChange={v => set('require_strong_password', v)} />
              </SettingRow>

              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-5 mb-1">Login protection</p>
              <SettingRow label="Max login attempts" description="Failed sign-ins beyond this many trigger a temporary lockout.">
                <TextField type="number" value={form.max_login_attempts} onChange={v => set('max_login_attempts', v)} className="w-24 text-center" />
              </SettingRow>
              <SettingRow label="Lockout duration (minutes)" description="How long a locked-out email + IP combination must wait before retrying.">
                <TextField type="number" value={form.lockout_duration_minutes} onChange={v => set('lockout_duration_minutes', v)} className="w-24 text-center" />
              </SettingRow>
              <SettingRow label="Session lifetime (minutes)" description="Leave blank so sign-ins never expire automatically.">
                <TextField type="number" value={form.session_lifetime_minutes} onChange={v => set('session_lifetime_minutes', v)} placeholder="Never" className="w-32 text-center" />
              </SettingRow>

              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-5 mb-1">Access</p>
              <SettingRow label="Require email verification to sign in" description="Users with an unverified email address are blocked from logging in.">
                <Toggle checked={!!form.require_email_verification} onChange={v => set('require_email_verification', v)} />
              </SettingRow>
              <SettingRow label="Allow Google sign-in" description="Turns off the “Continue with Google” option on Login and Register.">
                <Toggle checked={!!form.allow_google_login} onChange={v => set('allow_google_login', v)} />
              </SettingRow>
              <SettingRow label="Allow public registration" description="When off, new accounts (including via Google) can no longer sign up.">
                <Toggle checked={!!form.allow_public_registration} onChange={v => set('allow_public_registration', v)} />
              </SettingRow>

              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Notifications</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Choose what Admins and Super Admins get notified about.</p>
              <SettingRow label="New user signups" description="Notify Super Admins whenever an account is created from the admin console.">
                <Toggle checked={!!form.notify_admins_on_new_user} onChange={v => set('notify_admins_on_new_user', v)} />
              </SettingRow>
              <SettingRow label="New listings" description="Notify Admins and Super Admins whenever a listing is submitted or resubmitted.">
                <Toggle checked={!!form.notify_admins_on_new_listing} onChange={v => set('notify_admins_on_new_listing', v)} />
              </SettingRow>
              <SettingRow label="New messages" description="Oversight ping to Admins and Super Admins whenever a buyer and seller exchange a message.">
                <Toggle checked={!!form.notify_admins_on_new_message} onChange={v => set('notify_admins_on_new_message', v)} />
              </SettingRow>
              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Maintenance Mode</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Takes the public storefront offline for everyone except signed-in staff.</p>

              {form.maintenance_mode && (
                <div className="flex items-start gap-2.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400 text-sm px-4 py-3 rounded-xl mb-2">
                  <Bi name="exclamation-triangle-fill" size={15} className="shrink-0 mt-0.5" />
                  <span>Maintenance mode is currently <strong>ON</strong> — visitors see a maintenance notice instead of the marketplace.</span>
                </div>
              )}

              <SettingRow label="Enable maintenance mode" description="The homepage and browse pages show a maintenance notice instead of listings.">
                <Toggle checked={!!form.maintenance_mode} onChange={v => set('maintenance_mode', v)} />
              </SettingRow>
              <div className="py-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1.5">Message shown to visitors</p>
                <textarea
                  value={form.maintenance_message ?? ''}
                  onChange={e => set('maintenance_message', e.target.value)}
                  rows={3}
                  placeholder="We're performing scheduled maintenance and will be back shortly. Thanks for your patience."
                  className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Your Account</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{user?.name}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">{user?.email}</p>
                  <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                    Super Admin
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {[
                  { label: 'Access',  value: 'Full platform access' },
                  { label: 'Auth',    value: 'Laravel Sanctum' },
                  { label: 'Backend', value: 'Laravel 11' },
                  { label: 'Frontend', value: 'React + Vite' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                To update your name, password, or avatar, head to your{' '}
                <a href="/admin/profile" className="text-blue-600 dark:text-blue-400 hover:underline">profile page</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
