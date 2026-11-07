FROM node:24-alpine AS frontend
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /source
COPY Directory.Build.props ./
COPY src/ ./src/
RUN dotnet publish src/Wardrobe.Api -c Release -o /app --no-self-contained -m:1 -p:UseSharedCompilation=false
COPY --from=frontend /client/dist/ /app/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=backend /app/ ./
RUN mkdir -p /data/keys && chown -R 1654:1654 /data
USER 1654
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Wardrobe="Data Source=/data/wardrobe.db" \
    DataProtection__Path=/data/keys
EXPOSE 8080
ENTRYPOINT ["dotnet", "Wardrobe.Api.dll"]
