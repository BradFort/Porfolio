<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un salon (channel).
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="Channel",
 *     type="object",
 *     required={"id", "name", "type"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Général"),
 *     @OA\Property(property="type", type="string", enum={"public", "private", "dm"}, example="public"),
 *     @OA\Property(property="description", type="string", example="Canal principal de discussion"),
 *     @OA\Property(property="created_by", type="integer", example=1),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="creator",
 *         ref="#/components/schemas/User"
 *     ),
 *     @OA\Property(
 *         property="members",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/User")
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="ChannelDetail",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/Channel"),
 *         @OA\Schema(
 *             @OA\Property(property="member_count", type="integer", example=5),
 *             @OA\Property(property="last_message", ref="#/components/schemas/Message")
 *         )
 *     }
 * )
 */
class ChannelSchema {}
