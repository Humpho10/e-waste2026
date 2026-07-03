<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;
use App\Models\PasswordResetOtp;
use App\Mail\PasswordResetOtpMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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

        // Assign the default buyer/seller role so new users get dashboard access.
        $user->assignRole('User');

        $token = $user->createToken('auth_token')->plainTextToken;

        $permissions = $user->getAllPermissions()->pluck('name');
        $role = $user->roles->first()?->name ?? 'User';

        return response()->json([
            'message'     => 'Registration successful',
            'user'        => $user->load('roles'),
            'token'       => $token,
            'role'        => $role,
            'permissions' => $permissions,
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

        $permissions = $user->getAllPermissions()->pluck('name');
        $role = $user->roles->first()?->name ?? 'user';

        return response()->json([
            'message'     => 'Login successful',
            'user'        => $user,
            'token'       => $token,
            'role'        => $role,
            'permissions' => $permissions,
        ]);
    }

    // Sign in / sign up with a Google Identity Services credential (ID token).
    // The frontend posts { credential } after the user picks an account in
    // the Google button — we verify it server-side before trusting anything.
    public function google(Request $request)
    {
        $request->validate([
            'credential' => 'required|string',
        ]);

        $clientId = config('services.google.client_id');

        if (!$clientId) {
            return response()->json([
                'message' => 'Google sign-in is not configured on the server yet.',
            ], 503);
        }

        // Verify the ID token with Google. This checks the signature, audience
        // and expiry for us — no extra package required.
        $verify = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->credential,
        ]);

        if (!$verify->ok()) {
            return response()->json([
                'message' => 'Your Google sign-in could not be verified. Please try again.',
            ], 401);
        }

        $payload = $verify->json();

        if (($payload['aud'] ?? null) !== $clientId) {
            return response()->json([
                'message' => 'This Google sign-in was issued for a different app.',
            ], 401);
        }

        if (($payload['email_verified'] ?? 'false') !== 'true') {
            return response()->json([
                'message' => 'Your Google email address is not verified.',
            ], 422);
        }

        $email = $payload['email'] ?? null;
        $name  = $payload['name'] ?? explode('@', (string) $email)[0] ?? 'Google User';

        if (!$email) {
            return response()->json([
                'message' => 'Google did not return an email address for this account.',
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name'              => $name,
                'email'             => $email,
                // Random password — this account only ever signs in via Google,
                // but the column is required (and this keeps it unusable for
                // normal login attempts).
                'password'          => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'is_active'         => true,
            ]);

            $user->assignRole('User');
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        $user->load('roles');
        $token = $user->createToken('auth_token')->plainTextToken;

        $permissions = $user->getAllPermissions()->pluck('name');
        $role = $user->roles->first()?->name ?? 'User';

        return response()->json([
            'message'     => 'Google sign-in successful',
            'user'        => $user,
            'token'       => $token,
            'role'        => $role,
            'permissions' => $permissions,
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

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Don't reveal whether the email exists — respond the same either way.
        if ($user) {
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $expiresInSeconds = 300; // 5 minutes

            PasswordResetOtp::where('email', $request->email)->delete();
            PasswordResetOtp::create([
                'email'      => $request->email,
                'otp'        => $otp,
                'expires_at' => now()->addSeconds($expiresInSeconds),
            ]);

            Mail::to($request->email)->send(new PasswordResetOtpMail($otp));
        }

        return response()->json([
            'message'    => 'If that email exists, a code has been sent.',
            'expires_in' => 300,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'otp'      => 'required|digits:6',
            'password' => 'required|min:8|confirmed', // expects password_confirmation
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        if ($record->expires_at->isPast()) {
            return response()->json(['message' => 'This code has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        PasswordResetOtp::where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}