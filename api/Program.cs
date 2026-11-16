using CareersDay.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));

var app = builder.Build();

await MigrateWithRetryAsync(app);

var api = app.MapGroup("/api");

// Liveness + DB check, used by the frontend status badge and the compose healthcheck.
api.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
{
    var dbOk = await db.Database.CanConnectAsync(ct);
    var body = new { status = dbOk ? "ok" : "degraded", database = dbOk, time = DateTimeOffset.UtcNow };
    return dbOk ? Results.Ok(body) : Results.Json(body, statusCode: StatusCodes.Status503ServiceUnavailable);
});

app.Run();

// Postgres may still be starting when the API container boots, so retry for a short while.
static async Task MigrateWithRetryAsync(WebApplication app)
{
    var logger = app.Logger;
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migrated");
            return;
        }
        catch (Exception ex) when (attempt < 10)
        {
            logger.LogWarning("Database not ready (attempt {Attempt}/10): {Message}", attempt, ex.Message);
            await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}
