"use client";

import { useTranslations } from "next-intl";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";
import { BuilderFieldFrame, RequiredMention } from "@/components/characterBuilder/BuilderCard";
import { BuilderFieldMessages } from "@/components/characterBuilder/BuilderFieldMessages";
import { fieldMessageIds, hasError, type BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import {
  allocationTotals,
  availableArrayValues,
  changeAllocationMethod,
  pointBuyCost,
  pointBuyRemaining,
  pointBuyValues,
  readAllocationAnswer,
  readAllocationConfig,
  setAllocationScore,
} from "@/lib/characterBuilder/abilityAllocation";
import type { AbilityAllocationMethod } from "@/lib/rulesetEngine/types";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-[13px] border border-input bg-gray-middle-light px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/**
 * `abilityAllocation`: the method (explained from its config), then one table row per ability with the base score
 * control, the bonus and the total (`config.totals` → computed fields of the page). No value is ever rolled.
 * @see FR-ruleset-character-builder — Web builder UI (Fields), Seed (no virtual dice)
 */
export function AbilityAllocationField({
  field,
  page,
  answer,
  issues,
  domId,
  onAnswer,
  entryLabel,
  embedded,
}: BuilderFieldProps) {
  const t = useTranslations("characterBuilder");
  const config = readAllocationConfig(field.config);
  const current = readAllocationAnswer(answer);
  const scores = current.scores ?? {};
  const methods = field.methods ?? [];
  const invalid = hasError(issues);
  const describedBy = fieldMessageIds(domId, issues, field.help);
  const remaining = current.method === "pointBuy" ? pointBuyRemaining(config.pointBuy, scores) : null;
  const buyValues = pointBuyValues(config.pointBuy);
  const totals = allocationTotals(config, page.fields);
  const headingId = `${domId}-title`;

  const methodHelp = () => {
    if (current.method === "pointBuy" && config.pointBuy) {
      const costs = buyValues
        .map((score) => t("pointCostPair", { score, cost: pointBuyCost(config.pointBuy, score) }))
        .join(", ");
      return `${t("methodHelp.pointBuy", {
        budget: config.pointBuy.budget ?? 0,
        min: buyValues[0] ?? config.pointBuy.min ?? 0,
        max: buyValues[buyValues.length - 1] ?? config.pointBuy.max ?? 0,
      })} ${t("methodHelp.pointBuyCosts", { costs })}`;
    }
    if (current.method === "standardArray" && config.standardArray) {
      return t("methodHelp.standardArray", { values: config.standardArray.join(", ") });
    }
    if (current.method === "roll" && config.roll?.dice) {
      return config.roll.dropLowest
        ? t("rollHelpDrop", { dice: config.roll.dice, drop: config.roll.dropLowest })
        : t("rollHelp", { dice: config.roll.dice });
    }
    return t("methodHelp.choose");
  };

  // « Incomplete » only flags the empty scores; any other error flags every score.
  const otherErrors = issues.some((issue) => issue.severity === "error" && issue.code !== "allocation-incomplete");

  const scoreControl = (ability: string, label: string) => {
    const id = `${domId}-${ability}`;
    const value = scores[ability];
    const scoreInvalid = invalid && (otherErrors || typeof value !== "number");
    const selectValues =
      current.method === "standardArray" && config.standardArray
        ? availableArrayValues(config.standardArray, scores, ability)
        : current.method === "pointBuy"
          ? buyValues
          : null;
    if (selectValues) {
      return (
        <select
          id={id}
          className={SELECT_CLASS}
          aria-label={t("baseOf", { ability: label })}
          aria-invalid={scoreInvalid || undefined}
          aria-describedby={describedBy}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(event) =>
            onAnswer(setAllocationScore(current, ability, event.target.value ? Number(event.target.value) : null))
          }>
          <option value="">—</option>
          {selectValues.map((score) => (
            <option
              key={score}
              value={score}>
              {current.method === "pointBuy"
                ? t("pointCostOption", { score, cost: pointBuyCost(config.pointBuy, score) })
                : score}
            </option>
          ))}
        </select>
      );
    }
    return (
      <NumberInput
        id={id}
        inputMode="numeric"
        min={config.roll?.min}
        max={config.roll?.max}
        aria-label={t("baseOf", { ability: label })}
        aria-invalid={scoreInvalid || undefined}
        aria-describedby={describedBy}
        value={typeof value === "number" ? value : ""}
        onChange={(event) => {
          const parsed = event.target.value === "" ? null : Number(event.target.value);
          onAnswer(setAllocationScore(current, ability, Number.isFinite(parsed) ? parsed : null));
        }}
      />
    );
  };

  return (
    <BuilderFieldFrame
      embedded={embedded}
      headingId={headingId}
      title={
        <>
          {field.label}
          <RequiredMention
            required={field.required}
            label={t("required")}
          />
        </>
      }
      aside={
        remaining !== null ? <span aria-live="polite">{t("pointsRemaining", { points: remaining })}</span> : undefined
      }>
      <div
        role="radiogroup"
        aria-label={t("methodLabel")}
        className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {methods.map((method) => {
          const id = `${domId}-method-${method}`;
          const checked = current.method === method;
          return (
            <div
              key={method}
              className={cn(
                "relative flex items-center gap-2 rounded-[13px] border border-input bg-gray-middle-light px-3 py-2 transition-colors hover:border-ring hover:bg-gray has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring",
                checked && "border-primary-light bg-primary/15",
              )}>
              <input
                id={id}
                type="radio"
                name={`${domId}-method`}
                checked={checked}
                onChange={() => onAnswer(changeAllocationMethod(current, method as AbilityAllocationMethod))}
                className="size-4 shrink-0 cursor-pointer accent-[var(--primary-light)] focus-visible:outline-none"
              />
              <label
                htmlFor={id}
                className="cursor-pointer text-sm font-medium text-white after:absolute after:inset-0 after:rounded-[13px] after:content-['']">
                {t(`method.${method}`)}
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{methodHelp()}</p>

      {current.method ? (
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">{field.label}</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th
                scope="col"
                className="w-[34%] pb-2 font-medium">
                {t("abilityColumn")}
              </th>
              <th
                scope="col"
                className="pb-2 font-medium">
                {t("baseColumn")}
              </th>
              <th
                scope="col"
                className="w-[18%] pb-2 text-center font-medium">
                {t("bonusColumn")}
              </th>
              <th
                scope="col"
                className="w-[18%] pb-2 text-center font-medium">
                {t("totalColumn")}
              </th>
            </tr>
          </thead>
          <tbody>
            {config.abilities.map((ability) => {
              const label = entryLabel(ability);
              const base = scores[ability];
              const total = totals[ability];
              const bonus = typeof base === "number" && typeof total === "number" ? total - base : null;
              return (
                <tr
                  key={ability}
                  className="border-t border-border">
                  <th
                    scope="row"
                    className="truncate py-2 pr-2 text-left font-medium text-white">
                    {label}
                  </th>
                  <td className="py-2 pr-2">{scoreControl(ability, label)}</td>
                  <td className="py-2 text-center text-muted-foreground">{bonus ? signed(bonus) : "—"}</td>
                  <td className="py-2 text-center text-lg font-semibold text-white">
                    {typeof total === "number" ? total : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      <BuilderFieldMessages
        domId={domId}
        help={field.help}
        issues={issues}
      />
    </BuilderFieldFrame>
  );
}
