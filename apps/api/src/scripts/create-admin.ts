import dotenv from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";
import { initDatabase, shutdownDatabase } from "../database/index.js";
import { AuthService } from "../services/auth.service.js";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const email = process.env.ADMIN_EMAIL || "admin@attherace.com";
const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
const name = process.env.ADMIN_NAME || "Admin";

async function main() {
  const repos = await initDatabase();
  const auth = new AuthService(repos);

  const existing = await repos.users.findByEmail(email);
  if (existing) {
    console.log(JSON.stringify({
      status: "exists",
      email: existing.email,
      role: existing.role,
      message: "Admin already exists. Use existing credentials or set ADMIN_PASSWORD in .env and delete the user first.",
    }, null, 2));
    await shutdownDatabase();
    return;
  }

  const { user } = await auth.register(email, password, "admin", name);

  console.log(JSON.stringify({
    status: "created",
    email: user.email,
    password,
    role: user.role,
    loginUrl: "http://localhost:5173/admin",
  }, null, 2));

  await shutdownDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
