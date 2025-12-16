<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des utilisateurs.
 * Permet de lister, modifier, afficher et gérer les utilisateurs de l'application.
 */

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Channel;
use App\Models\NotificationType;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * @OA\Get(
     *     path="/chatappAPI/user",
     *     summary="Lister tous les utilisateurs (admin uniquement)",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des utilisateurs",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit")
     * )
     */
    public function index()
    {
        $user = auth()->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        $users = User::with('disabledNotificationTypes')->get();
        return UserResource::collection($users);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/user/{user}",
     *     summary="Modifier un utilisateur",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="theme", type="string", maxLength=25, example="dark"),
     *             @OA\Property(property="status", type="string", maxLength=25, example="online")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Utilisateur modifié",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function update(Request $request, User $user)
    {
        try {
            $request->validate([
                'theme' => 'nullable|string|max:25',
                'status' => 'nullable|string|max:25',
            ]);

            if ($request->has('theme')) {
                $user->theme = $request->input('theme');
            }
            if ($request->has('status')) {
                $user->status = $request->input('status');
            }
            $user->save();

            return response()->json([
                'success' => true,
                'message' => "L'utilisateur a été modifié avec succès !",
                'data' => new UserResource($user->load('disabledNotificationTypes'))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un utilisateur (self ou admin)
     */
    public function show(Request $request, User $user)
    {
        $current = $request->user();
        if (!$current || ($current->id !== $user->id && !$current->isAdmin())) {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        return new UserResource($user->load('disabledNotificationTypes'));
    }
    /**
     * @OA\Delete(
     *     path="/chatappAPI/user/{user}",
     *     summary="Supprimer un utilisateur (admin uniquement)",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Utilisateur supprimé",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Utilisateur supprimé")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit")
     * )
     */
    public function destroy(User $userToDelete)
    {
        $user = auth()->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        if ((int) auth()->id() === (int) $userToDelete->id) {
            return response()->json(['error' => 'Vous ne pouvez pas supprimer votre propre compte'], 403);
        }

        $userToDelete->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/users/available-for-invite/{channel}",
     *     summary="Obtenir les utilisateurs disponibles pour invitation à un channel",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des utilisateurs disponibles",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="name", type="string"),
     *                     @OA\Property(property="email", type="string")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit")
     * )
     */
    public function getAvailableForInvite(Request $request, Channel $channel)
    {
        $currentUser = $request->user();

        if (!$channel->isMember($currentUser)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez être membre du salon pour inviter des utilisateurs'
            ], 403);
        }

        $memberIds = $channel->members->pluck('id')->toArray();
        $memberIds[] = $currentUser->id;

        $availableUsers = User::whereNotIn('id', $memberIds)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $availableUsers
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/users/available-for-dm",
     *     summary="Obtenir les utilisateurs disponibles pour créer un DM",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des utilisateurs disponibles",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="name", type="string"),
     *                     @OA\Property(property="email", type="string")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function getAvailableForDM(Request $request)
    {
        $currentUser = $request->user();

        $availableUsers = User::where('id', '!=', $currentUser->id)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $availableUsers
        ]);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/user/notifications",
     *     summary="Activer/désactiver plusieurs types de notifications pour l'utilisateur connecté",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="notificationTypeIds", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Etat basculé pour chaque type",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="actions", type="object"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     )
     * )
     */
    public function toggleNotifications(Request $request)
    {
        $user = $request->user();
        $disabledIds = $request->input('notificationTypeIds', []);
        if (!is_array($disabledIds)) {
            return response()->json([
                'success' => false,
                'message' => 'notificationTypeIds doit être un tableau.'
            ], 422);
        }
        $allTypeIds = NotificationType::pluck('id')->all();
        $relation = $user->disabledNotificationTypes();
        $actions = [];
        foreach ($allTypeIds as $id) {
            if (in_array($id, $disabledIds)) {
                if (!$relation->where('notification_type_id', $id)->exists()) {
                    $relation->attach($id);
                    $actions[$id] = 'disabled';
                } else {
                    $actions[$id] = 'already_disabled';
                }
            } else {
                if ($relation->where('notification_type_id', $id)->exists()) {
                    $relation->detach($id);
                    $actions[$id] = 'enabled';
                } else {
                    $actions[$id] = 'already_enabled';
                }
            }
        }
        return response()->json([
            'success' => true,
            'actions' => $actions,
            'data' => new UserResource($user->load('disabledNotificationTypes')),
        ]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/user/{user}/notifs",
     *     summary="Lister les types de notifications désactivés pour un utilisateur",
     *     description="Renvoie uniquement la liste des types de notifications qui sont désactivés pour l'utilisateur (présents dans la table user_disabled_notification_types).",
     *     tags={"Notifications"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         description="ID de l'utilisateur concerné",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des types de notifications désactivés pour l'utilisateur.",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="type_fr", type="string"),
     *                     @OA\Property(property="type_en", type="string")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit")
     * )
     */
    public function listNotificationTypes(Request $request, User $user)
    {
        $current = $request->user();
        if (!$current || ($current->id !== $user->id && !$current->isAdmin())) {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        $types = $user->disabledNotificationTypes()->orderBy('id')->get();
        $data = $types->map(function ($type) {
            return [
                'id' => $type->id,
                'type_fr' => $type->type_fr,
                'type_en' => $type->type_en,
            ];
        });
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/user/{user}/lang/{lang}",
     *     summary="Changer la langue d'un utilisateur",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="lang", in="path", required=true, @OA\Schema(type="string", example="fr")),
     *     @OA\Response(
     *         response=200,
     *         description="Langue mise à jour",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function updateLang(Request $request, User $user, string $lang)
    {
        $current = $request->user();
        if (!$current || ($current->id !== $user->id && !$current->isAdmin())) {
            return response()->json(['error' => 'Accès interdit'], 403);
        }

        $valid_languages = ['en', 'fr'];

        $validator = Validator::make(['lang' => $lang], [
            'lang' => ['required', 'string', 'min:2', 'max:5', Rule::in($valid_languages)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->lang = $lang;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Langue mise à jour",
            'data' => new UserResource($user->load('disabledNotificationTypes')),
        ]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/user/{user}/notifs/toggle",
     *     summary="Activer/désactiver plusieurs types de notifications pour un utilisateur spécifique",
     *     tags={"Utilisateurs"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="user",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="notificationTypeIds", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Etat basculé pour chaque type pour l'utilisateur spécifié",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="actions", type="object"),
     *             @OA\Property(property="data", ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=403, description="Accès interdit"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function toggleNotification(Request $request, User $user)
    {
        $disabledIds = $request->input('notificationTypeIds', []);
        if (!is_array($disabledIds)) {
            return response()->json([
                'success' => false,
                'message' => 'notificationTypeIds doit être un tableau.'
            ], 422);
        }
        $allTypeIds = NotificationType::pluck('id')->all();
        $relation = $user->disabledNotificationTypes();
        $actions = [];
        foreach ($allTypeIds as $id) {
            if (in_array($id, $disabledIds)) {
                if (!$relation->where('notification_type_id', $id)->exists()) {
                    $relation->attach($id);
                    $actions[$id] = 'disabled';
                } else {
                    $actions[$id] = 'already_disabled';
                }
            } else {
                if ($relation->where('notification_type_id', $id)->exists()) {
                    $relation->detach($id);
                    $actions[$id] = 'enabled';
                } else {
                    $actions[$id] = 'already_enabled';
                }
            }
        }
        return response()->json([
            'success' => true,
            'actions' => $actions,
            'data' => new UserResource($user->load('disabledNotificationTypes')),
        ]);
    }

    public function stats(User $user)
    {
        // Total messages envoyés
        $totalMessages = $user->messages()->count();

        // Total channels où l'utilisateur est membre
        $totalChannels = $user->channels()->count();

        // Top 3 channels les plus actifs
        $rawTopChannels = DB::table('messages')
            ->select('channel_id', DB::raw('COUNT(*) as total'))
            ->where('user_id', $user->id)
            ->groupBy('channel_id')
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        // Conversion → Ajout du nom du channel
        $topChannels = $rawTopChannels->map(function ($ch) {
            $channel = Channel::find($ch->channel_id);

            return [
                'id' => $channel->id,
                'name' => $channel->name,
                'total' => $ch->total
            ];
        });

        // Activité par jour
        $activityByDay = DB::table('messages')
            ->select(DB::raw('DAYNAME(created_at) as day'), DB::raw('COUNT(*) as total'))
            ->where('user_id', $user->id)
            ->groupBy('day')
            ->get()
            ->pluck('total', 'day'); // { "Monday": 12, "Sunday": 5 }

        return response()->json([
            'user_id' => $user->id,
            'stats' => [
                'total_messages' => $totalMessages,
                'total_channels' => $totalChannels,
                'top_channels' => $topChannels,
                'activity_by_day' => $activityByDay
            ]
        ]);
    }
}
