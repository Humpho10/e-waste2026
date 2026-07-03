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
use App\Models\EmailVerification;
use App\Mail\VerifyEmailMail;
use Illuminate\Support\Facades\Mail;
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

        $this->sendVerificationEmail($user);

        // No token/auto-login — the user must verify their email, then sign in.
        return response()->json([
            'message' => 'Registration successful. Please check your email to verify your account before signing in.',
            'email'   => $user->email,
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

    // Confirm a user's email address using the token from the verification link.
    public function verifyEmail(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $record = EmailVerification::where('token', $request->token)->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or already-used verification link.'], 422);
        }

        if ($record->expires_at->isPast()) {
            return response()->json(['message' => 'This verification link has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $record->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        EmailVerification::where('email', $record->email)->delete();

        return response()->json(['message' => 'Email verified successfully.']);
    }

    // Resend the verification email to the currently authenticated user.
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'This account is already verified.'], 400);
        }

        $this->sendVerificationEmail($user);

        return response()->json(['message' => 'Verification email sent.']);
    }

    // Generate a fresh verification token for the user and email it to them.
    private function sendVerificationEmail(User $user): void
    {
        EmailVerification::where('email', $user->email)->delete();

        $token = Str::random(64);

        EmailVerification::create([
            'email'      => $user->email,
            'token'      => $token,
            'expires_at' => now()->addHours(24),
        ]);

        Mail::to($user->email)->send(new VerifyEmailMail($user->name, $token));
    }
}