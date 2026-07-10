import Bi from './BsIcon';

/**
 * Full-screen "System under maintenance" notice. Shared by MaintenanceGate
 * (public homepage/browse pages for anonymous visitors) and LoginPage /
 * RegisterPage (when a sign-in attempt is rejected because maintenance mode
 * blocks that person's role) — same visual so the experience is consistent
 * wherever someone runs into it.
 *
 * Props:
 *   platformName    – shown in the heading, e.g. "E-Waste Mart"
 *   message          – the Super Admin's custom maintenance message
 *   supportEmail     – optional mailto link
 *   showStaffSignIn  – show the "Staff sign-in" link at the bottom (hidden
 *                      when this is already rendered ON the sign-in page)
 */
export default function MaintenanceNotice({ platformName, message, supportEmail, showStaffSignIn = true }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
          <Bi name="cone-striped" size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {platformName || 'E-Waste Mart'} is down for maintenance
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {message || "We're performing scheduled maintenance and will be back shortly. Thanks for your patience."}
        </p>
        {supportEmail && (
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
          >
            <Bi name="envelope-fill" size={14} /> {supportEmail}
          </a>
        )}
        {showStaffSignIn && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
            <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Staff sign-in <Bi name="arrow-right" size={11} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
