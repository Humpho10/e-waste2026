<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
];
   
protected $casts = [
        'reviewed_at'    => 'datetime',
        'resubmitted_at' => 'datetime',
        'price'          => 'decimal:2',
    ];




    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id', 'id'); // Links to users.id
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
