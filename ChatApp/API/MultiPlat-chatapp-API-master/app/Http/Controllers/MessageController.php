<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des messages dans les salons.
 * Permet de lister, envoyer, afficher et supprimer les messages d'un channel.
 */

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Services\MessageService;
use App\Services\FileCompressionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;


class MessageController extends Controller
{
    public function __construct(
        private readonly MessageService $messageService,
        private readonly FileCompressionService $compressionService
    ) {}

    /**
     * @OA\Get(
     *     path="/chatappAPI/channel/{channel}/message",
     *     summary="Lister les messages d'un salon",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         required=false,
     *         description="Nombre de messages à récupérer",
     *         @OA\Schema(type="integer", default=50)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des messages",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Message")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié"),
     *     @OA\Response(response=403, description="Accès non autorisé")
     * )
     */
    public function index(Request $request, Channel $channel): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $messages = $this->messageService->getChannelMessages(
            $channel,
            $user,
            $request->get('limit', 50)
        );

        if ($messages === null) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à ce salon'
            ], 403);
        }

        return MessageResource::collection($messages);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/channel/{channel}/message",
     *     summary="Créer un nouveau message dans un salon",
     *     tags={"Messages"},
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
     *             required={"content"},
     *             @OA\Property(property="content", type="string", maxLength=2000, example="Bonjour tout le monde!")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Message créé avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", ref="#/components/schemas/Message")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié"),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function store(Request $request, Channel $channel): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $request->validate([
            'type' => 'nullable|in:text,voice,attachment',
            'content' => [
                'required_if:type,text',
                'required_without:type',
                'string',
                'max:420',
                function ($attribute, $value, $fail) {
                    // Bloquer les scripts et HTML dangereux
                    if (preg_match('/<script|<iframe|javascript:/i', $value)) {
                        $fail('Le contenu contient des éléments non autorisés.');
                    }
                }
            ],
            'voice_message' => 'required_if:type,voice|file|mimes:mp3,wav,ogg,m4a,webm,mp4|max:5120',
            'duration' => 'required_if:type,voice|integer|min:1|max:60',
            'attachment' => 'required_if:type,attachment|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar,jpg,jpeg,png,gif,svg,mp4,avi,mov|max:5120',
        ]);

        $messageType = $request->input('type', 'text');

        // Déterminer le disque de stockage (Spaces ou local)
        $storageDisk = config('filesystems.default') === 'spaces' ? 'spaces' : 'public';

        // Traiter les messages vocaux
        if ($messageType === 'voice') {
            $file = $request->file('voice_message');
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();

            // Répartition en sous-dossiers par hash d'utilisateur
            $userHash = substr(md5($user->id), 0, 2);
            $path = $file->storeAs("voice-messages/{$userHash}", $filename, $storageDisk);

            $result = $this->messageService->createVoiceMessage(
                $path,
                $request->input('duration'),
                $user,
                $channel
            );
        } elseif ($messageType === 'attachment') {
            // Traiter les pièces jointes
            $file = $request->file('attachment');

            // Compresser l'image AVANT l'upload (si c'est une image)
            $this->compressionService->compressUploadedImage($file);

            $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();

            // Répartition en sous-dossiers par hash d'utilisateur
            $userHash = substr(md5($user->id), 0, 2);
            $path = $file->storeAs("attachments/{$userHash}", $filename, $storageDisk);

            // Récupérer la taille réelle du fichier uploadé
            $finalSize = $this->compressionService->getFileSize($path, $storageDisk);

            $result = $this->messageService->createAttachmentMessage(
                $path,
                $file->getClientOriginalName(),
                $finalSize ?: $file->getSize(),
                $file->getMimeType(),
                $request->input('content', '[Pièce jointe]'),
                $user,
                $channel
            );
        } else {
            // Message texte classique
            $result = $this->messageService->createMessage(
                $request->input('content'),
                $user,
                $channel
            );
        }

        if (!$result['success']) {
            return response()->json($result, 403);
        }

        $message = $result['data'];

        $payloadData = [
            'id' => $message->id,
            'type' => $message->type ?? 'text',
            'content' => $message->content,
            'channel_id' => $channel->id,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username ?? $user->name
            ],
            'created_at' => $message->created_at
        ];

        // Ajouter les champs spécifiques aux messages vocaux
        if ($message->type === 'voice') {
            $payloadData['file_url'] = $this->getFileUrl($message->file_path, $storageDisk);
            $payloadData['duration'] = $message->duration;
        }

        // Ajouter les champs spécifiques aux pièces jointes
        if ($message->type === 'attachment') {
            $payloadData['file_url'] = $this->getFileUrl($message->file_path, $storageDisk);
            $payloadData['file_name'] = $message->file_name;
            $payloadData['file_size'] = $message->file_size;
            $payloadData['mime_type'] = $message->mime_type;
        }

        $payload = json_encode($payloadData);

        Redis::publish('channel.' . $channel->id, $payload);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => new MessageResource($message)
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/channel/{channel}/message/{message}",
     *     summary="Afficher un message spécifique",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="channel",
     *         in="path",
     *         required=true,
     *         description="ID du salon",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         description="ID du message",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Détails du message",
     *         @OA\JsonContent(ref="#/components/schemas/Message")
     *     ),
     *     @OA\Response(response=401, description="Non authentifié"),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=404, description="Message non trouvé")
     * )
     */
    public function show(Message $message): MessageResource|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        if(!$user->isAdmin()) {
            if ($message->channel->type === Channel::TYPE_PRIVATE &&
                !$message->channel->isMember($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé'
                ], 403);
            }
        }

        $message->load(['user', 'channel']);

        return new MessageResource($message);
    }

    /**
     * @OA\Delete(
     *     path="/chatappAPI/message/{message}",
     *     summary="Supprimer un message (admin uniquement)",
     *     tags={"Messages"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="message",
     *         in="path",
     *         required=true,
     *         description="ID du message",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Message supprimé avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifié"),
     *     @OA\Response(response=403, description="Accès non autorisé")
     * )
     */
    public function destroy(Message $message): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $result = $this->messageService->deleteMessage($message, $user);

        if (!$result['success']) {
            return response()->json($result, 403);
        }

        return response()->json($result);
    }

    /**
     * Générer l'URL du fichier selon le disque de stockage
     */
    private function getFileUrl(?string $filePath, string $disk): ?string
    {
        if (!$filePath) {
            return null;
        }

        // Si on utilise Spaces, générer l'URL via le CDN
        if ($disk === 'spaces') {
            return \Illuminate\Support\Facades\Storage::disk('spaces')->url($filePath);
        }

        // Sinon, utiliser l'URL locale
        return asset('storage/' . $filePath);
    }
}
