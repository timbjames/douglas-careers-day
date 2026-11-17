using System.Text.RegularExpressions;

namespace CareersDay.Api.Raffle;

/// <summary>
/// Validation for the names pupils type in. We deliberately keep only a first name and an
/// optional surname initial, and reject anything that looks like more than that.
/// </summary>
public static partial class NameRules
{
    public const int MaxFirstNameLength = 20;

    // Letters (any language), spaces, hyphens and apostrophes, e.g. "Mary-Jane", "Zoë", "O'Neil".
    [GeneratedRegex(@"^\p{L}[\p{L}\p{M}' \-]*$")]
    private static partial Regex FirstNamePattern();

    // A deliberately small blocklist; the admin page can also delete entries.
    // Blocked anywhere in the name (no real first names contain these).
    private static readonly string[] BlockedAnywhere =
    [
        "fuck", "shit", "cunt", "bitch", "bastard", "wank", "twat", "slut", "whore", "bollock", "porn",
    ];

    // Short words only blocked as a whole word, so real names like "Nobuko" or "Marsel" still work.
    private static readonly HashSet<string> BlockedWords =
    [
        "dick", "cock", "piss", "arse", "prick", "slag", "nob", "tits", "sex", "poo", "bum", "willy",
    ];

    public static bool IsClean(string text)
    {
        var lower = text.ToLowerInvariant();
        var squashed = new string(lower.Where(char.IsLetter).ToArray());
        if (BlockedAnywhere.Any(squashed.Contains)) return false;

        var words = Regex.Split(lower, @"[^\p{L}]+").Where(w => w.Length > 0);
        return !words.Any(BlockedWords.Contains);
    }

    // School class, e.g. "1A", "S3B" or "4C2": 1–4 letters/numbers with at least one digit.
    [GeneratedRegex(@"^(?=.*[0-9])[A-Za-z0-9]{1,4}$")]
    private static partial Regex ClassPattern();

    /// <summary>
    /// Returns a tidy display name, e.g. "Sam T (1A)", or an error message for the pupil.
    /// The class tells apart pupils who share a name.
    /// </summary>
    public static (string? DisplayName, string? Error) Normalise(string? firstName, string? lastInitial, string? className)
    {
        var first = (firstName ?? "").Trim();
        first = Regex.Replace(first, @"\s+", " ");

        if (first.Length == 0)
            return (null, "Please enter your first name.");
        if (first.Length > MaxFirstNameLength)
            return (null, $"First name must be {MaxFirstNameLength} letters or fewer.");
        if (!FirstNamePattern().IsMatch(first))
            return (null, "First name can only contain letters, spaces, hyphens and apostrophes.");

        var initial = (lastInitial ?? "").Trim().TrimEnd('.');
        if (initial.Length > 1 || (initial.Length == 1 && !char.IsLetter(initial[0])))
            return (null, "Surname initial should be a single letter.");

        var cls = Regex.Replace(className ?? "", @"\s+", "").ToUpperInvariant();
        if (cls.Length == 0)
            return (null, "Please enter your class, e.g. 1A.");
        if (!ClassPattern().IsMatch(cls) || !IsClean(cls))
            return (null, "Class should look like 1A or S3B.");

        if (!IsClean(first))
            return (null, "Let's keep it friendly! Please use your real first name.");

        // Capitalise the first letter of each part: "mary-jane" -> "Mary-Jane".
        var pretty = Regex.Replace(first.ToLowerInvariant(), @"(^|[ \-'])(\p{L})",
            m => m.Groups[1].Value + m.Groups[2].Value.ToUpperInvariant());

        var name = initial.Length == 1 ? $"{pretty} {char.ToUpperInvariant(initial[0])}" : pretty;
        return ($"{name} ({cls})", null);
    }
}
