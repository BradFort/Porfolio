<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des tickets de support.
 * Permet de créer, afficher, mettre à jour et lister les tickets.
 */

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * @OA\Get(
     *     path="/chatappAPI/tickets",
     *     summary="Lister tous les tickets (admin voit tout, utilisateur voit ses tickets)",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des tickets",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/Ticket"))
     *     )
     * )
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->isAdmin()) {
            $tickets = Ticket::with(['user', 'assignedUser', 'comments'])->get();
        } else {
            $tickets = Ticket::where('user_id', $user->id)
                ->orWhere('assigned_to', $user->id)
                ->with(['user', 'assignedUser', 'comments'])
                ->get();
        }

        return response()->json($tickets);
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/tickets",
     *     summary="Créer un nouveau ticket de support",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"title", "description", "priority"},
     *             @OA\Property(property="title", type="string", example="Problème de connexion"),
     *             @OA\Property(property="description", type="string", example="Je n'arrive pas à me connecter"),
     *             @OA\Property(property="priority", type="string", enum={"low", "medium", "high"}, example="medium")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Ticket créé"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = Ticket::create([
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority,
            'status' => 'open',
            'user_id' => $request->user()->id,
        ]);

        return response()->json($ticket->load(['user', 'assignedUser']), 201);
    }

    /**
     * @OA\Get(
     *     path="/chatappAPI/tickets/{id}",
     *     summary="Afficher un ticket spécifique",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails du ticket"),
     *     @OA\Response(response=403, description="Accès non autorisé"),
     *     @OA\Response(response=404, description="Ticket non trouvé")
     * )
     */
    public function show($id)
    {
        $ticket = Ticket::with(['user', 'assignedUser', 'comments.user'])->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = request()->user();
        if (!$user->isAdmin() && $ticket->user_id !== $user->id && $ticket->assigned_to !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($ticket);
    }

    /**
     * @OA\Put(
     *     path="/chatappAPI/tickets/{id}",
     *     summary="Mettre à jour un ticket",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="description", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Ticket mis à jour"),
     *     @OA\Response(response=403, description="Accès non autorisé")
     * )
     */
    public function update(Request $request, $id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket->update($request->only(['title', 'description']));

        return response()->json($ticket->load(['user', 'assignedUser']));
    }

    /**
     * @OA\Delete(
     *     path="/chatappAPI/tickets/{id}",
     *     summary="Supprimer un ticket",
     *     tags={"Tickets"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Ticket supprimé"),
     *     @OA\Response(response=403, description="Accès non autorisé")
     * )
     */
    public function destroy($id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = request()->user();
        if (!$user->isAdmin() && $ticket->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    public function assign(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->update(['assigned_to' => $request->assigned_to]);

        return response()->json($ticket->load(['user', 'assignedUser']));
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->update(['status' => $request->status]);

        return response()->json($ticket->load(['user', 'assignedUser']));
    }

    public function updatePriority(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'priority' => 'required|in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ticket->update(['priority' => $request->priority]);

        return response()->json($ticket->load(['user', 'assignedUser']));
    }
}
