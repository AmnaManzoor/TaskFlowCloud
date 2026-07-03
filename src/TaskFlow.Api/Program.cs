using FluentValidation;
using TaskFlow.Api.Extensions;
using Azure.Identity;

var builder = WebApplication.CreateBuilder(args);

var keyVaultUri = builder.Configuration["KeyVault:VaultUri"];

if //(!builder.Environment.IsDevelopment() &&
    (!string.IsNullOrWhiteSpace(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUri),
        new DefaultAzureCredential());
    
}

builder.ConfigureSerilog();

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

app.ConfigurePipeline();

await app.InitializeDatabaseAsync();

app.Run();

public partial class Program;
