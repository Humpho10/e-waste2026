import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiShield, FiCheckCircle, FiBriefcase, FiStar } from 'react-icons/fi';
import ManagerLayout from '../../layouts/ManagerLayout';
import ProfileForm from '../../components/ProfileForm';
import { getManagerProfile, updateManagerProfile } from '../../api/manager';

export default function ManagerProfilePage() {
  return (
    <ManagerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header with gradient - Orange theme for managers */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-3xl p-8 border border-orange-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <FiBriefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                      Manager Profile
                      <span className="text-sm font-normal bg-orange-50 text-orange-600 px-3 py-1 rounded-full flex items-center gap-1">
                        <FiStar className="w-3 h-3" />
                        Manager
                      </span>
                    </h2>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <FiEdit2 className="w-4 h-4 text-orange-400" />
                      Update your personal information and password
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Manager badge */}
              <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-slate-600">Active</span>
                </div>
                <div className="w-px h-4 bg-orange-200" />
                <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                  <FiShield className="w-3 h-3" />
                  Admin Access
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form with orange accent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProfileForm
            getProfile={getManagerProfile}
            updateProfile={updateManagerProfile}
            accentColor="orange"
          />
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-full border border-orange-200">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-xs text-orange-600 font-medium">Manager Account</span>
            </div>
            <div className="w-px h-3 bg-orange-200" />
            <span className="text-xs text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </motion.div>
      </div>
    </ManagerLayout>
  );
}