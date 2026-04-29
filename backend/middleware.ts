import type { NextFunction, Request, Response } from "express";
import { createSupabaseClient } from "./client";
import { prisma } from "./db";

const client = createSupabaseClient();
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization;

  const data = await client.auth.getUser(token);
  const userId = data.data.user?.id;
  if (userId) {
    try {
      const provider = data.data.user?.app_metadata.provider === 'google' ? 'GOOGLE' : 'GITHUB';
      // Use upsert to avoid throwing errors if the user already exists
      await prisma.user.upsert({
        where: { id: data.data.user?.id },
        update: {},
        create: {
          id: data.data.user?.id as string,
          supabaseId: data.data.user?.id as string,
          email: data.data.user?.email!,
          provider: provider,
          name: data.data.user?.user_metadata.full_name,
        }
      });
    } catch(e) {
      console.error("Error creating/updating user in DB:", e);
    }
    req.userId = userId;
    next();
  } else {
    res.status(403).json({
      error: "Not Authorized"
    })
  }
}
