namespace CareersDay.Api.Data;

/// <summary>A free raffle entry. We only keep a first name + initial (visitors are pupils).</summary>
public class RaffleEntry
{
    public int Id { get; set; }

    /// <summary>Short, human-friendly ticket number shown on screen, e.g. "4821".</summary>
    public required string TicketNumber { get; set; }

    /// <summary>First name + initial only, e.g. "Sam T".</summary>
    public required string DisplayName { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsWinner { get; set; }
    public DateTimeOffset? WonAt { get; set; }

    public int? PrizeId { get; set; }
    public Prize? Prize { get; set; }
}

public class Prize
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int Quantity { get; set; } = 1;
    public int SortOrder { get; set; }
}

public class GameScore
{
    public int Id { get; set; }
    public required string Nickname { get; set; }
    public int Score { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
