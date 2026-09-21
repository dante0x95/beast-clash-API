import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { type OpenApiDocument } from "./openapi.js";

export function createDocsRouter(document: OpenApiDocument): Router {
  const router = Router();

  // raw document for tooling (client generators, Postman import, etc.)
  router.get("/openapi.json", (_req, res) => {
    res.json(document);
  });
  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(document, { customSiteTitle: "Beast Clash API" }),
  );

  return router;
}
