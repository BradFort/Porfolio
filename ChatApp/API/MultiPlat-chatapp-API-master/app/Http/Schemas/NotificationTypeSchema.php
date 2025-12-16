<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un type de notification.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="NotificationType",
 *     type="object",
 *     required={"id", "type"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="type", type="string", example="all")
 * )
 *
 * @OA\Schema(
 *     schema="NotificationTypeState",
 *     type="object",
 *     required={"id", "type", "disabled"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="type", type="string", example="all"),
 *     @OA\Property(property="disabled", type="boolean", example=false)
 * )
 */
class NotificationTypeSchema {}
