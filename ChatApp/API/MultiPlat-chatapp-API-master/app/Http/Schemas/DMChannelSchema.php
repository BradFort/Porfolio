<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un salon de message direct (DM).
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="DMChannel",
 *     type="object",
 *     required={"id", "channel_id"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=5),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="channel",
 *         ref="#/components/schemas/Channel"
 *     ),
 *     @OA\Property(
 *         property="participants",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/User")
 *     )
 * )
 */
class DMChannelSchema {}
