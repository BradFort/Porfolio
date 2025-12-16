<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour le chiffrement E2EE.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="UserE2eeKey",
 *     type="object",
 *     required={"user_id", "public_key"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="public_key", type="string", example="-----BEGIN PUBLIC KEY-----\nMIICIjANBg..."),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="E2eeSessionKey",
 *     type="object",
 *     required={"channel_id", "user_id", "encrypted_session_key"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="encrypted_session_key", type="string", example="base64_encrypted_key..."),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="EncryptedMessage",
 *     type="object",
 *     required={"id", "channel_id", "sender_id", "encrypted_content", "content_iv", "content_auth_tag"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=1),
 *     @OA\Property(property="sender_id", type="integer", example=1),
 *     @OA\Property(property="encrypted_content", type="string", example="base64_encrypted_content..."),
 *     @OA\Property(property="content_iv", type="string", example="base64_iv..."),
 *     @OA\Property(property="content_auth_tag", type="string", example="base64_auth_tag..."),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class E2EESchema {}

