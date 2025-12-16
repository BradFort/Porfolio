<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour une invitation.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="Invitation",
 *     type="object",
 *     required={"id", "channel_id", "inviter_id", "invited_user_id", "status"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=1),
 *     @OA\Property(property="inviter_id", type="integer", example=1),
 *     @OA\Property(property="invited_user_id", type="integer", example=2),
 *     @OA\Property(property="status", type="string", enum={"pending", "accepted", "rejected", "expired"}, example="pending"),
 *     @OA\Property(property="message", type="string", example="Rejoins-nous dans ce salon !"),
 *     @OA\Property(property="expires_at", type="string", format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class InvitationSchema {}

