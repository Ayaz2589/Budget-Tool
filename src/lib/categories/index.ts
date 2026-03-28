export {
  // Types
  type SubCategory,
  type ParentCategory,
  type CategoryDefinition,
  // Constants
  COMPOSITE_KEY_SEPARATOR,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ALL_EXPENSE_SUBCATEGORIES,
  ALL_INCOME_SUBCATEGORIES,
  // Helpers
  buildCompositeKey,
  parseCompositeKey,
  findCategory,
  getParentFromComposite,
  getParentCategories,
  getSubcategories,
  getCategoryIcon,
  getCategoryColorClass,
  getAllCompositeKeys,
  findParentBySubKey,
} from "./registry";

export {
  type MigrationResult,
  migrateCategoryString,
  migrateCategories,
  isMigrationNeeded,
  getCategoryMigrationVersion,
  setCategoryMigrationVersion,
} from "./migration";
