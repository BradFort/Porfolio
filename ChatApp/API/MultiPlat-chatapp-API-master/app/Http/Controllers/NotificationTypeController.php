<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion des types de notification.
 * Permet de lister les types de notification disponibles dans l'application.
 */

namespace App\Http\Controllers;

use App\Http\Resources\NotificationTypeCollection;
use App\Models\NotificationType;

class NotificationTypeController extends Controller
{
    /**
     * @OA\Get(
     *     path="/chatappAPI/notification-types",
     *     summary="Lister tous les types de notification",
     *     tags={"Notifications"},
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des types de notifications",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/NotificationType")
     *             )
     *         )
     *     )
     * )
     */
    public function index()
    {
        $types = NotificationType::select('id', 'type_en', 'type_fr')->orderBy('id')->get();
        return new NotificationTypeCollection($types);
    }
}
