<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Classe abstraite de base pour tous les contrôleurs de l'API.
 */

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="API Chat Application",
 *     version="1.0.0",
 *     description="Documentation de l'API pour l'application de chat",
 *     @OA\Contact(
 *         email="support@exemple.com"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8080",
 *     description="Serveur de développement"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
abstract class Controller
{
    //
}
