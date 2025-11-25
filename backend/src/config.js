export function createConfig(env) {
  // Default to development if not explicitly set
  const NODE_ENV = env.NODE_ENV || "development";
  const isDev = NODE_ENV === "development";

  return {
    NODE_ENV,
    isDev,

    PORT: env.PORT || 3000,
    JWT_SECRET: env.JWT_SECRET || "dev-secret",
    TOKEN_TTL_HOURS: Number(env.TOKEN_TTL_HOURS) || 2,
    ADMIN_DEFAULT_PASSWORD: env.ADMIN_DEFAULT_PASSWORD || "admin123",

    // Edge protection
    EDGE_HEADER_NAME: env.EDGE_HEADER_NAME || "X-Edge-Secret",
    EDGE_SECRET: env.EDGE_SECRET || "",
    // EDGE_ENFORCE removed; handled by isDev now

    // CORS
    CORS_ORIGIN: (isDev ? env.CORS_ORIGIN_DEVELOPMENT : env.CORS_ORIGIN_PRODUCTION) || "https://itec401-demo-nf.sgubproject.com",

    CORS_ORIGIN_DEVELOPMENT: env.CORS_ORIGIN_DEVELOPMENT,
    CORS_ORIGIN_PRODUCTION: env.CORS_ORIGIN_PRODUCTION,
    
    // JSON body limits
    JSON_BODY_LIMIT: env.JSON_BODY_LIMIT || '256kb',

    // Database to use
    DB_PROVIDER: env.DB_PROVIDER || "file", // e.g. "file", "mongo", "dynamo"
    DB_FILE_PATH: env.DB_FILE_PATH || "./data/db.json", // only relevant for "file"

    // Sample users
    SAMPLE_USERS:
      NODE_ENV === "development"
        ? [
            { username: "nabil", password: "nabil123" },
            { username: "carlos", password: "carlos123" },
          ]
        : [],
  };
}