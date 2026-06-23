FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["TaskFlow.slnx", "./"]
COPY ["Directory.Build.props", "./"]
COPY ["src/TaskFlow.Api/TaskFlow.Api.csproj", "src/TaskFlow.Api/"]
COPY ["src/TaskFlow.Application/TaskFlow.Application.csproj", "src/TaskFlow.Application/"]
COPY ["src/TaskFlow.Domain/TaskFlow.Domain.csproj", "src/TaskFlow.Domain/"]
COPY ["src/TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj", "src/TaskFlow.Infrastructure/"]
COPY ["src/TaskFlow.SharedKernel/TaskFlow.SharedKernel.csproj", "src/TaskFlow.SharedKernel/"]
COPY ["src/TaskFlow.Contracts/TaskFlow.Contracts.csproj", "src/TaskFlow.Contracts/"]

RUN dotnet restore "src/TaskFlow.Api/TaskFlow.Api.csproj"

COPY . .
WORKDIR "/src/src/TaskFlow.Api"
RUN dotnet publish "TaskFlow.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
RUN mkdir -p /app/logs /app/wwwroot/uploads /app/uploads/profiles

ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
