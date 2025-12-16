<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un utilisateur.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     required={"id", "name", "email", "role"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="John Doe"),
 *     @OA\Property(property="email", type="string", format="email", example="john@example.com"),
 *     @OA\Property(property="status", type="string", example="online"),
 *     @OA\Property(property="role", type="string", enum={"user", "moderator", "admin"}, example="user"),
 *     @OA\Property(property="theme", type="string", example="dark"),
 *     @OA\Property(property="lang", type="string", example="fr"),
 *     @OA\Property(property="disabled_notifs", type="array", @OA\Items(type="integer")),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class UserSchema {}
