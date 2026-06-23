using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace TaskFlow.Application;

/// <summary>
/// Marker type for assembly scanning.
/// </summary>
public static class ApplicationAssemblyReference
{
    public static Assembly Assembly => typeof(ApplicationAssemblyReference).Assembly;
}

public static class DependencyInjection
{
  public static IServiceCollection AddApplication(this IServiceCollection services)
  {
    services.AddValidatorsFromAssembly(ApplicationAssemblyReference.Assembly);

    return services;
  }
}
