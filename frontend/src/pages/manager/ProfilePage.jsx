import ManagerLayout from '../../layouts/ManagerLayout';
import ProfileForm from '../../components/ProfileForm';
import { getManagerProfile, updateManagerProfile } from '../../api/manager';

export default function ManagerProfilePage() {
  return (
    <ManagerLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your personal information and password</p>
        </div>
        <ProfileForm
          getProfile={getManagerProfile}
          updateProfile={updateManagerProfile}
          accentColor="orange"
        />
      </div>
    </ManagerLayout>
  );
}