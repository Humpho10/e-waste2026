import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';

function SettingsPage() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Platform configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Platform Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-700 mb-4">Platform Info</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Platform Name', value: 'NWT Marketplace' },
              { label: 'Organisation',  value: 'NWT Uganda'      },
              { label: 'Version',       value: '1.0.0'           },
              { label: 'Environment',   value: 'Development'     },
              { label: 'Backend',       value: 'Laravel 11'      },
              { label: 'Frontend',      value: 'React + Vite'    },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logged in Admin Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-700 mb-4">Your Account</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                Super Admin
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Role',       value: 'Super Admin'         },
              { label: 'Access',     value: 'Full platform access' },
              { label: 'Auth',       value: 'Laravel Sanctum'     },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2">
          <h3 className="font-bold text-gray-700 mb-4">Tech Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '⚙️', name: 'Laravel 11',   desc: 'Backend API'         },
              { icon: '⚛️', name: 'React + Vite', desc: 'Frontend'            },
              { icon: '🎨', name: 'Tailwind CSS', desc: 'Styling'             },
              { icon: '🔐', name: 'Sanctum',      desc: 'Authentication'      },
              { icon: '🛡️', name: 'Spatie',       desc: 'Roles & Permissions' },
              { icon: '🗄️', name: 'MySQL',        desc: 'Database'            },
              { icon: '🐘', name: 'Laragon',      desc: 'Local Server'        },
              { icon: '🔀', name: 'Axios',        desc: 'HTTP Client'         },
            ].map(({ icon, name, desc }) => (
              <div key={name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{name}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SettingsPage;