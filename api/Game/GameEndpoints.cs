using System.Text.RegularExpressions;
using CareersDay.Api.Admin;
using CareersDay.Api.Data;
using CareersDay.Api.Raffle;
using Microsoft.EntityFrameworkCore;

namespace CareersDay.Api.Game;

public record SubmitScoreRequest(string? Nickname, int Score);
public record SubmitScoreResponse(int Id, int Rank, int Score, string Nickname);
public record LeaderboardEntry(int Id, int Rank, string Nickname, int Score, DateTimeOffset CreatedAt);

public static partial class GameEndpoints
{
    public const string ScoreRateLimitPolicy = "game-score";
    public const int MaxNicknameLength = 16;

    /// <summary>A 30-second round can't realistically go above this; anything higher is tampering.</summary>
    public const int MaxScore = 5000;

    // Letters, digits, spaces, underscores and hyphens, e.g. "Bug_Hunter-7".
    [GeneratedRegex(@"^[\p{L}\p{N}][\p{L}\p{N} _\-]*$")]
    private static partial Regex NicknamePattern();

    private static IResult Error(string message, int status = 400) =>
        Results.Json(new { error = message }, statusCode: status);

    // Highest score first; on a tie, whoever got there first ranks higher.
    private static IQueryable<GameScore> Ranked(this IQueryable<GameScore> q) =>
        q.OrderByDescending(s => s.Score).ThenBy(s => s.CreatedAt).ThenBy(s => s.Id);

    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        var game = app.MapGroup("/api/game");

        game.MapPost("/scores", async (SubmitScoreRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var nickname = Regex.Replace((req.Nickname ?? "").Trim(), @"\s+", " ");
            if (nickname.Length == 0) return Error("Pick a nickname for the leaderboard.");
            if (nickname.Length > MaxNicknameLength) return Error($"Nicknames can be up to {MaxNicknameLength} characters.");
            if (!NicknamePattern().IsMatch(nickname)) return Error("Nicknames can use letters, numbers, spaces, _ and -.");
            if (!NameRules.IsClean(nickname)) return Error("Let's keep it friendly! Please pick another nickname.");
            if (req.Score is < 0 or > MaxScore) return Error("That score doesn't look right.");

            var score = new GameScore { Nickname = nickname, Score = req.Score };
            db.GameScores.Add(score);
            await db.SaveChangesAsync(ct);

            // Rank = 1 + scores that beat this one. Ties go to whoever got there first, and this score
            // is the newest, so every other score that's equal or higher ranks above it.
            var better = await db.GameScores.CountAsync(s => s.Id != score.Id && s.Score >= score.Score, ct);

            return Results.Created($"/api/game/scores/{score.Id}",
                new SubmitScoreResponse(score.Id, better + 1, score.Score, score.Nickname));
        }).RequireRateLimiting(ScoreRateLimitPolicy);

        game.MapGet("/leaderboard", async (int? top, AppDbContext db, CancellationToken ct) =>
        {
            var take = Math.Clamp(top ?? 10, 1, 100);
            var rows = await db.GameScores.Ranked().Take(take).ToListAsync(ct);
            return rows.Select((s, i) => new LeaderboardEntry(s.Id, i + 1, s.Nickname, s.Score, s.CreatedAt));
        });

        // ---------- Admin ----------
        var admin = app.MapGroup("/api/admin/game").AddEndpointFilter<AdminPinFilter>();

        admin.MapGet("/scores", async (AppDbContext db, CancellationToken ct) =>
        {
            var rows = await db.GameScores.Ranked().Take(500).ToListAsync(ct);
            return rows.Select((s, i) => new LeaderboardEntry(s.Id, i + 1, s.Nickname, s.Score, s.CreatedAt));
        });

        admin.MapDelete("/scores/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var deleted = await db.GameScores.Where(s => s.Id == id).ExecuteDeleteAsync(ct);
            return deleted == 0 ? Error("Score not found.", 404) : Results.NoContent();
        });

        admin.MapDelete("/scores", async (AppDbContext db, CancellationToken ct) =>
            Results.Ok(new { deleted = await db.GameScores.ExecuteDeleteAsync(ct) }));
    }
}
