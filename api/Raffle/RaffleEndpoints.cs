using System.Security.Cryptography;
using CareersDay.Api.Admin;
using CareersDay.Api.Data;
using CareersDay.Api.Live;
using Microsoft.EntityFrameworkCore;

namespace CareersDay.Api.Raffle;

public record EnterRaffleRequest(string? FirstName, string? LastInitial);
public record TicketResponse(string TicketNumber, string DisplayName);
public record RaffleStats(int Entries, int Winners, int PrizesRemaining);
public record WinnerDto(int Id, string TicketNumber, string DisplayName, string? PrizeName, DateTimeOffset? WonAt);
public record EntryDto(int Id, string TicketNumber, string DisplayName, DateTimeOffset CreatedAt,
    bool IsWinner, bool Forfeited, string? PrizeName);
public record PublicPrizeDto(string Name, int Quantity, int Remaining);
public record PrizeDto(int Id, string Name, int Quantity, int SortOrder, int Awarded);
public record SavePrizeRequest(string? Name, int Quantity);
public record DrawRequest(int PrizeId);

public static class RaffleEndpoints
{
    public const string EntryRateLimitPolicy = "raffle-entry";

    private static IResult Error(string message, int status = 400) =>
        Results.Json(new { error = message }, statusCode: status);

    public static void MapRaffleEndpoints(this IEndpointRouteBuilder app)
    {
        // ---------- Public ----------
        var raffle = app.MapGroup("/api/raffle");

        raffle.MapPost("/entries", async (EnterRaffleRequest req, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var (displayName, error) = NameRules.Normalise(req.FirstName, req.LastInitial);
            if (error is not null) return Error(error);

            // 4-digit tickets give 9,000 numbers: plenty for one day. Retry on the rare clash.
            for (var attempt = 0; attempt < 20; attempt++)
            {
                var ticket = RandomNumberGenerator.GetInt32(1000, 10000).ToString();
                if (await db.RaffleEntries.AnyAsync(e => e.TicketNumber == ticket, ct)) continue;

                db.RaffleEntries.Add(new RaffleEntry { TicketNumber = ticket, DisplayName = displayName! });
                try
                {
                    await db.SaveChangesAsync(ct);
                    await live.EntryAdded(displayName!, await db.RaffleEntries.CountAsync(ct));
                    return Results.Created($"/api/raffle/entries/{ticket}", new TicketResponse(ticket, displayName!));
                }
                catch (DbUpdateException)
                {
                    db.ChangeTracker.Clear(); // someone grabbed the same number at the same moment
                }
            }
            return Error("Couldn't allocate a ticket number, please try again.", 503);
        }).RequireRateLimiting(EntryRateLimitPolicy);

        raffle.MapGet("/stats", async (AppDbContext db, CancellationToken ct) =>
        {
            var entries = await db.RaffleEntries.CountAsync(ct);
            var winners = await db.RaffleEntries.CountAsync(e => e.IsWinner, ct);
            var totalPrizes = await db.Prizes.SumAsync(p => (int?)p.Quantity, ct) ?? 0;
            return new RaffleStats(entries, winners, Math.Max(0, totalPrizes - winners));
        });

        // What's up for grabs, for the big screen.
        raffle.MapGet("/prizes", async (AppDbContext db, CancellationToken ct) =>
            await db.Prizes
                .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
                .Select(p => new PublicPrizeDto(p.Name, p.Quantity,
                    p.Quantity - db.RaffleEntries.Count(e => e.IsWinner && e.PrizeId == p.Id)))
                .ToListAsync(ct));

        raffle.MapGet("/winners", async (AppDbContext db, CancellationToken ct) =>
            await db.RaffleEntries
                .Where(e => e.IsWinner)
                .OrderByDescending(e => e.WonAt)
                .Select(e => new WinnerDto(e.Id, e.TicketNumber, e.DisplayName, e.Prize!.Name, e.WonAt))
                .ToListAsync(ct));

        // ---------- Admin (PIN protected) ----------
        var admin = app.MapGroup("/api/admin").AddEndpointFilter<AdminPinFilter>();

        admin.MapGet("/check", () => Results.NoContent());

        admin.MapGet("/prizes", async (AppDbContext db, CancellationToken ct) =>
            await db.Prizes
                .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
                .Select(p => new PrizeDto(p.Id, p.Name, p.Quantity, p.SortOrder,
                    db.RaffleEntries.Count(e => e.IsWinner && e.PrizeId == p.Id)))
                .ToListAsync(ct));

        admin.MapPost("/prizes", async (SavePrizeRequest req, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var name = req.Name?.Trim() ?? "";
            if (name.Length is 0 or > 100) return Error("Prize name must be 1–100 characters.");
            if (req.Quantity is < 1 or > 1000) return Error("Quantity must be between 1 and 1000.");

            var nextOrder = (await db.Prizes.MaxAsync(p => (int?)p.SortOrder, ct) ?? 0) + 1;
            var prize = new Prize { Name = name, Quantity = req.Quantity, SortOrder = nextOrder };
            db.Prizes.Add(prize);
            await db.SaveChangesAsync(ct);
            await live.RaffleChanged();
            return Results.Created($"/api/admin/prizes/{prize.Id}",
                new PrizeDto(prize.Id, prize.Name, prize.Quantity, prize.SortOrder, 0));
        });

        admin.MapPut("/prizes/{id:int}", async (int id, SavePrizeRequest req, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var prize = await db.Prizes.FindAsync([id], ct);
            if (prize is null) return Error("Prize not found.", 404);

            var name = req.Name?.Trim() ?? "";
            if (name.Length is 0 or > 100) return Error("Prize name must be 1–100 characters.");
            var awarded = await db.RaffleEntries.CountAsync(e => e.IsWinner && e.PrizeId == id, ct);
            if (req.Quantity < Math.Max(1, awarded) || req.Quantity > 1000)
                return Error($"Quantity must be between {Math.Max(1, awarded)} and 1000 ({awarded} already won).");

            prize.Name = name;
            prize.Quantity = req.Quantity;
            await db.SaveChangesAsync(ct);
            await live.RaffleChanged();
            return Results.Ok(new PrizeDto(prize.Id, prize.Name, prize.Quantity, prize.SortOrder, awarded));
        });

        admin.MapDelete("/prizes/{id:int}", async (int id, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            if (await db.RaffleEntries.AnyAsync(e => e.IsWinner && e.PrizeId == id, ct))
                return Error("This prize has already been won, so it can't be deleted.", 409);
            var deleted = await db.Prizes.Where(p => p.Id == id).ExecuteDeleteAsync(ct);
            if (deleted == 0) return Error("Prize not found.", 404);
            await live.RaffleChanged();
            return Results.NoContent();
        });

        admin.MapGet("/raffle/entries", async (AppDbContext db, CancellationToken ct) =>
            await db.RaffleEntries
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new EntryDto(e.Id, e.TicketNumber, e.DisplayName, e.CreatedAt,
                    e.IsWinner, e.Forfeited, e.Prize != null ? e.Prize.Name : null))
                .ToListAsync(ct));

