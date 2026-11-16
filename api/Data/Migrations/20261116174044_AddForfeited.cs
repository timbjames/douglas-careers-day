using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareersDay.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddForfeited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Forfeited",
                table: "RaffleEntries",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Forfeited",
                table: "RaffleEntries");
        }
    }
}
