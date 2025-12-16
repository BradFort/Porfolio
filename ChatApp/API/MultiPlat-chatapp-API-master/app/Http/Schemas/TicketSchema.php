<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Schéma de validation pour un ticket de support.
 */

namespace App\Http\Schemas;

/**
 * @OA\Schema(
 *     schema="Ticket",
 *     type="object",
 *     required={"id", "title", "description", "status", "priority", "user_id"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="title", type="string", example="Problème de connexion"),
 *     @OA\Property(property="description", type="string", example="Je n'arrive pas à me connecter"),
 *     @OA\Property(property="status", type="string", enum={"open", "in_progress", "resolved", "closed"}, example="open"),
 *     @OA\Property(property="priority", type="string", enum={"low", "medium", "high", "urgent"}, example="medium"),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="assigned_to", type="integer", nullable=true, example=2),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="TicketComment",
 *     type="object",
 *     required={"id", "ticket_id", "user_id", "content"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="ticket_id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="content", type="string", example="Pouvez-vous réessayer maintenant ?"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class TicketSchema {}

