<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des invitations à rejoindre un channel.
 * Permet de créer, lister et gérer les invitations.
 */

namespace App\Http\Controllers;

use App\Http\Requests\SendInvitationRequest;
use App\Models\Channel;
use App\Models\Invitation;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class InvitationController extends Controller
{
    public function __construct(
        private InvitationService $invitationService
    ) {
        // Les rate limiters sont maintenant gérés globalement
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/channel/{channel}/invite",
     *     summary="Créer une invitation pour rejoindre un salon",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"user_id"},
     *             @OA\Property(property="user_id", type="integer", example=2),
     *             @OA\Property(property="message", type="string", example="Rejoins-nous !")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Invitation créée"),
     *     @OA\Response(response=400, description="Erreur de création")
     * )
     */
    public function store(SendInvitationRequest $request, Channel $channel): JsonResponse
    {
        $inviter = $request->user();
        $invitedUser = User::find($request->validated('user_id'));

        if (!$invitedUser) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $result = $this->invitationService->createInvitation(
            $channel,
            $inviter,
            $invitedUser,
            $request->validated('message')
        );

        // Log l'invitation
        \Log::info('Invitation créée', [
            'inviter_id' => $inviter->id,
            'invited_user_id' => $invitedUser->id,
            'channel_id' => $channel->id
        ]);

        return response()->json($result, $result['success'] ? 201 : 400);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/invitations",
     *     summary="Lister toutes mes invitations en attente",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des invitations",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Invitation"))
     *         )
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $invitations = $this->invitationService->getPendingInvitationsForUser($user);

        return response()->json([
            'success' => true,
            'data' => $invitations->map(function ($invitation) {
                return [
                    'id' => $invitation->id,
                    'channel' => [
                        'id' => $invitation->channel->id,
                        'name' => $invitation->channel->name,
                        'description' => $invitation->channel->description,
                        'type' => $invitation->channel->type,
                    ],
                    'inviter' => [
                        'id' => $invitation->inviter->id,
                        'name' => $invitation->inviter->name,
                        'email' => $invitation->inviter->email,
                    ],
                    'message' => $invitation->message,
                    'created_at' => $invitation->created_at,
                    'expires_at' => $invitation->expires_at,
                ];
            })
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/invitations/{invitation}",
     *     summary="Voir une invitation spécifique",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="invitation",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Détails de l'invitation"),
     *     @OA\Response(response=403, description="Accès non autorisé")
     * )
     */
    public function show(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user();

        // Vérifier que l'invitation appartient à l'utilisateur
        if ($invitation->invited_user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cette invitation ne vous appartient pas'
            ], 403);
        }

        $invitation->load(['channel', 'inviter']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $invitation->id,
                'channel' => [
                    'id' => $invitation->channel->id,
                    'name' => $invitation->channel->name,
                    'description' => $invitation->channel->description,
                    'type' => $invitation->channel->type,
                ],
                'inviter' => [
                    'id' => $invitation->inviter->id,
                    'name' => $invitation->inviter->name,
                    'email' => $invitation->inviter->email,
                ],
                'message' => $invitation->message,
                'status' => $invitation->status,
                'created_at' => $invitation->created_at,
                'expires_at' => $invitation->expires_at,
            ]
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/invitations/{invitation}/accept",
     *     summary="Accepter une invitation",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="invitation",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Invitation acceptée"),
     *     @OA\Response(response=400, description="Erreur")
     * )
     */
    public function accept(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user();
        $result = $this->invitationService->acceptInvitation($invitation, $user);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/invitations/{invitation}/reject",
     *     summary="Refuser une invitation",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="invitation",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Invitation refusée"),
     *     @OA\Response(response=400, description="Erreur")
     * )
     */
    public function reject(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user();
        $result = $this->invitationService->rejectInvitation($invitation, $user);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/invitations/count",
     *     summary="Obtenir le nombre d'invitations en attente",
     *     tags={"Invitations"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Nombre d'invitations",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="count", type="integer")
     *             )
     *         )
     *     )
     * )
     */
    public function count(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $this->invitationService->getPendingInvitationsCount($user);

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $count
            ]
        ]);
    }
}
