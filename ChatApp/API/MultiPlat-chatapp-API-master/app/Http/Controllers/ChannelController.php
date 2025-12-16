<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des salons (channels).
 * Permet de lister, créer, afficher et gérer les salons publics, privés et DM.
 */

namespace App\Http\Controllers;

use App\Http\Requests\SendInvitationRequest;
use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\ChannelCollection;
use App\Http\Resources\ChannelDetailResource;
use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Models\User;
use App\Services\ChannelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class ChannelController extends Controller
{
    public function __construct(
        private ChannelService $channelService
    ) {}

    /**
     * @OA\Get(
     *     path="/chatappAPI/channel",
     *     summary="Lister tous les salons accessibles",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des salons",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Channel")),
     *                 @OA\Property(property="meta", type="object",
     *                     @OA\Property(property="total", type="integer"),
     *                     @OA\Property(property="public_count", type="integer"),
     *                     @OA\Property(property="private_count", type="integer")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $channels = $this->channelService->getAllChannels($user);

        foreach ($channels as $i => $channel) {
            $channelWithDetails = $this->channelService->getChannelWithDetails($channel, $user);

            if ($channelWithDetails->type === Channel::TYPE_DM) {
                $name = trim((string) ($channelWithDetails->name ?? ''));
                if (preg_match('/^DM-(\d+)-(\d+)/i', $name, $matches)) {
                    $id1 = intval($matches[1]);
                    $id2 = intval($matches[2]);
                    $otherId = null;
                    if ($user && $user->id === $id1) {
                        $otherId = $id2;
                    } elseif ($user && $user->id === $id2) {
                        $otherId = $id1;
                    }

                    if ($otherId) {
                        $otherUser = User::find($otherId);
                        if ($otherUser) {
                            $channelWithDetails->name = $otherUser->name;
                        }
                    }
                }
            }

            $channels[$i] = $channelWithDetails;
        }

        return response()->json([
            'success' => true,
            'data' => new ChannelCollection(ChannelResource::collection($channels))
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/channel",
     *     summary="Créer un nouveau salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "type"},
     *             @OA\Property(property="name", type="string", minLength=3, maxLength=255, example="Salon Général"),
     *             @OA\Property(property="type", type="string", enum={"public", "private"}, example="public"),
     *             @OA\Property(property="description", type="string", maxLength=500, example="Salon pour discuter de tout")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Salon créé avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/Channel")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function store(StoreChannelRequest $request): JsonResponse
    {
        try {
            $channel = $this->channelService->createChannel(
                $request->validated(),
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => "Salon \"{$channel->name}\" créé avec succès !",
                'data' => new ChannelResource($channel)
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du salon : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/channel/{channel}",
     *     summary="Afficher les détails d'un salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails du salon",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="data", ref="#/components/schemas/ChannelDetail")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Salon non trouvé")
     * )
     */
    public function show(Channel $channel, Request $request): JsonResponse
    {
        $user = $request->user();
        $channelWithDetails = $this->channelService->getChannelWithDetails($channel, $user);

        if ($channelWithDetails->type === Channel::TYPE_DM) {
            $name = trim((string) ($channelWithDetails->name ?? ''));
            if (preg_match('/^DM-(\d+)-(\d+)/i', $name, $matches)) {
                $id1 = intval($matches[1]);
                $id2 = intval($matches[2]);
                $otherId = null;
                if ($user && $user->id === $id1) {
                    $otherId = $id2;
                } elseif ($user && $user->id === $id2) {
                    $otherId = $id1;
                }

                if ($otherId) {
                    $otherUser = User::find($otherId);
                    if ($otherUser) {
                        $channelWithDetails->name = $otherUser->name;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => new ChannelDetailResource($channelWithDetails)
        ]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/channel/{channel}",
     *     summary="Modifier un salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Nouveau nom"),
     *             @OA\Property(property="type", type="string", enum={"public", "private"}),
     *             @OA\Property(property="description", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Salon modifié"),
     *     @OA\Response(response=403, description="Non autorisé")
     * )
     */
    public function update(UpdateChannelRequest $request, Channel $channel): JsonResponse
    {
        try {
            $updatedChannel = $this->channelService->updateChannel(
                $channel,
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => "Salon \"{$updatedChannel->name}\" modifié avec succès !",
                'data' => new ChannelResource($updatedChannel)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du salon : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/chatappAPI/channel/{channel}",
     *     summary="Supprimer un salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Salon supprimé"),
     *     @OA\Response(response=403, description="Non autorisé")
     * )
     */
    public function destroy(Channel $channel, Request $request): JsonResponse
    {
        $user = $request->user();

        // Vérifier les permissions
        if (!$this->channelService->canUserEditChannel($channel, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas les permissions pour supprimer ce salon'
            ], 403);
        }

        try {
            $channelName = $channel->name;
            $this->channelService->deleteChannel($channel);

            return response()->json([
                'success' => true,
                'message' => "Salon \"{$channelName}\" supprimé avec succès !"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du salon : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/channel/public",
     *     summary="Lister uniquement les salons publics",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des salons publics",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Channel"))
     *         )
     *     )
     * )
     */
    public function getPublicChannels(): JsonResponse
    {
        $channels = $this->channelService->getPublicChannels();

        return response()->json([
            'success' => true,
            'data' => ChannelResource::collection($channels)
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/channel/{channel}/join",
     *     summary="Rejoindre un salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="user_id", type="integer", example=1, description="ID de l'utilisateur (optionnel)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Salon rejoint avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="debug_user", type="string")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Erreur"),
     *     @OA\Response(response=401, description="Utilisateur non trouvé")
     * )
     */
    public function joinChannel(Request $request, Channel $channel): JsonResponse
    {
        $user = $request->user();

        if (!$user && $request->has('user_id')) {
            $user = User::find($request->user_id);
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 401);
        }

        $result = $this->channelService->joinChannel($channel, $user);
        $result['debug_user'] = $user->name;

        $payload = [
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'action' => 'join',
            'channel_type' => $channel->type,
        ];

        if ($channel->type === Channel::TYPE_DM) {
            $otherUser = $channel->members()->where('user_id', '!=', $user->id)->first();
            if ($otherUser) {
                $payload['other_user_id'] = $otherUser->id;
                $payload['display_name'] = $otherUser->name;
            }
        }

        Redis::publish('channel.user.joined', json_encode($payload));

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/channel/{channel}/leave",
     *     summary="Quitter un salon",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Salon quitté"),
     *     @OA\Response(response=400, description="Erreur")
     * )
     */
    public function leaveChannel(Request $request, Channel $channel): JsonResponse
    {
        $user = $request->user();

        if (!$user && $request->has('user_id')) {
            $user = User::find($request->user_id);
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 401);
        }

        $otherUser = null;
        if ($channel->type === Channel::TYPE_DM) {
            $otherUser = $channel->members()->where('user_id', '!=', $user->id)->first();
        }

        $result = $this->channelService->leaveChannel($channel, $user);
        $result['debug_user'] = $user->name;

        $payload = [
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'action' => 'leave',
            'channel_type' => $channel->type,
        ];

        if ($channel->type === Channel::TYPE_DM && $otherUser) {
            $payload['other_user_id'] = $otherUser->id;
            $payload['display_name'] = $otherUser->name;
        }

        Redis::publish('channel.user.left', json_encode($payload));

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/user/{user}/channels",
     *     summary="Obtenir les salons d'un utilisateur spécifique",
     *     tags={"Salons"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         description="ID de l'utilisateur",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des salons de l'utilisateur",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Channel"))
     *         )
     *     ),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    public function getUserChannels(Request $request, ?User $user = null): JsonResponse
    {
        $targetUser = $user ?? $request->user();

        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $channels = $this->channelService->getUserChannels($targetUser);

        foreach ($channels as $i => $channel) {
            $channelWithDetails = $this->channelService->getChannelWithDetails($channel, $targetUser);

            if ($channelWithDetails->type === Channel::TYPE_DM) {
                $name = trim((string) ($channelWithDetails->name ?? ''));
                if (preg_match('/^DM-(\d+)-(\d+)/i', $name, $matches)) {
                    $id1 = intval($matches[1]);
                    $id2 = intval($matches[2]);
                    $otherId = null;
                    if ($targetUser->id === $id1) {
                        $otherId = $id2;
                    } elseif ($targetUser->id === $id2) {
                        $otherId = $id1;
                    }

                    if ($otherId) {
                        $otherUser = User::find($otherId);
                        if ($otherUser) {
                            $channelWithDetails->name = $otherUser->name;
                        }
                    }
                }
            }

            $channels[$i] = $channelWithDetails;
        }

        return response()->json([
            'success' => true,
            'data' => ChannelResource::collection($channels)
        ]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/channel/{channel}/e2ee",
     *     summary="Activer ou désactiver le E2EE sur un channel",
     *     tags={"Salons", "E2EE"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du channel",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"e2ee_enabled"},
     *             @OA\Property(property="e2ee_enabled", type="boolean", example=true, description="Activer (true) ou désactiver (false) le E2EE")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="E2EE mis à jour avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="channel_id", type="integer"),
     *                 @OA\Property(property="e2ee_enabled", type="boolean"),
     *                 @OA\Property(property="e2ee_enabled_by", type="integer", nullable=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=403, description="Non autorisé"),
     *     @OA\Response(response=404, description="Channel non trouvé")
     * )
     */
    public function toggleE2EE(Request $request, Channel $channel): JsonResponse
    {
        $validated = $request->validate([
            'e2ee_enabled' => 'required|boolean',
        ]);

        /** @var User $user */
        $user = $request->user();

        // Vérifier que l'utilisateur est membre du channel
        if (!$channel->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez être membre du channel pour modifier les paramètres E2EE'
            ], 403);
        }

        // Mettre à jour le statut E2EE
        $channel->e2ee_enabled = $validated['e2ee_enabled'];

        // Si on active le E2EE, enregistrer qui l'a activé
        if ($validated['e2ee_enabled']) {
            $channel->e2ee_enabled_by = $user->id;
        } else {
            // Si on désactive, on peut mettre null ou garder l'historique
            // Pour l'instant on garde l'historique
            // $channel->e2ee_enabled_by = null;
        }

        $channel->save();

        return response()->json([
            'success' => true,
            'message' => $validated['e2ee_enabled']
                ? 'E2EE activé avec succès'
                : 'E2EE désactivé avec succès',
            'data' => [
                'channel_id' => $channel->id,
                'e2ee_enabled' => $channel->e2ee_enabled,
                'e2ee_enabled_by' => $channel->e2ee_enabled_by,
                'e2ee_enabled_by_name' => $channel->e2ee_enabled_by
                    ? $channel->e2eeEnabledBy->name
                    : null
            ]
        ]);
    }
}
