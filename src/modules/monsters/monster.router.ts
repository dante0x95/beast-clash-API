import { Router } from "express";

import { parseOrThrow } from "../../shared/validation/parse-or-throw.js";
import {
  createMonsterSchema,
  listMonstersQuerySchema,
  monsterIdParamSchema,
  updateMonsterSchema,
} from "./monster.schemas.js";
import { type MonsterService } from "./monster.service.js";

export function createMonsterRouter(service: MonsterService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const input = parseOrThrow(createMonsterSchema, req.body);
    const monster = await service.create(input);

    res.status(201).location(`${req.baseUrl}/${monster.id}`).json(monster);
  });

  router.get("/", async (req, res) => {
    const query = parseOrThrow(listMonstersQuerySchema, req.query);

    res.json(await service.list(query));
  });

  router.get("/:id", async (req, res) => {
    const { id } = parseOrThrow(monsterIdParamSchema, req.params);

    res.json(await service.getById(id));
  });

  router.patch("/:id", async (req, res) => {
    const { id } = parseOrThrow(monsterIdParamSchema, req.params);
    const input = parseOrThrow(updateMonsterSchema, req.body);

    res.json(await service.update(id, input));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseOrThrow(monsterIdParamSchema, req.params);
    await service.remove(id);

    res.status(204).end();
  });

  return router;
}
