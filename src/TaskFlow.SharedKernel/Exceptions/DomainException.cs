namespace TaskFlow.SharedKernel.Exceptions;

/// <summary>
/// Represents an exception raised by domain invariants.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
