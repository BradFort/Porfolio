<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion du chiffrement de bout en bout (E2EE).
 * Permet d'enregistrer les clés publiques RSA et de distribuer les clés de session AES.
 */

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Channel;
use App\Services\E2EEService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * Contrôleur pour la gestion E2EE simplifié - RSA-4096 + AES-256
 */
class E2EEController extends Controller
{
    protected E2EEService $e2eeService;

    public function __construct(E2EEService $e2eeService)
    {
        $this->e2eeService = $e2eeService;
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/e2ee/keys/register",
     *     summary="Enregistrer la clé publique RSA-4096 de l'utilisateur",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"public_key"},
     *             @OA\Property(property="public_key", type="string", example="-----BEGIN PUBLIC KEY-----\nMIICIjANBg...")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Clé enregistrée"),
     *     @OA\Response(response=409, description="Erreur")
     * )
     */
    public function registerKeys(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'public_key' => 'required|string',
        ]);

        /** @var User $user */
        $user = Auth::user();

        try {
            $userKey = $this->e2eeService->registerUserPublicKey($user, $validated['public_key']);

            $channelIds = DB::table('user_channels')
                ->where('user_id', $user->id)
                ->pluck('channel_id');

            foreach ($channelIds as $channelId) {
                $sessionKey = $this->e2eeService->getRawSessionKey($channelId);
                if (!$sessionKey) {
                    $rawKey = random_bytes(32);
                    $sessionKey = base64_encode($rawKey);
                    Channel::where('id', $channelId)->update(['session_key' => $sessionKey]);
                }

                $encryptedSessionKey = $this->e2eeService->encryptSessionKeyForUser(
                    $sessionKey,
                    $userKey->public_key
                );

                $this->e2eeService->storeEncryptedSessionKey(
                    $channelId,
                    $user->id,
                    $encryptedSessionKey
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Clé publique enregistrée avec succès et clés de session redistribuées',
                'data' => [
                    'user_id' => $user->id,
                    'public_key' => $userKey->public_key,
                    'channels_updated' => count($channelIds)
                ]
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 409);
        }
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/e2ee/keys/user/{userId}",
     *     summary="Récupérer la clé publique RSA d'un utilisateur",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="userId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Clé publique"),
     *     @OA\Response(response=404, description="Clé non trouvée")
     * )
     */
    public function getUserKeys(int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        $key = $this->e2eeService->getUserPublicKey($user);

        if (!$key) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune clé publique trouvée pour cet utilisateur'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $userId,
                'username' => $user->name,
                'public_key' => $key->public_key
            ]
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/e2ee/keys/channel/{channelId}",
     *     summary="Récupérer les clés publiques de tous les membres d'un salon",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channelId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Clés des membres"),
     *     @OA\Response(response=403, description="Non membre")
     * )
     */
    public function getChannelMembersKeys(int $channelId): JsonResponse
    {
        $channel = Channel::with('members')->findOrFail($channelId);

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

        $membersKeys = $this->e2eeService->getChannelMembersPublicKeys($channel);

        return response()->json([
            'success' => true,
            'data' => [
                'channel_id' => $channel->id,
                'members_keys' => $membersKeys
            ]
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/e2ee/session-keys/distribute",
     *     summary="Distribuer les clés de session AES-256 chiffrées avec RSA",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"channel_id", "encrypted_keys"},
     *             @OA\Property(property="channel_id", type="integer", example=1),
     *             @OA\Property(
     *                 property="encrypted_keys",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="user_id", type="integer"),
     *                     @OA\Property(property="encrypted_session_key", type="string")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Clés distribuées"),
     *     @OA\Response(response=403, description="Non membre")
     * )
     */
    public function distributeSessionKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel_id' => 'required|integer|exists:channels,id',
            'encrypted_keys' => 'required|array|min:1',
            'encrypted_keys.*.user_id' => 'required|integer|exists:users,id',
            'encrypted_keys.*.encrypted_session_key' => 'required|string',
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

        $count = $this->e2eeService->distributeSessionKeys(
            $channelId,
            $validated['encrypted_keys']
        );

        return response()->json([
            'success' => true,
            'message' => 'Clés de session distribuées avec succès',
            'data' => [
                'channel_id' => $channelId,
                'distributed_to' => $count . ' utilisateurs'
            ]
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/e2ee/session-keys/{channelId}",
     *     summary="Récupérer la clé de session chiffrée pour l'utilisateur connecté",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channelId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Clé de session"),
     *     @OA\Response(response=404, description="Clé non trouvée")
     * )
     */
    public function getSessionKey(int $channelId): JsonResponse
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

        // Récupérer la clé de session chiffrée
        $sessionKey = $this->e2eeService->getSessionKey($channelId, $user->id);

        if (!$sessionKey) {
            return response()->json([
                'success' => false,
                'message' => "Aucune clé de session trouvée pour ce channel. Vous avez peut-être changé votre clé publique récemment. Veuillez demander la redistribution de la clé de session."
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'channel_id' => $channelId,
                'encrypted_session_key' => $sessionKey->encrypted_session_key
            ]
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/e2ee/channel/{channelId}/status",
     *     summary="Vérifier le statut E2EE d'un salon",
     *     tags={"E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channelId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Statut E2EE"),
     *     @OA\Response(response=403, description="Non membre")
     * )
     */
    public function checkChannelE2EEStatus(int $channelId): JsonResponse
    {
        $channel = Channel::with('members')->findOrFail($channelId);

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

        $membersWithE2EE = 0;
        $totalMembers = $channel->members->count();

        foreach ($channel->members as $member) {
            if ($this->e2eeService->hasE2EEEnabled($member)) {
                $membersWithE2EE++;
            }
        }

        $hasSessionKey = $this->e2eeService->getSessionKey($channelId, $user->id) !== null;

        return response()->json([
            'success' => true,
            'data' => [
                'channel_id' => $channelId,
                'e2ee_enabled' => $membersWithE2EE === $totalMembers,
                'members_with_e2ee' => $membersWithE2EE,
                'total_members' => $totalMembers,
                'user_has_session_key' => $hasSessionKey
            ]
        ]);
    }
}
