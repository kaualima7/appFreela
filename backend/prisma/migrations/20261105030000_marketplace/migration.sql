-- Preserva usuários e contatos existentes; nenhum vínculo é inferido por e-mail.
ALTER TABLE "User" ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'FREELANCER';
ALTER TABLE "Client" ADD COLUMN "clientUserId" INTEGER
  REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Client_clientUserId_idx" ON "Client"("clientUserId");

CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "freelancerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startingPrice" DECIMAL NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ServiceInterest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceId" INTEGER NOT NULL,
    "clientUserId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceInterest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceInterest_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Service_freelancerId_idx" ON "Service"("freelancerId");
CREATE INDEX "Service_published_category_idx" ON "Service"("published", "category");
CREATE INDEX "ServiceInterest_clientUserId_idx" ON "ServiceInterest"("clientUserId");
CREATE UNIQUE INDEX "ServiceInterest_serviceId_clientUserId_key" ON "ServiceInterest"("serviceId", "clientUserId");
