import type { NextFunction, Request, Response } from "express";
import { createSupabaseClient } from "./client";

const client = createSupabaseClient();
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    client.auth.getUser(token);
}