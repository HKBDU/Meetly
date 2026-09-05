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
}