        admin.MapDelete("/raffle/entries/{id:int}", async (int id, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var deleted = await db.RaffleEntries.Where(e => e.Id == id).ExecuteDeleteAsync(ct);
            if (deleted == 0) return Error("Entry not found.", 404);
            await live.RaffleChanged();
            return Results.NoContent();
        });

        // End-of-day wipe: removes every entry (and so every winner). Prizes are kept.
        admin.MapDelete("/raffle/entries", async (AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var deleted = await db.RaffleEntries.ExecuteDeleteAsync(ct);
            await live.RaffleChanged();
            return Results.Ok(new { deleted });
        });

        admin.MapPost("/raffle/draw", async (DrawRequest req, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var prize = await db.Prizes.FindAsync([req.PrizeId], ct);
            if (prize is null) return Error("Prize not found.", 404);

            var awarded = await db.RaffleEntries.CountAsync(e => e.IsWinner && e.PrizeId == prize.Id, ct);
            if (awarded >= prize.Quantity) return Error($"All {prize.Quantity} of \"{prize.Name}\" have been won.", 409);

            var eligible = await db.RaffleEntries
                .Where(e => !e.IsWinner && !e.Forfeited)
                .Select(e => e.Id)
                .ToListAsync(ct);
            if (eligible.Count == 0) return Error("There are no entries left to draw from.", 409);

            var winner = await db.RaffleEntries.FindAsync([eligible[RandomNumberGenerator.GetInt32(eligible.Count)]], ct);
            winner!.IsWinner = true;
            winner.WonAt = DateTimeOffset.UtcNow;
            winner.PrizeId = prize.Id;
            await db.SaveChangesAsync(ct);
            await live.WinnerDrawn(winner.TicketNumber, winner.DisplayName, prize.Name);

            return Results.Ok(new WinnerDto(winner.Id, winner.TicketNumber, winner.DisplayName, prize.Name, winner.WonAt));
        });

        // Winner isn't around to collect: give the prize back and keep them out of future draws.
        admin.MapPost("/raffle/entries/{id:int}/forfeit", async (int id, AppDbContext db, LiveNotifier live, CancellationToken ct) =>
        {
            var entry = await db.RaffleEntries.FindAsync([id], ct);
            if (entry is null) return Error("Entry not found.", 404);
            if (!entry.IsWinner) return Error("That ticket hasn't won anything.", 409);

            entry.IsWinner = false;
            entry.WonAt = null;
            entry.PrizeId = null;
            entry.Forfeited = true;
            await db.SaveChangesAsync(ct);
            await live.RaffleChanged();
            return Results.NoContent();
        });
    }
}
