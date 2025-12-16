<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des membres d'un salon (channel).
 * Permet de lister, modifier et gérer les membres d'un channel.
 */

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\User;
use App\Models\UserChannel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;


class UserChannelController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/channel/{channel}/user",
     *     summary="Lister tous les membres d'un salon",
     *     tags={"Membres"},
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
     *         description="Liste des membres",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/User"))
     *         )
     *     ),
     *     @OA\Response(response=404, description="Aucun membre trouvé")
     * )
     */
    public function index(Request $request, Channel $channel)
    {
        $userIds = UserChannel::where('channel_id', $channel->id)->pluck('user_id')->unique();
        $users = User::whereIn('id', $userIds)->get();
        if ($users->isEmpty()) {
            return response()->json(['message' => 'No users found for this channel', 'data' => []], 404);
        }
        return response()->json(['data' => $users]);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/channel/{channel}/user/{userChannel}",
     *     summary="Modifier le rôle d'un membre dans un salon",
     *     tags={"Membres"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="userChannel",
     *         in="path",
     *         required=true,
     *         description="ID de la relation user-channel",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="role", type="string", enum={"admin", "member"}, example="admin"),
     *             @OA\Property(property="joined_at", type="string", format="date-time"),
     *             @OA\Property(property="action", type="string", example="update")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Membre mis à jour",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", ref="#/components/schemas/UserChannel")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $channelId, UserChannel $userChannel)
    {
        $data = $request->only(['role', 'joined_at']);
        $userChannel->update($data);
        Redis::connection('secondary')->publish('channel.user.updated', json_encode([
            'channel_id' => $channelId,
            'user_id' => $userChannel->user_id,
            'action' => $request->input('action', 'update'),
        ]));
        return response()->json(['data' => $userChannel]);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/my-channels",
     *     summary="Obtenir tous les salons de l'utilisateur connecté",
     *     tags={"Membres"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des salons de l'utilisateur",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Channel"))
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non autorisé")
     * )
     */
    public function myChannels(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $channelIds = UserChannel::where('user_id', $user->id)->pluck('channel_id');
        $channels = Channel::whereIn('id', $channelIds)->with('members')->get();
        $channels = $channels->map(function ($channel) use ($user) {
            if ($channel->type === 'dm') {
                $name = trim((string) ($channel->name ?? ''));
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
                            $channel->name = $otherUser->name;
                        }
                    }
                } else {
                    $otherUser = $channel->members->where('id', '!=', $user->id)->first();
                    $channel->name = $otherUser ? ($otherUser->name) : $channel->name;
                }
            }
             return $channel;
         });
         return response()->json(['data' => $channels]);
     }
}
