<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $primaryKey = 'product_id';

    protected $fillable = [
        'seller_id',
        'category_id',
        'subcategory_id',
        'title',
        'description',
        'condition',
        'price',
        'specification',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'resubmitted_at',
        'slug',
        'hash_id',
    ];

    protected $casts = [
        'reviewed_at'    => 'datetime',
        'resubmitted_at' => 'datetime',
        'price'          => 'decimal:2',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            // Generate hash_id if not set
            if (empty($product->hash_id)) {
                $product->hash_id = $product->generateHashId();
            }
            
            // Generate slug from title
            $product->slug = $product->generateUniqueSlug($product->title);
        });

        static::updating(function ($product) {
            // If title changes, update slug
            if ($product->isDirty('title')) {
                $product->slug = $product->generateUniqueSlug($product->title);
            }
        });
    }

    /**
     * Generate unique hash ID
     */
    private function generateHashId(): string
    {
        $hash = Str::random(20);
        
        // Ensure uniqueness
        while (self::where('hash_id', $hash)->exists()) {
            $hash = Str::random(20);
        }
        
        return $hash;
    }

    /**
     * Generate unique slug from title
     */
    private function generateUniqueSlug(string $title): string
    {
        $slug = Str::slug($title);
        
        // Fallback if slug is empty
        if (empty($slug)) {
            $slug = 'product-' . Str::random(6);
        }
        
        // Check for duplicates
        $existingSlugs = self::where('slug', 'LIKE', "{$slug}%")
            ->when($this->exists, function ($query) {
                return $query->where('product_id', '!=', $this->product_id);
            })
            ->pluck('slug')
            ->toArray();
        
        // If no duplicates, return the slug
        if (!in_array($slug, $existingSlugs)) {
            return $slug;
        }
        
        // Add number suffix for duplicates
        $counter = 1;
        $newSlug = $slug . '-' . $counter;
        
        while (in_array($newSlug, $existingSlugs)) {
            $counter++;
            $newSlug = $slug . '-' . $counter;
        }
        
        return $newSlug;
    }

    /**
     * Get the route URL with slug and hash_id
     */
    public function getRouteUrl(): string
    {
        return "/product/{$this->slug}-{$this->hash_id}";
    }

    // =============================================
    // RELATIONSHIPS
    // =============================================

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id', 'id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class, 'subcategory_id', 'subcategory_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id', 'product_id');
    }
}