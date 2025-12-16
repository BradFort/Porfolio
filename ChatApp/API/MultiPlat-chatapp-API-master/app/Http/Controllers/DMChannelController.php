<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des messages directs (DM) entre utilisateurs.
 * Permet de lister, créer et gérer les DMs.
 */

namespace App\Http\Controllers;

use App\Http\Requests\StoreChannelRequest;
use App\Http\Requests\UpdateChannelRequest;
use App\Http\Resources\DMChannelResource;
use App\Models\DMChannel;
use App\Models\User;
use App\Services\DMChannelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DMChannelController extends Controller
{
    public function __construct(
        private DMChannelService $dmChannelService
    ) {}

    /**
     * @OA\Get(
     *     path="/chatappAPI/dm",
     *     summary="Lister tous les DMs de l'utilisateur connecté",
     *     tags={"Messages Directs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des conversations directes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/DMChannel"))
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dmChannels = $this->dmChannelService->getUserDMChannels($user);

        $dmResources = $dmChannels->map(function($dm) use ($user) {
            $channel = $dm->channel;
            if ($channel->type === 'dm') {
                $otherUser = $channel->members->where('id', '!=', $user->id)->first();
                $channel->name = $otherUser ? ($otherUser->name) : $channel->name;
            }
            return $channel;
        });

        return response()->json([
            'success' => true,
            'data' => $dmResources
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/dm",
     *     summary="Créer un nouveau DM avec un utilisateur",
     *     tags={"Messages Directs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"user_id"},
     *             @OA\Property(property="user_id", type="integer", example=2, description="ID de l'utilisateur avec qui démarrer une conversation")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Conversation créée avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/DMChannel")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id'
            ]);

            $currentUser = $request->user();
            $otherUser = User::findOrFail($validated['user_id']);

            if ($currentUser->id === $otherUser->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de créer une conversation avec vous-même'
                ], 422);
            }

            $result = $this->dmChannelService->createOrGetDM($currentUser, $otherUser);
            $dmChannel = $result['dm'];
            $status = $result['status'] ?? 'existing';

            $dmChannel->load(['channel.members']);

            if ($status === 'created') {
                return response()->json([
                    'success' => true,
                    'message' => "Conversation avec {$otherUser->name} créée avec succès !",
                    'data' => new DMChannelResource($dmChannel)
                ], 201);
            }

            if ($status === 'rejoined') {
                return response()->json([
                    'success' => true,
                    'message' => "Vous avez rejoint la conversation existante avec {$otherUser->name}.",
                    'data' => new DMChannelResource($dmChannel)
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'La conversation existe déjà',
                'data' => new DMChannelResource($dmChannel)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la conversation : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/dm/{dm}",
     *     summary="Afficher un DM spécifique",
     *     tags={"Messages Directs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="dm",
     *         in="path",
     *         required=true,
     *         description="ID du DM",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails du DM",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/DMChannel")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=404, description="DM non trouvé")
     * )
     */
    public function show(DMChannel $dm, Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$dm->hasParticipant($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas accès à cette conversation'
            ], 403);
        }

        $dmWithDetails = $this->dmChannelService->getDMWithDetails($dm);
        $channel = $dmWithDetails->channel;
        if ($channel->type === 'dm') {
            $otherUser = $channel->members->where('id', '!=', $user->id)->first();
            $channel->name = $otherUser ? ($otherUser->name) : $channel->name;
        }

        return response()->json([
            'success' => true,
            'data' => $channel
        ]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/dm/{dm}",
     *     summary="Mettre à jour un DM (marquer comme lu, etc.)",
     *     tags={"Messages Directs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="dm",
     *         in="path",
     *         required=true,
     *         description="ID du DM",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Nouvelle conversation"),
     *             @OA\Property(property="description", type="string", example="Description mise à jour")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="DM mis à jour avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/DMChannel")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function update(UpdateChannelRequest $request, DMChannel $dm): JsonResponse
    {
        $user = $request->user();

        if (!$dm->hasParticipant($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas accès à cette conversation'
            ], 403);
        }

        try {
            return response()->json([
                'success' => true,
                'message' => 'Conversation mise à jour avec succès !',
                'data' => new DMChannelResource($dm->load(['channel.members']))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()
            ], 500);
        }
    }
}
