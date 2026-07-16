-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InputSource" AS ENUM ('TEXT', 'TEMPLATE', 'RECIPE');

-- CreateEnum
CREATE TYPE "FoodLogStatus" AS ENUM ('PREVIEW', 'CONFIRMED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "QuantitySource" AS ENUM ('EXPLICIT', 'USER_PORTION_RULE', 'SYSTEM_PORTION_RULE', 'PROVIDER_SERVING', 'CATEGORY_DEFAULT', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "NutritionBasis" AS ENUM ('PER_100_GRAMS', 'PER_SERVING');

-- CreateEnum
CREATE TYPE "PortionScope" AS ENUM ('SYSTEM', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MealType" NOT NULL,
    "name" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InputEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "source" "InputSource" NOT NULL,
    "language" TEXT,
    "parserVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InputEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "inputEventId" TEXT NOT NULL,
    "status" "FoodLogStatus" NOT NULL,
    "totalCalories" DECIMAL(12,4) NOT NULL,
    "totalProtein" DECIMAL(12,4) NOT NULL,
    "totalCarbohydrates" DECIMAL(12,4) NOT NULL,
    "totalFat" DECIMAL(12,4) NOT NULL,
    "totalFibre" DECIMAL(12,4) NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogItem" (
    "id" TEXT NOT NULL,
    "foodLogId" TEXT NOT NULL,
    "foodId" TEXT,
    "rawText" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "preparationState" TEXT,
    "quantity" DECIMAL(12,4),
    "unit" TEXT,
    "grams" DECIMAL(12,4),
    "quantitySource" "QuantitySource" NOT NULL,
    "assumed" BOOLEAN NOT NULL,
    "resolutionConfidence" DECIMAL(5,4) NOT NULL,
    "calories" DECIMAL(12,4) NOT NULL,
    "protein" DECIMAL(12,4) NOT NULL,
    "carbohydrates" DECIMAL(12,4) NOT NULL,
    "fat" DECIMAL(12,4) NOT NULL,
    "fibre" DECIMAL(12,4) NOT NULL,
    "nutritionBasis" "NutritionBasis" NOT NULL,
    "provider" TEXT,
    "providerExternalId" TEXT,
    "sourceSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "preparationState" TEXT,
    "displayName" TEXT NOT NULL,
    "category" TEXT,
    "provider" TEXT NOT NULL,
    "providerExternalId" TEXT NOT NULL,
    "caloriesPer100g" DECIMAL(12,4) NOT NULL,
    "proteinPer100g" DECIMAL(12,4) NOT NULL,
    "carbohydratesPer100g" DECIMAL(12,4) NOT NULL,
    "fatPer100g" DECIMAL(12,4) NOT NULL,
    "fibrePer100g" DECIMAL(12,4) NOT NULL,
    "rawProviderPayload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPortion" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "grams" DECIMAL(12,4) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodPortion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortionRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "foodId" TEXT,
    "foodCategory" TEXT,
    "quantifier" TEXT NOT NULL,
    "mealType" "MealType",
    "grams" DECIMAL(12,4) NOT NULL,
    "scope" "PortionScope" NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "servingCount" DECIMAL(12,4) NOT NULL,
    "totalCalories" DECIMAL(12,4) NOT NULL,
    "totalProtein" DECIMAL(12,4) NOT NULL,
    "totalCarbohydrates" DECIMAL(12,4) NOT NULL,
    "totalFat" DECIMAL(12,4) NOT NULL,
    "totalFibre" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" TEXT,
    "grams" DECIMAL(12,4) NOT NULL,
    "calories" DECIMAL(12,4) NOT NULL,
    "protein" DECIMAL(12,4) NOT NULL,
    "carbohydrates" DECIMAL(12,4) NOT NULL,
    "fat" DECIMAL(12,4) NOT NULL,
    "fibre" DECIMAL(12,4) NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" "MealType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "foodId" TEXT,
    "recipeId" TEXT,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" TEXT,
    "grams" DECIMAL(12,4),
    "position" INTEGER NOT NULL,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foodLogId" TEXT,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Meal_userId_occurredAt_idx" ON "Meal"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "Meal_userId_type_occurredAt_idx" ON "Meal"("userId", "type", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodLog_inputEventId_key" ON "FoodLog"("inputEventId");

-- CreateIndex
CREATE INDEX "FoodLog_mealId_createdAt_idx" ON "FoodLog"("mealId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodLogItem_foodLogId_idx" ON "FoodLogItem"("foodLogId");

-- CreateIndex
CREATE INDEX "FoodLogItem_foodId_idx" ON "FoodLogItem"("foodId");

-- CreateIndex
CREATE INDEX "Food_normalizedName_preparationState_idx" ON "Food"("normalizedName", "preparationState");

-- CreateIndex
CREATE UNIQUE INDEX "Food_provider_providerExternalId_key" ON "Food"("provider", "providerExternalId");

-- CreateIndex
CREATE INDEX "FoodAlias_normalizedAlias_idx" ON "FoodAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "PortionRule_userId_foodId_quantifier_mealType_idx" ON "PortionRule"("userId", "foodId", "quantifier", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_userId_name_key" ON "Recipe"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_position_key" ON "RecipeIngredient"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Template_userId_name_key" ON "Template"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateItem_templateId_position_key" ON "TemplateItem"("templateId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_userId_endpoint_key_key" ON "IdempotencyKey"("userId", "endpoint", "key");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputEvent" ADD CONSTRAINT "InputEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_inputEventId_fkey" FOREIGN KEY ("inputEventId") REFERENCES "InputEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodLogId_fkey" FOREIGN KEY ("foodLogId") REFERENCES "FoodLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortionRule" ADD CONSTRAINT "PortionRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortionRule" ADD CONSTRAINT "PortionRule_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_foodLogId_fkey" FOREIGN KEY ("foodLogId") REFERENCES "FoodLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
