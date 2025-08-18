import jwt from "jsonwebtoken";
import { schemaFromEmail } from "../db/tenancy.js";

export function tenantContext(req, _res, next) {
  let email = req.user?.email || null;

  if (!email && req.headers.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.slice("Bearer ".length);
    try {
      const decoded = jwt.decode(token);
      email = decoded?.email || decoded?.sub || null;
    } catch {}
  }

  if (email) req.tenantSchema = schemaFromEmail(email);
  next();
}