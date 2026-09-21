import { type RequestHandler, Router } from "express";

export interface HealthDeps {
  checkDatabase: () => Promise<void>;
}

export function createHealthRouter({ checkDatabase }: HealthDeps): Router {
  const router = Router();

  // readiness: can this instance serve traffic right now? (depends on the database)
  const ready: RequestHandler = async (req, res) => {
    try {
      await checkDatabase();
      res.json({ db: "up", status: "ok" });
    } catch (error) {
      req.log.error({ err: error }, "health check: database is not responding");
      res.status(503).json({ db: "down", status: "error" });
    }
  };

  // liveness: is the process alive? Never touches dependencies, so a database
  // outage does not make the platform restart a perfectly healthy process
  router.get("/live", (_req, res) => {
    res.json({ status: "ok" });
  });
  router.get("/ready", ready);
  // kept as an alias of /ready so existing clients and probes keep working
  router.get("/", ready);

  return router;
}
