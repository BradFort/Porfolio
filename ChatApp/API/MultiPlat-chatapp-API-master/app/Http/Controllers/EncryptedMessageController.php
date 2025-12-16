<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des messages chiffrés (E2EE).
 * Permet d'envoyer et de récupérer des messages chiffrés avec AES-256 côté client.
 */

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\EncryptedMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur pour les messages chiffrés E2EE - Version simplifiée
 * Les messages sont chiffrés avec AES-256 côté client
 */
class EncryptedMessageController extends Controller
{
    /**
     * @OA\Post(
     *     path="/chatappAPI/encrypted-messages",
     *     summary="Envoyer un message chiffré E2EE (AES-256-GCM)",
     *     tags={"Messages Chiffrés"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"channel_id", "encrypted_content", "iv", "auth_tag"},
     *             @OA\Property(property="channel_id", type="integer", example=1),
     *             @OA\Property(property="encrypted_content", type="string", example="base64_encrypted..."),
     *             @OA\Property(property="iv", type="string", example="base64_iv..."),
     *             @OA\Property(property="auth_tag", type="string", example="base64_tag...")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Message envoyé"),
     *     @OA\Response(response=403, description="Non membre")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel_id' => 'required|integer|exists:channels,id',
            'encrypted_content' => 'required|string',
            'iv' => 'required|string',
            'auth_tag' => 'required|string',
        ]);

        /** @var User $user */
        $user = Auth::user();
        $channelId = $validated['channel_id'];

        // Vérifier que l'utilisateur est membre du channel
        $isMember = DB::table('user_channels')
            ->where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas membre de ce channel'
            ], 403);
        }

        // Stocker le message chiffré (le serveur ne peut PAS le lire)
        $message = EncryptedMessage::create([
            'channel_id' => $channelId,
            'sender_id' => $user->id,
            'encrypted_content' => $validated['encrypted_content'],
            'content_iv' => $validated['iv'],
            'content_auth_tag' => $validated['auth_tag'],
        ]);

        // Charger la relation sender pour le retour
        $message->load('sender:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Message chiffré envoyé avec succès',
            'data' => [
                'id' => $message->id,
                'channel_id' => $message->channel_id,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender->name,
                'encrypted_content' => $message->encrypted_content,
                'iv' => $message->content_iv,
                'auth_tag' => $message->content_auth_tag,
                'created_at' => $message->created_at->toIso8601String(),
            ]
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/encrypted-messages/channel/{channelId}",
     *     summary="Lister les messages chiffrés d'un salon",
     *     tags={"Messages Chiffrés"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channelId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Liste des messages chiffrés"),
     *     @OA\Response(response=403, description="Non membre")
     * )
     */
    public function index(int $channelId, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Vérifier que l'utilisateur est membre du channel
        $isMember = DB::table('user_channels')
            ->where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas membre de ce channel'
            ], 403);
        }

        $limit = min($request->input('limit', 50), 100); // Max 100 messages
        $beforeId = $request->input('before_id');

        $query = EncryptedMessage::where('channel_id', $channelId)
            ->with('sender:id,name');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'channel_id' => $message->channel_id,
                    'sender_id' => $message->sender_id,
                    'sender_name' => $message->sender->name,
                    'encrypted_content' => $message->encrypted_content,
                    'iv' => $message->content_iv,
                    'auth_tag' => $message->content_auth_tag,
                    'created_at' => $message->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'channel_id' => $channelId,
                'messages' => $messages,
                'count' => $messages->count()
            ]
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/encrypted-messages/{messageId}",
     *     summary="Récupérer un message chiffré spécifique",
     *     tags={"Messages Chiffrés"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="messageId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Message chiffré"),
     *     @OA\Response(response=404, description="Message non trouvé")
     * )
     */
    public function show(int $messageId): JsonResponse
    {
        $message = EncryptedMessage::with('sender:id,name')->findOrFail($messageId);

        /** @var User $user */
        $user = Auth::user();

        // Vérifier que l'utilisateur est membre du channel
        $isMember = DB::table('user_channels')
            ->where('channel_id', $message->channel_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas membre de ce channel'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $message->id,
                'channel_id' => $message->channel_id,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender->name,
                'encrypted_content' => $message->encrypted_content,
                'iv' => $message->content_iv,
                'auth_tag' => $message->content_auth_tag,
                'created_at' => $message->created_at->toIso8601String(),
            ]
        ]);
    }
}
