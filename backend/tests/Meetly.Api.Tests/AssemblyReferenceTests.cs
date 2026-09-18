using Meetly.Repository;
using Meetly.Repository.Abstraction;
using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Api.Tests;

public class AssemblyReferenceTests
{
    [Fact]
    public void Assemblies_ShouldBeLoadable()
    {
        Assert.NotNull(Meetly.Repository.AssemblyReference.Assembly);
        Assert.NotNull(Meetly.Service.AssemblyReference.Assembly);
        Assert.NotNull(Meetly.Contract.AssemblyReference.Assembly);
    }

    [Fact]
    public void SchedulingSchema_ShouldContainExpectedEntitiesAndForeignKeys()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=meetly;Username=postgres;Password=postgres")
            .Options;
        using var context = new AppDbContext(options);

        var entityTypes = context.Model.GetEntityTypes().ToArray();
        var expectedTypes = new[]
        {
            typeof(Events),
            typeof(EventAvailableDates),
            typeof(EventEmails),
            typeof(EventParticipants),
            typeof(TimeSlots)
        };

        Assert.Equal(expectedTypes.OrderBy(x => x.Name), entityTypes.Select(x => x.ClrType).OrderBy(x => x.Name));
        Assert.All(entityTypes, entity => Assert.NotNull(entity.FindPrimaryKey()));
        Assert.All(entityTypes, entity => Assert.True(typeof(IAuditableEntity).IsAssignableFrom(entity.ClrType)));
        Assert.Equal(5, entityTypes.Sum(entity => entity.GetForeignKeys().Count()));
        Assert.Contains("CreatedAt", context.Database.GenerateCreateScript());
        Assert.Contains("CK_TimeSlots_Time", context.Database.GenerateCreateScript());
    }
}
