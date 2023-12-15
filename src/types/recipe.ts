import { Unit, createUnit, unit } from "mathjs";
import { Branded } from "./brand";

createUnit("count");

export type DatabaseData<T> = T & {
  readonly id: string;
};

export type Amount = {
  value: number;
  unit: string;
};
export const Amount = (): Amount => ({ value: 0, unit: "" });

export const AmountToUnit = (amount: Amount): Unit =>
  unit(`${amount.value} ${amount.unit}`);

export type Conversion = {
  from: Amount;
  to: Amount;
};
export const Conversion = (): Conversion => ({
  from: Amount(),
  to: Amount(),
});

export type Ingredient = {
  name: string;
  price: number;
  asPurchased: Amount;
  conversions: Conversion[] | false;
  expiry: string;
  store: string;
  link: string;
};
export const Ingredient = (): Ingredient => ({
  name: "",
  price: 0,
  asPurchased: Amount(),
  conversions: false,
  expiry: "",
  store: "",
  link: "",
});
export type IngredientID = Branded<string, "IngredientID">;
export const IngredientID = (id: string) => id as IngredientID;
export const getInPurchasedUnits = (
  ingredient: Ingredient,
  amount: Amount
): Amount => {
  const source = AmountToUnit(amount);
  const dest = unit(ingredient.asPurchased.unit);
  if (source.equalBase(dest))
    return {
      unit: ingredient.asPurchased.unit,
      value: source.toNumber(ingredient.asPurchased.unit),
    };
  const conversion = (ingredient.conversions || []).find((conversion) => {
    const from = AmountToUnit(conversion.from);
    const to = AmountToUnit(conversion.to);
    return from.equalBase(source) && to.equalBase(dest);
  });
  if (!conversion)
    throw new Error(`No conversion found from "${source}" to unit "${dest}"`);
  const inputValue = source.toNumber(conversion.from.unit);
  const conversionRatio = conversion.to.value / conversion.from.value;
  return {
    unit: ingredient.asPurchased.unit,
    value: unit(
      `${inputValue * conversionRatio} ${conversion.to.unit}`
    ).toNumber(ingredient.asPurchased.unit),
  };
};

export type RecipeIngredient = {
  ingredientID: IngredientID;
  amount: Amount;
  note: string;
};
export const RecipeIngredient = (): RecipeIngredient => ({
  ingredientID: IngredientID(""),
  amount: Amount(),
  note: "",
});

export type Recipe = {
  name: string;
  ingredients: RecipeIngredient[];
  portions: number;
  instructions: string;
  link: string;
};
export const Recipe = (): Recipe => ({
  name: "",
  ingredients: [],
  portions: 0,
  instructions: "",
  link: "",
});
export type RecipeID = Branded<string, "RecipeID">;
export const RecipeID = (id: string) => id as RecipeID;

export type Status = {
  status: "To Do" | "In Progress" | "Done";
  ingredientId: IngredientID;
};

export type ScheduleItem = {
  recipeID: RecipeID;
  date: string;
  people: number;
};
export const ScheduleItem = (): ScheduleItem => ({
  recipeID: RecipeID(""),
  date: new Date().toISOString(),
  people: 0,
});

export const UNITS = [
  "ml",
  "liter",
  "fluidounce",
  "floz",
  "teaspoon",
  "tablespoon",
  "cup",
  "pint",
  "quart",
  "gallon",
  "gram",
  "kg",
  "ounce",
  "oz",
  "lbs",
  "count",
];
