using Microsoft.AspNetCore.SignalR;

namespace CareersDay.Api.Live;

/// <summary>
/// Real-time channel at /hubs/live. Clients only listen: everything they can do goes through the
/// REST API, which then broadcasts what happened via <see cref="LiveNotifier"/>.
/// </summary>
public class LiveHub : Hub;

public record EntryAddedEvent(string DisplayName, int Entries);
public record ScoreAddedEvent(string Nickname, int Score, int Rank);
public record WinnerDrawnEvent(string TicketNumber, string DisplayName, string? PrizeName);

/// <summary>Event names shared with the frontend (web/src/live.ts).</summary>
public static class LiveEvents
{
    public const string EntryAdded = "EntryAdded";
    public const string ScoreAdded = "ScoreAdded";
    public const string WinnerDrawn = "WinnerDrawn";
    /// <summary>Something about entries, prizes or winners changed: refetch raffle stats.</summary>
    public const string RaffleChanged = "RaffleChanged";
    /// <summary>A score was removed or the board was wiped: refetch the leaderboard.</summary>
    public const string LeaderboardChanged = "LeaderboardChanged";
}

/// <summary>
/// Broadcasts events to every connected screen. A failed broadcast is logged and ignored:
/// the request that triggered it has already succeeded, and clients also poll as a fallback.
/// </summary>
public class LiveNotifier(IHubContext<LiveHub> hub, ILogger<LiveNotifier> logger)
{
    public Task EntryAdded(string displayName, int entries) =>
        Send(LiveEvents.EntryAdded, new EntryAddedEvent(displayName, entries));

    public Task ScoreAdded(string nickname, int score, int rank) =>
        Send(LiveEvents.ScoreAdded, new ScoreAddedEvent(nickname, score, rank));

    public Task WinnerDrawn(string ticketNumber, string displayName, string? prizeName) =>
        Send(LiveEvents.WinnerDrawn, new WinnerDrawnEvent(ticketNumber, displayName, prizeName));

    public Task RaffleChanged() => Send(LiveEvents.RaffleChanged, null);

    public Task LeaderboardChanged() => Send(LiveEvents.LeaderboardChanged, null);

    private async Task Send(string method, object? payload)
    {
        try
        {
            if (payload is null) await hub.Clients.All.SendAsync(method);
            else await hub.Clients.All.SendAsync(method, payload);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to broadcast {Event}", method);
        }
    }
}
