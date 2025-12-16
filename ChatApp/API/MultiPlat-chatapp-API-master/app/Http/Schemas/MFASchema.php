<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour l'authentification multi-facteurs (MFA).
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="MFACode",
 *     type="object",
 *     required={"id", "user_id", "code", "expires_at"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="code", type="string", example="123456"),
 *     @OA\Property(property="expires_at", type="string", format="date-time"),
 *     @OA\Property(property="used", type="boolean", example=false),
 *     @OA\Property(property="ip_address", type="string", example="192.168.1.1"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class MFASchema {}

