# build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY . ./
RUN dotnet publish -c Release -o out

# runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000

CMD ["dotnet", "BunkerGame.Backend.dll"]
