FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Meetly.API/Meetly.API.csproj", "src/Meetly.API/"]
COPY ["src/Meetly.Service/Meetly.Service.csproj", "src/Meetly.Service/"]
COPY ["src/Meetly.Repository/Meetly.Repository.csproj", "src/Meetly.Repository/"]
COPY ["src/Meetly.Contract/Meetly.Contract.csproj", "src/Meetly.Contract/"]

RUN dotnet restore "src/Meetly.API/Meetly.API.csproj"
COPY . .
WORKDIR "/src/src/Meetly.API"
RUN dotnet build "Meetly.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Meetly.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Meetly.API.dll"]
