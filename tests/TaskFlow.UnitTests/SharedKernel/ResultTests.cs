using TaskFlow.SharedKernel.Results;

namespace TaskFlow.UnitTests.SharedKernel;

public class ResultTests
{
    [Fact]
    public void Success_ReturnsSuccessfulResult()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void Failure_ReturnsFailedResult()
    {
        var error = Error.Validation("Invalid value");

        var result = Result.Failure(error);

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public void GenericSuccess_ExposesValue()
    {
        var result = Result<string>.Success("taskflow");

        Assert.True(result.IsSuccess);
        Assert.Equal("taskflow", result.Value);
    }
}
