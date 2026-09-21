-- CreateTable
CREATE TABLE "battles" (
    "id" UUID NOT NULL,
    "monster_a_id" UUID NOT NULL,
    "monster_b_id" UUID NOT NULL,
    "winner_id" UUID NOT NULL,
    "loser_id" UUID NOT NULL,
    "snapshot_a" JSONB NOT NULL,
    "snapshot_b" JSONB NOT NULL,
    "total_turns" INTEGER NOT NULL,
    "turns" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "battles_created_at_idx" ON "battles"("created_at");

-- CreateIndex
CREATE INDEX "battles_monster_a_id_idx" ON "battles"("monster_a_id");

-- CreateIndex
CREATE INDEX "battles_monster_b_id_idx" ON "battles"("monster_b_id");

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_monster_a_id_fkey" FOREIGN KEY ("monster_a_id") REFERENCES "monsters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_monster_b_id_fkey" FOREIGN KEY ("monster_b_id") REFERENCES "monsters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integrity rules the ORM cannot express
ALTER TABLE "battles"
  ADD CONSTRAINT "battles_distinct_monsters" CHECK ("monster_a_id" <> "monster_b_id"),
  ADD CONSTRAINT "battles_winner_is_participant" CHECK ("winner_id" IN ("monster_a_id", "monster_b_id")),
  ADD CONSTRAINT "battles_loser_is_participant" CHECK ("loser_id" IN ("monster_a_id", "monster_b_id")),
  ADD CONSTRAINT "battles_winner_differs_from_loser" CHECK ("winner_id" <> "loser_id"),
  ADD CONSTRAINT "battles_total_turns_positive" CHECK ("total_turns" >= 1),
  ADD CONSTRAINT "battles_turns_match_total" CHECK (
    jsonb_typeof("turns") = 'array' AND jsonb_array_length("turns") = "total_turns"
  ),
  ADD CONSTRAINT "battles_snapshots_are_objects" CHECK (
    jsonb_typeof("snapshot_a") = 'object' AND jsonb_typeof("snapshot_b") = 'object'
  );