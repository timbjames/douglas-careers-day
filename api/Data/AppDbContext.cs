using Microsoft.EntityFrameworkCore;

namespace CareersDay.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<RaffleEntry> RaffleEntries => Set<RaffleEntry>();
    public DbSet<Prize> Prizes => Set<Prize>();
    public DbSet<GameScore> GameScores => Set<GameScore>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<RaffleEntry>(e =>
        {
            e.Property(x => x.TicketNumber).HasMaxLength(8);
            e.HasIndex(x => x.TicketNumber).IsUnique();
            e.Property(x => x.DisplayName).HasMaxLength(40);
            e.HasOne(x => x.Prize).WithMany().OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Prize>(e => e.Property(x => x.Name).HasMaxLength(100));

        b.Entity<GameScore>(e =>
        {
            e.Property(x => x.Nickname).HasMaxLength(20);
            e.HasIndex(x => x.Score);
        });
    }
}
