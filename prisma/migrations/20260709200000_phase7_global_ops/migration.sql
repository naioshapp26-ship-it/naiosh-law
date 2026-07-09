-- CreateTable
CREATE TABLE "SupplyChainPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'مورّد',
    "country" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyChainPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyChainShipment" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "partnerId" TEXT,
    "caseRef" TEXT,
    "description" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'قيد الشحن',
    "shipDate" TEXT,
    "eta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyChainShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternationalLawMatter" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "treaty" TEXT,
    "clientName" TEXT,
    "matterType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "openedDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternationalLawMatter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NaiochBranch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "managerName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'نشط',
    "isHQ" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NaiochBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircularAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "circularRef" TEXT,
    "message" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'متوسط',
    "status" TEXT NOT NULL DEFAULT 'جديد',
    "dueDate" TEXT,
    "branchId" TEXT,
    "acknowledgedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircularAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplyChainShipment_refNo_key" ON "SupplyChainShipment"("refNo");

-- CreateIndex
CREATE UNIQUE INDEX "InternationalLawMatter_refNo_key" ON "InternationalLawMatter"("refNo");

-- CreateIndex
CREATE UNIQUE INDEX "NaiochBranch_code_key" ON "NaiochBranch"("code");

-- AddForeignKey
ALTER TABLE "SupplyChainShipment" ADD CONSTRAINT "SupplyChainShipment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "SupplyChainPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircularAlert" ADD CONSTRAINT "CircularAlert_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "NaiochBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
