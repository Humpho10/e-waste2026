<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use Carbon\Carbon;

class StatsController extends Controller
{
    public function index()
    {
        return response()->json([
            'active_users' => User::count(),

            'listings_this_week' => Product::where('status', 'approved')
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count(),
        ]);
    }
}