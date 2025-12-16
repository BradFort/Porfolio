<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la compression des fichiers images.
 * Permet de compresser, redimensionner et obtenir la taille des fichiers images uploadés.
 */

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Class FileCompressionService
 * Service pour la compression et la gestion des images uploadées.
 */
class FileCompressionService
{
    /**
     * Compresser une image uploadée.
     * @param UploadedFile $file Fichier uploadé
     * @return bool Vrai si compression réussie, faux sinon
     */
    public function compressUploadedImage(UploadedFile $file): bool
    {
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/png'])) {
            return false;
        }
        if ($file->getSize() < 500 * 1024) {
            return false;
        }
        $tempPath = $file->getRealPath();
        try {
            $image = match ($mimeType) {
                'image/jpeg', 'image/jpg' => \imagecreatefromjpeg($tempPath),
                'image/png' => \imagecreatefrompng($tempPath),
                default => null,
            };
            if (!$image) {
                return false;
            }
            $width = \imagesx($image);
            $height = \imagesy($image);
            $maxDimension = 2000;
            if ($width > $maxDimension || $height > $maxDimension) {
                if ($width > $height) {
                    $newWidth = $maxDimension;
                    $newHeight = (int) ($height * ($maxDimension / $width));
                } else {
                    $newHeight = $maxDimension;
                    $newWidth = (int) ($width * ($maxDimension / $height));
                }
                $resizedImage = \imagecreatetruecolor($newWidth, $newHeight);
                if ($mimeType === 'image/png') {
                    \imagealphablending($resizedImage, false);
                    \imagesavealpha($resizedImage, true);
                }
                \imagecopyresampled(
                    $resizedImage,
                    $image,
                    0,
                    0,
                    0,
                    0,
                    $newWidth,
                    $newHeight,
                    $width,
                    $height
                );
                \imagedestroy($image);
                $image = $resizedImage;
            }
            $success = match ($mimeType) {
                'image/jpeg', 'image/jpg' => \imagejpeg($image, $tempPath, 75),
                'image/png' => \imagepng($image, $tempPath, 6),
                default => false,
            };
            \imagedestroy($image);
            return $success;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Compresser une image à partir d'un chemin de fichier.
     * @param string $filePath Chemin du fichier
     * @param string $disk Disque de stockage
     * @return bool Vrai si compression réussie, faux sinon
     */
    public function compressImage(string $filePath, string $disk = 'public'): bool
    {
        if ($disk === 'spaces') {
            return false;
        }
        try {
            $fullPath = Storage::disk($disk)->path($filePath);
            if (!file_exists($fullPath)) {
                return false;
            }
            $mimeType = mime_content_type($fullPath);
            if (!in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/png'])) {
                return false;
            }
            if (filesize($fullPath) < 500 * 1024) {
                return false;
            }
            $image = match ($mimeType) {
                'image/jpeg', 'image/jpg' => \imagecreatefromjpeg($fullPath),
                'image/png' => \imagecreatefrompng($fullPath),
                default => null,
            };
            if (!$image) {
                return false;
            }
            $width = \imagesx($image);
            $height = \imagesy($image);
            $maxDimension = 2000;
            if ($width > $maxDimension || $height > $maxDimension) {
                if ($width > $height) {
                    $newWidth = $maxDimension;
                    $newHeight = (int) ($height * ($maxDimension / $width));
                } else {
                    $newHeight = $maxDimension;
                    $newWidth = (int) ($width * ($maxDimension / $height));
                }
                $resizedImage = \imagecreatetruecolor($newWidth, $newHeight);
                if ($mimeType === 'image/png') {
                    \imagealphablending($resizedImage, false);
                    \imagesavealpha($resizedImage, true);
                }
                \imagecopyresampled(
                    $resizedImage,
                    $image,
                    0,
                    0,
                    0,
                    0,
                    $newWidth,
                    $newHeight,
                    $width,
                    $height
                );
                \imagedestroy($image);
                $image = $resizedImage;
            }
            $success = match ($mimeType) {
                'image/jpeg', 'image/jpg' => \imagejpeg($image, $fullPath, 75),
                'image/png' => \imagepng($image, $fullPath, 6),
                default => false,
            };
            \imagedestroy($image);
            return $success;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Obtenir la taille d'un fichier.
     * @param string $filePath Chemin du fichier
     * @param string $disk Disque de stockage
     * @return int Taille du fichier en octets
     */
    public function getFileSize(string $filePath, string $disk = 'public'): int
    {
        try {
            if ($disk === 'spaces') {
                return Storage::disk('spaces')->size($filePath);
            }
            $fullPath = Storage::disk($disk)->path($filePath);
            if (!file_exists($fullPath)) {
                return 0;
            }

            return filesize($fullPath);
        } catch (\Exception $e) {
            return 0;
        }
    }
}
