import { Router } from "express";

import { parseOrThrow } from "../../shared/validation/parse-or-throw.js";
import {
  battleIdParamSchema,
  createBattleSchema,
  listBattlesQuerySchema,
} from "./battle.schemas.js";
import { type BattleService } from "./battle.service.js";

export function createBattleRouter(service: BattleService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const input = parseOrThrow(createBattleSchema, req.body);
    const battle = await service.create(input);

    res.status(201).location(`${req.baseUrl}/${battle.id}`).json(battle);
  });

  router.get("/", async (req, res) => {
    const query = parseOrThrow(listBattlesQuerySchema, req.query);

    res.json(await service.list(query));
  });

  router.get("/:id", async (req, res) => {
    const { id } = parseOrThrow(battleIdParamSchema, req.params);

    res.json(await service.getById(id));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseOrThrow(battleIdParamSchema, req.params);
    await service.remove(id);

    res.status(204).end();
  });

  return router;
}
