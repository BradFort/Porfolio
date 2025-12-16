<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $channelId;
    public $user;

    public function __construct($message, $channelId, $user)
    {
        $this->message = $message;
        $this->channelId = $channelId;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        return new Channel('channel.' . $this->channelId);
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'content' => $this->message->content,
            'channel_id' => $this->channelId,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username ?? $this->user->name
            ],
            'created_at' => $this->message->created_at
        ];
    }
}
