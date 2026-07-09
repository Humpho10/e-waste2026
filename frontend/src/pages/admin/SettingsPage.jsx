import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { useToast } from '../../components/Toast';
import { getSettings, updateSettings } from '../../api/admin';

const TABS = [
  { key: 'general',       label: 'General',       icon: 'building-fill-gear', color: 'from-blue-500 to-indigo-600' },
  { key: 'branding',      label: 'Branding',       icon: 'palette-fill', color: 'from-pink-500 to-rose-600' },
  { key: 'marketplace',   label: 'Marketplace',    icon: 'shop', color: 'from-emerald-500 to-teal-600' },
  { key: 'security',      label: 'Security',       icon: 'shield-lock-fill', color: 'from-amber-500 to-orange-600' },
  { key: 'notifications', label: 'Notifications',  icon: 'bell-fill', color: 'from-violet-500 to-purple-600' },
  { key: 'maintenance',   label: 'Maintenance',    icon: 'cone-striped', color: 'from-gray-500 to-slate-600' },
];

function Toggle({ checked, onChange, disabled, color = 'blue' }) {
  const colors = {
    blue:   { on: 'bg-blue-600', thumb: 'translate-x-6' },
    emerald:{ on: 'bg-emerald-600', thumb: 'translate-x-6' },
    orange: { on: 'bg-orange-600', thumb: 'translate-x-6' },
    red:    { on: 'bg-red-600', thumb: 'translate-x-6' },
    violet: { on: 'bg-violet-600', thumb: 'translate-x-6' },
    gray:   { on: 'bg-gray-600', thumb: 'translate-x-6' },
  };
  const c = colors[color] || colors.blue;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? c.on : 'bg-gray-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200 ${
          checked ? c.thumb : 'translate-x-1'
        }`}
      >
        {checked && <Bi name="check2" size={10} className="text-blue-600" />}
      </span>
    </button>
  );
}

function SettingRow({ label, description, children, section }) {
  return (
    <div className={`flex items-start justify-between gap-6 py-4 ${section ? 'mt-6 first:mt-0' : 'border-b border-gray-100 dark:border-slate-800'} last:border-0`}>
      <div className="min-w-0">
        {section && (
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{section}</p>
        )}
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-md leading-relaxed">{description}</p>}
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
      className={`border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${className}`}
    />
  );
}

function SaveBar({ dirty, saving, onSave, onDiscard }) {
  if (!dirty) return null;
  return (
    <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-gray-100 dark:border-slate-800">
      <button
        onClick={onDiscard}
        type="button"
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
      >
        Discard Changes
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        type="button"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:cursor-not-allowed transition-all"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Bi name="check-lg" size={14} />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}

function SectionHeader({ title, description, icon, gradient }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-slate-800">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Bi name={icon} className="text-white" size={18} />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => getSettings().then(res => res.data.settings),
  });

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (payload) => updateSettings(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['admin-settings'], res.data.settings);
      setForm(res.data.settings);
      toast('Settings saved successfully', 'success');
    },
    onError: (err) => {
      toast(err.response?.data?.message || 'Failed to save settings', 'error');
    },
  });

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const dirty = form && data && JSON.stringify(form) !== JSON.stringify(data);
  const discard = () => setForm(data);

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
    maintenance:   [
      'maintenance_mode', 'maintenance_message',
      'maintenance_allow_admin_login', 'maintenance_allow_pm_login', 'maintenance_allow_user_login',
    ],
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bi name="gear-fill" className="text-white" size={20} />
          </div>
          Settings
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage platform configuration, security, and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  activeTab === tab.key
                    ? 'bg-white/20'
                    : `bg-gradient-to-br ${tab.color} text-white opacity-60 group-hover:opacity-100`
                }`}>
                  <Bi name={tab.icon} size={13} />
                </div>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6">

            {activeTab === 'general' && (
              <div>
                <SectionHeader
                  title="General Settings"
                  description="Basic identity and contact details of the platform"
                  icon="building-fill-gear"
                  gradient="from-blue-500 to-indigo-600"
                />
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
                <SectionHeader
                  title="Branding & Social"
                  description="Tagline and social media links for the homepage footer"
                  icon="palette-fill"
                  gradient="from-pink-500 to-rose-600"
                />
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
                <SectionHeader
                  title="Marketplace Rules"
                  description="Controls that apply when a seller submits a listing"
                  icon="shop"
                  gradient="from-emerald-500 to-teal-600"
                />
                <SettingRow label="Auto-approve listings" description="New listings publish immediately instead of waiting in the review queue.">
                  <Toggle checked={!!form.auto_approve_listings} onChange={v => set('auto_approve_listings', v)} color="emerald" />
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
                <SectionHeader
                  title="Security & Access"
                  description="Password policy, login protection, and session management"
                  icon="shield-lock-fill"
                  gradient="from-amber-500 to-orange-600"
                />

                <SettingRow section="Password Policy"><div /></SettingRow>
                <SettingRow label="Minimum password length" description="Enforced on registration, password resets, and admin-created accounts.">
                  <TextField type="number" value={form.min_password_length} onChange={v => set('min_password_length', v)} className="w-24 text-center" />
                </SettingRow>
                <SettingRow label="Require strong passwords" description="Must contain at least one letter and one number.">
                  <Toggle checked={!!form.require_strong_password} onChange={v => set('require_strong_password', v)} color="orange" />
                </SettingRow>

                <SettingRow section="Login Protection"><div /></SettingRow>
                <SettingRow label="Max login attempts" description="Failed sign-ins beyond this many trigger a temporary lockout.">
                  <TextField type="number" value={form.max_login_attempts} onChange={v => set('max_login_attempts', v)} className="w-24 text-center" />
                </SettingRow>
                <SettingRow label="Lockout duration (minutes)" description="How long a locked-out email + IP combination must wait before retrying.">
                  <TextField type="number" value={form.lockout_duration_minutes} onChange={v => set('lockout_duration_minutes', v)} className="w-24 text-center" />
                </SettingRow>
                <SettingRow label="Session lifetime (minutes)" description="Leave blank so sign-ins never expire automatically.">
                  <TextField type="number" value={form.session_lifetime_minutes} onChange={v => set('session_lifetime_minutes', v)} placeholder="Never" className="w-32 text-center" />
                </SettingRow>

                <SettingRow section="Access Control"><div /></SettingRow>
                <SettingRow label="Require email verification to sign in" description="Users with an unverified email address are blocked from logging in.">
                  <Toggle checked={!!form.require_email_verification} onChange={v => set('require_email_verification', v)} color="orange" />
                </SettingRow>
                <SettingRow label="Allow Google sign-in" description="Turns off the Continue with Google option on Login and Register.">
                  <Toggle checked={!!form.allow_google_login} onChange={v => set('allow_google_login', v)} color="orange" />
                </SettingRow>
                <SettingRow label="Allow public registration" description="When off, new accounts (including via Google) can no longer sign up.">
                  <Toggle checked={!!form.allow_public_registration} onChange={v => set('allow_public_registration', v)} color="orange" />
                </SettingRow>

                <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <SectionHeader
                  title="Notifications"
                  description="Choose what Admins and Super Admins get notified about"
                  icon="bell-fill"
                  gradient="from-violet-500 to-purple-600"
                />
                <SettingRow label="New user signups" description="Notify Super Admins whenever an account is created from the admin console.">
                  <Toggle checked={!!form.notify_admins_on_new_user} onChange={v => set('notify_admins_on_new_user', v)} color="violet" />
                </SettingRow>
                <SettingRow label="New listings" description="Notify Admins and Super Admins whenever a listing is submitted or resubmitted.">
                  <Toggle checked={!!form.notify_admins_on_new_listing} onChange={v => set('notify_admins_on_new_listing', v)} color="violet" />
                </SettingRow>
                <SettingRow label="New messages" description="Oversight ping to Admins and Super Admins whenever a buyer and seller exchange a message.">
                  <Toggle checked={!!form.notify_admins_on_new_message} onChange={v => set('notify_admins_on_new_message', v)} color="violet" />
                </SettingRow>
                <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div>
                <SectionHeader
                  title="Maintenance Mode"
                  description="Take the public storefront offline for everyone except signed-in staff"
                  icon="cone-striped"
                  gradient="from-gray-500 to-slate-600"
                />

                {form.maintenance_mode && (
                  <div className="flex items-start gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400 text-sm px-4 py-3 rounded-xl mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                      <Bi name="exclamation-triangle-fill" size={15} />
                    </div>
                    <div>
                      <p className="font-semibold">Maintenance mode is ACTIVE</p>
                      <p className="text-xs opacity-80 mt-0.5">Visitors see a maintenance notice instead of the marketplace.</p>
                    </div>
                  </div>
                )}

                <SettingRow label="Enable maintenance mode" description="The homepage and browse pages show a maintenance notice instead of listings.">
                  <Toggle checked={!!form.maintenance_mode} onChange={v => set('maintenance_mode', v)} color="gray" />
                </SettingRow>
                <div className="py-4 border-b border-gray-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Maintenance Message</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5">Message shown to visitors when maintenance mode is enabled.</p>
                  <textarea
                    value={form.maintenance_message ?? ''}
                    onChange={e => set('maintenance_message', e.target.value)}
                    rows={3}
                    placeholder="We're performing scheduled maintenance and will be back shortly. Thanks for your patience."
                    className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all outline-none"
                  />
                </div>

                <SettingRow section="Sign-in Access During Maintenance"><div /></SettingRow>
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-3 mb-2 leading-relaxed">
                  While maintenance mode is on, only the Super Admin can always sign in. Re-open sign-in for specific
                  roles below — each can be toggled independently, so you can bring staff back in first and
                  regular users later.
                </p>
                <SettingRow label="Allow Admin sign-in" description="Admins can sign in and use their dashboard while maintenance mode is active.">
                  <Toggle checked={!!form.maintenance_allow_admin_login} disabled={!form.maintenance_mode} onChange={v => set('maintenance_allow_admin_login', v)} color="gray" />
                </SettingRow>
                <SettingRow label="Allow Product Manager sign-in" description="Product Managers can sign in and review listings while maintenance mode is active.">
                  <Toggle checked={!!form.maintenance_allow_pm_login} disabled={!form.maintenance_mode} onChange={v => set('maintenance_allow_pm_login', v)} color="gray" />
                </SettingRow>
                <SettingRow label="Allow regular User sign-in" description="Buyers and sellers can sign in while maintenance mode is active.">
                  <Toggle checked={!!form.maintenance_allow_user_login} disabled={!form.maintenance_mode} onChange={v => set('maintenance_allow_user_login', v)} color="gray" />
                </SettingRow>

                <SaveBar dirty={dirty} saving={mutation.isPending} onSave={save} onDiscard={discard} />
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}