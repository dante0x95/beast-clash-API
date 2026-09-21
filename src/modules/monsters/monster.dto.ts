import { type Monster } from "./monster.types.js";

/** Public representation of a monster in API responses. */
export interface MonsterDto {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

/** Explicit field whitelist: nothing reaches the client unless it is listed here. */
export function toMonsterDto(monster: Monster): MonsterDto {
  return {
    id: monster.id,
    name: monster.name,
    hp: monster.hp,
    attack: monster.attack,
    defense: monster.defense,
    speed: monster.speed,
    imageUrl: monster.imageUrl,
    createdAt: monster.createdAt.toISOString(),
    updatedAt: monster.updatedAt.toISOString(),
  };
}
