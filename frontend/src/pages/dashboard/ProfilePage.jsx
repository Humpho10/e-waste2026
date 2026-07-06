import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiShield, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProfileForm from '../../components/ProfileForm';
import { getUserProfile, updateUserProfile } from '../../api/products';

export default function UserProfilePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header with gradient */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                      My Profile
                      <span className="text-sm font-normal bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </h2>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <FiEdit2 className="w-4 h-4 text-slate-400" />
                      Update your personal information and password
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Security badge */}
              <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
                <FiShield className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Secure Account</span>
                <div className="w-px h-4 bg-slate-200" />
                <span className="text-xs text-slate-400">2FA Enabled</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProfileForm
            getProfile={getUserProfile}
            updateProfile={updateUserProfile}
            accentColor="blue"
          />
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500">Profile secured</span>
            </div>
            <div className="w-px h-3 bg-slate-200" />
            <span className="text-xs text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}