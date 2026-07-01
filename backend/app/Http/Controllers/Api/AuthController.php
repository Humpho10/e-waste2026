<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

class AuthController extends Controller
{
    // Register a new user
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'required|string|max:20',
            'location' => 'required|string|max:100',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'phone'    => $validated['phone'],
            'location' => $validated['location'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user'    => $user->load('roles'),
            'token'   => $token,
        ], 201);
    }

    // Login
    public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($request->only('email', 'password'))) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }
     /** @var \App\Models\User $user */
    $user = Auth::user();

    if (!$user->is_active) {
        return response()->json([
            'message' => 'Your account has been deactivated. Please contact support.',
        ], 403);
    }

    $user->load('roles');
    $token = $user->createToken('auth_token')->plainTextToken;

    // 🔥 NEW: Get all permissions for this user
    $permissions = $user->getAllPermissions()->pluck('name');

    $role = $user->roles->first()?->name ?? 'user';

    return response()->json([
        'message'     => 'Login successful',
        'user'        => $user,
        'token'       => $token,
        'role'        => $role,
        'permissions' => $permissions, // 👈 This is what React will use
    ]);
}

    // Get currently logged in user
    public function me(Request $request)
{
    $user = $request->user()->load('roles');
    $permissions = $user->getAllPermissions()->pluck('name');

    return response()->json([
        'user'        => $user,
        'permissions' => $permissions,
    ]);
}

    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}