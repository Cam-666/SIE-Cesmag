-- AlterTable
ALTER TABLE "emprendimiento" ADD COLUMN "diagnostico_inicial" VARCHAR(1000);

-- CreateIndex
CREATE UNIQUE INDEX "formulario_id_emprendedor_key" ON "formulario"("id_emprendedor");
