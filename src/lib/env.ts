const required = (name: string, value: string | undefined): string => {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const serverEnv = {
  get AUTH_SECRET() {
    return required("AUTH_SECRET", process.env.AUTH_SECRET);
  },
  get SYNC_SECRET() {
    return required("SYNC_SECRET", process.env.SYNC_SECRET);
  },
  get MONGODB_URI() {
    return required("MONGODB_URI", process.env.MONGODB_URI);
  },
  get AUTH_ALLOWED_EMAILS() {
    return process.env.AUTH_ALLOWED_EMAILS ?? "";
  },
  get MONGODB_DB_NAME() {
    return process.env.MONGODB_DB_NAME;
  },
};

export const publicEnv = {
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://reddune.solutions",
};
