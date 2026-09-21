import { Router } from "express";

export interface HealthDeps {
  checkDatabase: () => Promise<void>;
}

export function createHealthRouter({ checkDatabase }: HealthDeps): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      await checkDatabase();
      res.json({ db: "up", status: "ok" });
    } catch (error) {
      req.log.error(
        { err: error },
        "health check: la base de datos no responde",
      );
      res.status(503).json({ db: "down", status: "error" });
    }
  });

  return router;
}
