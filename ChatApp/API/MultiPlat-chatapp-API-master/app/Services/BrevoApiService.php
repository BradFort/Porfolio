<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour l'envoi d'emails via l'API Brevo (ex-Sendinblue).
 * Permet d'envoyer les codes MFA en contournant le blocage SMTP.
 */

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class BrevoApiService
{
    protected string $apiKey;
    protected string $apiUrl = 'https://api.brevo.com/v3/smtp/email';

    public function __construct()
    {
        $this->apiKey = config('services.brevo.api_key');
    }

    /**
     * Envoie un email contenant le code MFA à l'utilisateur via l'API Brevo.
     *
     * @param User $user L'utilisateur à qui le code MFA doit être envoyé.
     * @param string $code Le code MFA à envoyer.
     * @return bool True si l'envoi a réussi, sinon false.
     */
    public function sendMFACode(User $user, string $code): bool
    {
        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'accept' => 'application/json',
            ])->post($this->apiUrl, [
                'sender' => [
                    'name' => config('app.name'),
                    'email' => config('mail.from.address'),
                ],
                'to' => [
                    [
                        'email' => $user->email,
                        'name' => $user->name,
                    ]
                ],
                'subject' => 'Votre code de vérification ChatApp',
                'htmlContent' => $this->getMFAEmailHtml($user, $code),
                'textContent' => $this->getMFAEmailText($user, $code),
            ]);

            if ($response->successful()) {
                Log::info('MFA code sent via Brevo API', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'message_id' => $response->json('messageId'),
                ]);
                return true;
            }

            Log::error('Failed to send MFA code via Brevo API', [
                'user_id' => $user->id,
                'status' => $response->status(),
                'error' => $response->body(),
            ]);
            return false;

        } catch (Exception $e) {
            Log::error('Exception sending MFA code via Brevo API', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Génère le contenu HTML de l'email contenant le code MFA.
     *
     * @param User $user L'utilisateur à qui le code MFA doit être envoyé.
     * @param string $code Le code MFA à envoyer.
     * @return string Le contenu HTML de l'email.
     */
    protected function getMFAEmailHtml(User $user, string $code): string
    {
        return "
            <!DOCTYPE html>
            <html lang='fr'>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .code { font-size: 32px; font-weight: bold; color: #4CAF50; padding: 20px; background: #f4f4f4; text-align: center; border-radius: 5px; margin: 20px 0; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h2>Bonjour {$user->name},</h2>
                    <p>Vous avez demandé à vous connecter à votre compte ChatAppXP.</p>
                    <div class='code'>{$code}</div>
                    <p>Ce code est valide pendant <strong>10 minutes</strong>.</p>
                    <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
                    <div class='footer'>
                        <p>ChatAppXP - " . date('Y') . "</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }

    /**
     * Génère le contenu texte de l'email contenant le code MFA.
     *
     * @param User $user L'utilisateur à qui le code MFA doit être envoyé.
     * @param string $code Le code MFA à envoyer.
     * @return string Le contenu texte de l'email.
     */
    protected function getMFAEmailText(User $user, string $code): string
    {
        return "Bonjour {$user->name},\n\n"
            . "Vous avez demandé à vous connecter à votre compte ChatApp.\n\n"
            . "Code de vérification: {$code}\n\n"
            . "Ce code est valide pendant 10 minutes.\n\n"
            . "Si vous n'avez pas demandé ce code, ignorez cet email.\n\n"
            . "ChatApp - " . date('Y');
    }
}
