<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des commentaires de ticket de support.
 * Permet d'ajouter, lister et gérer les commentaires associés à un ticket.
 */

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketCommentController extends Controller
{
    /**
     * @OA\Get(
     *     path="/chatappAPI/tickets/{ticketId}/comments",
     *     summary="Lister les commentaires d'un ticket",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="ticketId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des commentaires",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/TicketComment"))
     *     ),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=404, description="Ticket non trouvé")
     * )
     */
    public function index($ticketId)
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = request()->user();
        if (!$user->isAdmin() && $ticket->user_id !== $user->id && $ticket->assigned_to !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $comments = $ticket->comments()->with('user')->get();

        return response()->json($comments);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/tickets/{ticketId}/comments",
     *     summary="Ajouter un commentaire à un ticket",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="ticketId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"content"},
     *             @OA\Property(property="content", type="string", example="Avez-vous essayé de redémarrer ?")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Commentaire ajouté"),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function store(Request $request, $ticketId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = $request->user();
        if (!$user->isAdmin() && $ticket->user_id !== $user->id && $ticket->assigned_to !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $comment = TicketComment::create([
            'ticket_id' => $ticketId,
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
