import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import ProfileForm from '../../components/ProfileForm';
import { getPMProfile, updatePMProfile } from '../../api/productManager';

export default function ProfilePage() {
  return (
    <WorkspaceLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your personal information and password</p>
        </div>
        <ProfileForm
          getProfile={getPMProfile}
          updateProfile={updatePMProfile}
          accentColor="teal"
        />
      </div>
    </WorkspaceLayout>
  );
}
