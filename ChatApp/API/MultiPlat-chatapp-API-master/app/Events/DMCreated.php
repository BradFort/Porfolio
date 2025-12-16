<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

namespace App\Events;

use App\Models\DMChannel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DMCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $dmChannel;
    public $participant1Id;
    public $participant2Id;

    public function __construct(DMChannel $dmChannel, int $participant1Id, int $participant2Id)
    {
        $this->dmChannel = $dmChannel;
        $this->participant1Id = $participant1Id;
        $this->participant2Id = $participant2Id;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('chatappapi-database-dm.created');
    }

    public function broadcastAs(): string
    {
        return 'dm.created';
    }

    public function broadcastWith(): array
    {
        return [
            'dm_id' => $this->dmChannel->id,
            'channel_id' => $this->dmChannel->channel_id,
            'participant1_id' => $this->participant1Id,
            'participant2_id' => $this->participant2Id,
            'channel' => [
                'id' => $this->dmChannel->channel->id,
                'name' => $this->dmChannel->channel->name,
                'type' => $this->dmChannel->channel->type,
                'description' => $this->dmChannel->channel->description,
                'created_at' => $this->dmChannel->channel->created_at,
            ],
            'created_at' => $this->dmChannel->created_at,
        ];
    }
}
