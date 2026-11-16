using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace CareersDay.Api.Admin;

/// <summary>
/// Protects admin endpoints with the PIN from the ADMIN_PIN setting (sent as the X-Admin-Pin header).
/// After <see cref="MaxFailures"/> wrong PINs from one IP address, that address is locked out for a minute,
/// so a curious pupil on the same network can't just try every PIN.
/// </summary>
public class AdminPinFilter(IConfiguration config, ILogger<AdminPinFilter> logger) : IEndpointFilter
{
    public const string HeaderName = "X-Admin-Pin";
    private const int MaxFailures = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(1);

    private static readonly ConcurrentDictionary<string, (int Failures, DateTimeOffset LockedUntil)> Attempts = new();

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        var expected = config["ADMIN_PIN"];
        if (string.IsNullOrWhiteSpace(expected))
            return Results.Json(new { error = "ADMIN_PIN is not configured on the server." }, statusCode: 503);

        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTimeOffset.UtcNow;

        if (Attempts.TryGetValue(ip, out var state) && state.LockedUntil > now)
        {
            var wait = (int)Math.Ceiling((state.LockedUntil - now).TotalSeconds);
            return Results.Json(new { error = $"Too many wrong PINs. Try again in {wait}s." }, statusCode: 429);
        }

        var supplied = http.Request.Headers[HeaderName].ToString();
        if (!FixedTimeEquals(supplied, expected))
        {
            var failures = (state.LockedUntil > now ? 0 : state.Failures) + 1;
            var lockedUntil = failures >= MaxFailures ? now + LockoutDuration : DateTimeOffset.MinValue;
            Attempts[ip] = (failures >= MaxFailures ? 0 : failures, lockedUntil);
            logger.LogWarning("Wrong admin PIN from {Ip} ({Failures} in a row)", ip, failures);
            return Results.Json(new { error = "Wrong PIN." }, statusCode: 401);
        }

        Attempts.TryRemove(ip, out _);
        return await next(context);
    }

    private static bool FixedTimeEquals(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
}
