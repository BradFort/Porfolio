<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour la relation utilisateur-channel.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="UserChannel",
 *     type="object",
 *     required={"user_id", "channel_id"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=1),
 *     @OA\Property(property="role", type="string", enum={"admin", "member"}, example="member"),
 *     @OA\Property(property="joined_at", type="string", format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="user",
 *         ref="#/components/schemas/User"
 *     )
 * )
 */
class UserChannelSchema {}
