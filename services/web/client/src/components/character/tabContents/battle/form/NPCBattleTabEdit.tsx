import { NPC } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface NPCBattleTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NPCBattleTabEdit({ npc, accentColor, form }: NPCBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  // Field arrays pour les listes dynamiques
  const {
    fields: abilitiesFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  const {
    fields: standardActionsFields,
    append: appendStandardAction,
    remove: removeStandardAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.standard",
  });

  const {
    fields: legendaryActionsFields,
    append: appendLegendaryAction,
    remove: removeLegendaryAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.legendary",
  });

  const {
    fields: lairActionsFields,
    append: appendLairAction,
    remove: removeLairAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.lair",
  });

  // Liste des ability scores pour les saving throws
  const abilityScoreKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <Card
          className="gap-3 p-4 md:px-6 col-span-2 lg:col-span-1 h-fit"
          role="region"
          aria-labelledby="stats-heading-edit">
          <h2
            id="stats-heading-edit"
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("stats")}
          </h2>

          {/* Classe d'Armure */}
          <Controller
            name="stats.armorClass"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="armor-class"
                  className="text-sm font-medium">
                  {t("armorClass")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  id="armor-class"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "armor-class-error" : undefined}
                  placeholder={t("armorClass")}
                  type="number"
                />
                {fieldState.error && (
                  <FieldError
                    id="armor-class-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* Initiative */}
          <Controller
            name="stats.initiative"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="initiative"
                  className="text-sm font-medium">
                  {tEdit("initiative")}
                </label>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  id="initiative"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "initiative-error" : undefined}
                  placeholder={tEdit("initiative")}
                  type="number"
                />
                {fieldState.error && (
                  <FieldError
                    id="initiative-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          {/* Vitesses */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Vitesses</h3>
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="stats.speed.walk"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-walk"
                      className="text-xs">
                      Marche
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="speed-walk"
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.climb"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-climb"
                      className="text-xs">
                      Escalade
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="speed-climb"
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.swim"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-swim"
                      className="text-xs">
                      Nage
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="speed-swim"
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.fly"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-fly"
                      className="text-xs">
                      Vol
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="speed-fly"
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.burrow"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-burrow"
                      className="text-xs">
                      Fouissage
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="speed-burrow"
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </div>

          {/* Points de Vie */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("healthPoints")}</h3>
            <Controller
              name="stats.currentHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-current"
                    className="text-xs">
                    {tEdit("currentHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    id="health-current"
                    type="number"
                    className="text-sm"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="stats.maxHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-max"
                    className="text-xs">
                    {tEdit("maxHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    id="health-max"
                    type="number"
                    className="text-sm"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="stats.tempHitPoints"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="health-temp"
                    className="text-xs">
                    {tEdit("tempHP")}
                  </label>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    id="health-temp"
                    type="number"
                    className="text-sm"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* Hit Points Roll */}
          <Controller
            name="hitPointsRoll"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="hit-points-roll"
                  className="text-sm font-medium">
                  {t("hitPointsRoll")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="hit-points-roll"
                  placeholder="ex: 8d10+16"
                  className="text-sm"
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>

        {/* Jets de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby="saving-throws-heading-edit">
            <h2
              id="saving-throws-heading-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
          </Card>
          <div className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2">
            {abilityScoreKeys.map((key) => (
              <Controller
                key={key}
                name={`stats.savingThrows.${key}`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor={`saving-throw-${key}`}
                      className="text-sm font-medium">
                      {tAbilities(key)}
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id={`saving-throw-${key}`}
                      type="number"
                      className="text-sm"
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </div>
        </div>

        {/* Capacités et traits */}
        <Card
          className="gap-3 p-4 md:px-6 h-fit col-span-full lg:col-span-2"
          role="region"
          aria-labelledby="abilities-heading-edit">
          <div className="flex flex-row justify-between items-center">
            <h2
              id="abilities-heading-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("abilitiesAndTraits")}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendAbility({ name: "", description: "" })}
              className="flex items-center gap-2">
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {abilitiesFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 p-3 border rounded-[15px]">
                <div className="flex justify-between items-start gap-2">
                  <Controller
                    name={`abilities.${index}.name`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor={`ability-name-${index}`}
                          className="text-sm font-medium">
                          Nom
                        </label>
                        <Input
                          {...field}
                          id={`ability-name-${index}`}
                          placeholder="Nom de la capacité"
                          className="text-sm"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAbility(index)}
                    className="text-red-500 mt-6">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Controller
                  name={`abilities.${index}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`ability-description-${index}`}
                        className="text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        {...field}
                        id={`ability-description-${index}`}
                        placeholder="Description de la capacité"
                        rows={3}
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Actions Standards */}
        <Card className="gap-3 p-4 md:px-6 h-fit">
          <div className="flex flex-row justify-between items-center">
            <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{t("actions")}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendStandardAction({
                  name: "",
                  type: "",
                  description: "",
                  attackBonus: 0,
                  damage: [],
                  range: "",
                })
              }
              className="flex items-center gap-2">
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {standardActionsFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 p-3 border rounded-[15px]">
                <div className="flex justify-between items-start gap-2">
                  <Controller
                    name={`actions.standard.${index}.name`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor={`action-standard-name-${index}`}
                          className="text-xs">
                          Nom
                        </label>
                        <Input
                          {...field}
                          id={`action-standard-name-${index}`}
                          placeholder="Nom de l'action"
                          className="text-sm"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStandardAction(index)}
                    className="text-red-500 mt-4">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Controller
                  name={`actions.standard.${index}.type`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-standard-type-${index}`}
                        className="text-xs">
                        Type
                      </label>
                      <Input
                        {...field}
                        id={`action-standard-type-${index}`}
                        placeholder="ex: Corps à corps, Distance"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.standard.${index}.attackBonus`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-standard-attack-${index}`}
                        className="text-xs">
                        Bonus d'attaque
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id={`action-standard-attack-${index}`}
                        type="number"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.standard.${index}.range`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-standard-range-${index}`}
                        className="text-xs">
                        Portée
                      </label>
                      <Input
                        {...field}
                        id={`action-standard-range-${index}`}
                        placeholder="ex: 5 pi, 30/120 pi"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.standard.${index}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-standard-desc-${index}`}
                        className="text-xs">
                        Description
                      </label>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        id={`action-standard-desc-${index}`}
                        placeholder="Description de l'action"
                        rows={2}
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Actions Légendaires */}
        <Card className="gap-3 p-4 md:px-6 h-fit">
          <div className="flex flex-row justify-between items-center">
            <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{t("legendaryActions")}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendLegendaryAction({
                  name: "",
                  type: "",
                  description: "",
                  attackBonus: 0,
                  damage: [],
                  range: "",
                })
              }
              className="flex items-center gap-2">
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {legendaryActionsFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 p-3 border rounded-[15px]">
                <div className="flex justify-between items-start gap-2">
                  <Controller
                    name={`actions.legendary.${index}.name`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor={`action-legendary-name-${index}`}
                          className="text-xs">
                          Nom
                        </label>
                        <Input
                          {...field}
                          id={`action-legendary-name-${index}`}
                          placeholder="Nom de l'action"
                          className="text-sm"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLegendaryAction(index)}
                    className="text-red-500 mt-4">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Controller
                  name={`actions.legendary.${index}.type`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-legendary-type-${index}`}
                        className="text-xs">
                        Type
                      </label>
                      <Input
                        {...field}
                        id={`action-legendary-type-${index}`}
                        placeholder="ex: Corps à corps, Distance"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.legendary.${index}.attackBonus`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-legendary-attack-${index}`}
                        className="text-xs">
                        Bonus d'attaque
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id={`action-legendary-attack-${index}`}
                        type="number"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.legendary.${index}.range`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-legendary-range-${index}`}
                        className="text-xs">
                        Portée
                      </label>
                      <Input
                        {...field}
                        id={`action-legendary-range-${index}`}
                        placeholder="ex: 5 pi, 30/120 pi"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.legendary.${index}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-legendary-desc-${index}`}
                        className="text-xs">
                        Description
                      </label>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        id={`action-legendary-desc-${index}`}
                        placeholder="Description de l'action"
                        rows={2}
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Actions de Repaire */}
        <Card className="gap-3 p-4 md:px-6 h-fit">
          <div className="flex flex-row justify-between items-center">
            <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{t("lairActions")}</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendLairAction({
                  name: "",
                  type: "",
                  description: "",
                  attackBonus: 0,
                  damage: [],
                  range: "",
                })
              }
              className="flex items-center gap-2">
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {lairActionsFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 p-3 border rounded-[15px]">
                <div className="flex justify-between items-start gap-2">
                  <Controller
                    name={`actions.lair.${index}.name`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor={`action-lair-name-${index}`}
                          className="text-xs">
                          Nom
                        </label>
                        <Input
                          {...field}
                          id={`action-lair-name-${index}`}
                          placeholder="Nom de l'action"
                          className="text-sm"
                        />
                        {fieldState.error && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLairAction(index)}
                    className="text-red-500 mt-4">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Controller
                  name={`actions.lair.${index}.type`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-lair-type-${index}`}
                        className="text-xs">
                        Type
                      </label>
                      <Input
                        {...field}
                        id={`action-lair-type-${index}`}
                        placeholder="ex: Corps à corps, Distance"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.lair.${index}.attackBonus`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-lair-attack-${index}`}
                        className="text-xs">
                        Bonus d'attaque
                      </label>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id={`action-lair-attack-${index}`}
                        type="number"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.lair.${index}.range`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-lair-range-${index}`}
                        className="text-xs">
                        Portée
                      </label>
                      <Input
                        {...field}
                        id={`action-lair-range-${index}`}
                        placeholder="ex: 5 pi, 30/120 pi"
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name={`actions.lair.${index}.description`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`action-lair-desc-${index}`}
                        className="text-xs">
                        Description
                      </label>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        id={`action-lair-desc-${index}`}
                        placeholder="Description de l'action"
                        rows={2}
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
