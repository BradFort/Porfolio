<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un message.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="Message",
 *     type="object",
 *     required={"id", "content", "user_id", "channel_id", "type"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(
 *         property="type",
 *         type="string",
 *         enum={"text", "voice", "attachment"},
 *         example="text",
 *         description="Type de message"
 *     ),
 *     @OA\Property(property="content", type="string", example="Bonjour tout le monde!"),
 *     @OA\Property(
 *         property="file_url",
 *         type="string",
 *         nullable=true,
 *         example="http://example.com/storage/voice-messages/1234567890_1.webm",
 *         description="URL du fichier (pour type=voice ou attachment)"
 *     ),
 *     @OA\Property(
 *         property="duration",
 *         type="integer",
 *         nullable=true,
 *         example=45,
 *         description="Durée en secondes (uniquement pour type=voice, max 60)"
 *     ),
 *     @OA\Property(
 *         property="file_name",
 *         type="string",
 *         nullable=true,
 *         example="document.pdf",
 *         description="Nom original du fichier (uniquement pour type=attachment)"
 *     ),
 *     @OA\Property(
 *         property="file_size",
 *         type="integer",
 *         nullable=true,
 *         example=1048576,
 *         description="Taille du fichier en octets (uniquement pour type=attachment)"
 *     ),
 *     @OA\Property(
 *         property="mime_type",
 *         type="string",
 *         nullable=true,
 *         example="application/pdf",
 *         description="Type MIME du fichier (uniquement pour type=attachment)"
 *     ),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="channel_id", type="integer", example=1),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="user",
 *         ref="#/components/schemas/User"
 *     ),
 *     @OA\Property(
 *         property="channel",
 *         ref="#/components/schemas/Channel"
 *     )
 * )
 */
class MessageSchema {}
