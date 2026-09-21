-- CreateTable
CREATE TABLE "monsters" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "monsters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monsters_deleted_at_idx" ON "monsters"("deleted_at");


-- Mirror the domain invariants so the DB rejects invalid rows on its own
ALTER TABLE "monsters"
  ADD CONSTRAINT "monsters_name_not_blank" CHECK (char_length(btrim("name")) > 0),
  ADD CONSTRAINT "monsters_hp_positive" CHECK ("hp" > 0),
  ADD CONSTRAINT "monsters_attack_non_negative" CHECK ("attack" >= 0),
  ADD CONSTRAINT "monsters_defense_non_negative" CHECK ("defense" >= 0),
  ADD CONSTRAINT "monsters_speed_non_negative" CHECK ("speed" >= 0);
