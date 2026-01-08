FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8443

# Build image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["Medical/Medical.csproj", "Medical/"]
RUN dotnet restore "Medical/Medical.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/Medical"
RUN dotnet build "Medical.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Medical.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Medical.dll"]
