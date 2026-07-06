import AdminLayout from '../../layouts/AdminLayout';
import ProfileForm from '../../components/ProfileForm';
import { getAdminProfile, updateAdminProfile } from '../../api/admin';

export default function AdminProfilePage() {
  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your personal information and password</p>
        </div>
        <ProfileForm
          getProfile={getAdminProfile}
          updateProfile={updateAdminProfile}
          accentColor="blue"
        />
      </div>
    </AdminLayout> 
  );
}