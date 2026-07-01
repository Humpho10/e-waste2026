<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Auth;
use App\Helpers\AuditLogger;
use Spatie\Permission\PermissionRegistrar;

class AdminController extends Controller
{
    /**
     * @var \App\Models\User|null
     */
    protected $user;

    /**
     * Constructor – set the authenticated user once.
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            /** @var \App\Models\User $user */
            $this->user = $request->user();
            return $next($request);
        });
    }

    // ── Stats ─────────────────────────────────────────────
    public function stats()
    {
        if (!$this->user->can('dashboard-view') &&
            !$this->user->can('user-list') &&
            !$this->user->can('role-list') &&
            !$this->user->can('permission-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view dashboard stats.'], 403);
        }

        try {
            return response()->json([
                'total_users'        => User::count(),
                'total_admins'       => User::role('Admin')->count(),
                'total_managers'     => User::role('Product-Manager')->count(),
                'total_roles'        => Role::count(),
                'total_permissions'  => Permission::count(),
                'recent_users'       => User::with('roles')
                                            ->latest()
                                            ->take(5)
                                            ->get(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    // ── All Users ─────────────────────────────────────────
    public function getUsers(Request $request)
    {
        if (!$this->user->can('user-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view users.'], 403);
        }

        $query = User::with('roles');

        if ($request->has('role') && $request->role !== 'all') {
            $query->role($request->role);
        }

        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name',  'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->latest()->get();
        return response()->json(['users' => $users]);
    }

    public function createUser(Request $request)
    {
        if (!$this->user->can('user-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create users.'], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'nullable|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if (!empty($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        $this->notifySuperAdmins(
            'user_created',
            "New user \"{$user->name}\" ({$user->email}) was created.",
            $user->id
        );

        return response()->json([
            'message' => 'User created successfully',
            'user'    => $user->load('roles'),
        ], 201);
    }

    public function updateUser(Request $request, $id)
    {
        if (!$this->user->can('user-edit')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to edit users.'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role'  => 'nullable|string|exists:roles,name',
        ]);

        $user->update([
            'name'  => $validated['name']  ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
        ]);

        if (array_key_exists('role', $validated)) {
            $user->syncRoles($validated['role'] ? [$validated['role']] : []);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $user->load('roles'),
        ]);
    }

    public function deleteUser($id)
    {
        if (!$this->user->can('user-delete')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete users.'], 403);
        }

        $user = User::findOrFail($id);

        // Business rule: cannot delete own account
        if ($user->id === Auth::id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.'
            ], 403);
        }

        // Business rule: cannot delete a Super Admin
        if ($user->hasRole('Super-Admin')) {
            return response()->json([
                'message' => 'Super Admin cannot be deleted.'
            ], 403);
        }

        $userName = $user->name;
        $userEmail = $user->email;

        $user->delete();

        $this->notifySuperAdmins(
            'user_deleted',
            "User \"{$userName}\" ({$userEmail}) was deleted.",
            $id
        );

        return response()->json(['message' => 'User deleted successfully']);
    }

    // ── Managers (Admins) ─────────────────────────────────
    public function getAdmins()
    {
        if (!$this->user->can('admin-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view admins.'], 403);
        }

        try {
            $admins = User::role('Admin')->with('roles')->latest()->get();
            return response()->json(['admins' => $admins]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ], 500);
        }
    }

    public function createAdmin(Request $request)
    {
        if (!$this->user->can('admin-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create admins.'], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole('Admin');

        $this->notifySuperAdmins(
            'admin_created',
            "New Admin account created for \"{$user->name}\" ({$user->email}).",
            $user->id
        );

        return response()->json([
            'message' => 'Admin created successfully',
            'user'    => $user->load('roles'),
        ], 201);
    }

    public function deleteAdmin($id)
    {
        if (!$this->user->can('admin-delete')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete admins.'], 403);
        }

        $user = User::findOrFail($id);

        if (!$user->hasRole('Admin')) {
            return response()->json(['message' => 'User is not an Admin.'], 403);
        }

        $userName = $user->name;

        $user->delete();

        $this->notifySuperAdmins(
            'admin_deleted',
            "Admin account for \"{$userName}\" was removed.",
            $id
        );

        return response()->json(['message' => 'Admin deleted successfully']);
    }

    // ── Roles ─────────────────────────────────────────────
    public function getRoles()
    {
        if (!$this->user->can('role-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view roles.'], 403);
        }

        $roles = Role::with('permissions')->get()->map(function($role) {
            return [
                'id'          => $role->id,
                'name'        => $role->name,
                'guard_name'  => $role->guard_name,
                'permissions' => $role->permissions,
                'users_count' => User::role($role->name)->count(),
            ];
        });

        return response()->json(['roles' => $roles]);
    }

    public function createRole(Request $request)
    {
        if (!$this->user->can('role-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create roles.'], 403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $this->notifySuperAdmins(
            'role_created',
            "New role \"{$role->name}\" was created.",
            $role->id
        );

        return response()->json([
            'message' => 'Role created successfully',
            'role'    => $role->load('permissions'),
        ], 201);
    }

    public function updateRole(Request $request, $id)
    {
        if (!$this->user->can('role-edit')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to update roles.'], 403);
        }

        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name'          => 'sometimes|string|unique:roles,name,' . $id,
            'permissions'   => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (!empty($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if (array_key_exists('permissions', $validated)) {
            $role->syncPermissions($validated['permissions'] ?? []);
        }

        // 🔥 Clear permission cache so changes take effect immediately
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'message' => 'Role updated successfully',
            'role'    => $role->load('permissions'),
        ]);
    }

    public function deleteRole($id)
    {
        if (!$this->user->can('role-delete')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete roles.'], 403);
        }

        $role = Role::findOrFail($id);

        // Business rule: system roles cannot be deleted
        if (in_array($role->name, ['Super-Admin', 'Admin', 'Product-Manager'])) {
            return response()->json([
                'message' => 'System roles cannot be deleted.'
            ], 403);
        }

        $roleName = $role->name;

        $role->delete();

        $this->notifySuperAdmins(
            'role_deleted',
            "Role \"{$roleName}\" was deleted.",
            $id
        );

        return response()->json(['message' => 'Role deleted successfully']);
    }

    // ── Permissions ───────────────────────────────────────
    public function getPermissions()
    {
        if (!$this->user->can('permission-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view permissions.'], 403);
        }

        $permissions = Permission::all();
        return response()->json(['permissions' => $permissions]);
    }

    public function createPermission(Request $request)
    {
        if (!$this->user->can('permission-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create permissions.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);

        $permission = Permission::create([
            'name'       => $validated['name'],
            'guard_name' => 'web',
        ]);

        $this->notifySuperAdmins(
            'permission_created',
            "New permission \"{$permission->name}\" was created.",
            $permission->id
        );

        return response()->json([
            'message'    => 'Permission created successfully',
            'permission' => $permission,
        ], 201);
    }

    public function deletePermission($id)
    {
        if (!$this->user->can('permission-delete')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete permissions.'], 403);
        }

        $permission = Permission::findOrFail($id);
        $name = $permission->name;
        $permission->delete();

        $this->notifySuperAdmins(
            'permission_deleted',
            "Permission \"{$name}\" was deleted.",
            $id
        );

        return response()->json(['message' => 'Permission deleted successfully']);
    }

    // ── Audit Trail ───────────────────────────────────────
    public function getAuditTrail(Request $request)
    {
        if (!$this->user->can('audit-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view audit trail.'], 403);
        }

        $query = \App\Models\AuditTrail::with('user:id,name,email')
            ->latest()
            ->take(100);

        if ($request->has('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        if ($request->has('table') && $request->table !== 'all') {
            $query->where('table_name', $request->table);
        }

        $audit = $query->get()->map(function($entry) {
            return [
                'id'         => $entry->audit_id,
                'user'       => $entry->user?->name ?? 'System',
                'email'      => $entry->user?->email ?? '',
                'action'     => $entry->action,
                'table'      => $entry->table_name,
                'record_id'  => $entry->record_id,
                'old_value'  => $entry->old_value,
                'new_value'  => $entry->new_value,
                'created_at' => $entry->created_at,
            ];
        });

        return response()->json(['audit' => $audit]);
    }

    // ── GET PROFILE ───────────────────────────────────────────
    public function getProfile(Request $request)
    {
        // No permission check – users always see their own profile
        return response()->json(['user' => $request->user()], 200);
    }

    // ── UPDATE PROFILE ────────────────────────────────────────
    public function updateProfile(Request $request)
    {
        // No permission check – users always update their own profile
        $user = $request->user();

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'sometimes|string|max:20',
            'location' => 'sometimes|string|max:100',
            'password' => 'sometimes|string|min:8|confirmed',
            'avatar'   => 'sometimes|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if (isset($validated['name']))     $user->name     = $validated['name'];
        if (isset($validated['phone']))    $user->phone    = $validated['phone'];
        if (isset($validated['location'])) $user->location = $validated['location'];
        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();
        AuditLogger::log('users', $user->id, 'updated', [], $user->toArray());

        return response()->json(['message' => 'Profile updated successfully.', 'user' => $user], 200);
    }

    // ── PRIVATE: Notify all Super Admins ──────────────────────
    private function notifySuperAdmins(string $type, string $message, int $referenceId): void
    {
        $superAdmins = User::role('Super-Admin')->get();
        foreach ($superAdmins as $sa) {
            Notification::create([
                'user_id'      => $sa->id,
                'type'         => $type,
                'reference_id' => $referenceId,
                'message'      => $message,
                'is_read'      => false,
            ]);
        }
    }
}