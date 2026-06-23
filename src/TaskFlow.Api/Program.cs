using FluentValidation;
using TaskFlow.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureSerilog();

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

app.ConfigurePipeline();

await app.InitializeDatabaseAsync();

app.Run();

public partial class Program;
