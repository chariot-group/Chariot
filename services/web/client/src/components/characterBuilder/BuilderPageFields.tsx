"use client";

import { AbilityAllocationField } from "@/components/characterBuilder/fields/AbilityAllocationField";
import { EntitySelectField } from "@/components/characterBuilder/fields/EntitySelectField";
import { GrantedChoicesField } from "@/components/characterBuilder/fields/GrantedChoicesField";
import { SpellSelectField } from "@/components/characterBuilder/fields/SpellSelectField";
import { SummaryField } from "@/components/characterBuilder/fields/SummaryField";
import { ValueField } from "@/components/characterBuilder/fields/ValueField";
import type { BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { groupPageFields, isHalfWidthField } from "@/lib/characterBuilder/pageLayout";
import { readFieldAnswer, setFieldAnswer, setGrantAnswer } from "@/lib/characterBuilder/builderAnswers";
import { cn } from "@/lib/utils";
import { BuilderCard } from "@/components/characterBuilder/BuilderCard";
import type {
  BuilderAnswers,
  BuilderEvaluation,
  EvaluatedField,
  EvaluatedPage,
  FieldType,
} from "@/lib/rulesetEngine/types";

const FIELD_COMPONENTS: Record<FieldType, (props: BuilderFieldProps) => React.ReactNode> = {
  entitySelect: EntitySelectField,
  multiSelect: EntitySelectField,
  grantedChoices: GrantedChoicesField,
  abilityAllocation: AbilityAllocationField,
  number: ValueField,
  text: ValueField,
  computed: ValueField,
  summary: SummaryField,
  spellSelect: SpellSelectField,
};

/**
 * Fields of the current builder page, each bound to its answer (per repeat index on a repeated page), laid out as
 * cards (docs/design.md §5.3).
 * @see FR-ruleset-character-builder — Web builder UI (Fields, Layout)
 */
export function BuilderPageFields({
  page,
  evaluation,
  answers,
  onAnswersChange,
  entryLabel,
  onGoToPage,
}: {
  page: EvaluatedPage;
  evaluation: BuilderEvaluation;
  answers: BuilderAnswers;
  onAnswersChange: (update: (answers: BuilderAnswers) => BuilderAnswers) => void;
  entryLabel: (key: string) => string;
  onGoToPage: (pageKey: string) => void;
}) {
  const renderField = (field: EvaluatedField, embedded: boolean) => {
    const Component = FIELD_COMPONENTS[field.type];
    const issues = evaluation.issues.filter(
      (issue) => issue.stepId === page.stepId && issue.index === page.index && issue.fieldId === field.id,
    );
    return (
      <Component
        key={`${page.key}-${field.id}`}
        field={field}
        page={page}
        evaluation={evaluation}
        answer={readFieldAnswer(answers, field.id, page.index)}
        issues={issues}
        domId={`builder-${page.key.replace(/[^A-Za-z0-9_-]/g, "-")}-${field.id}`}
        onAnswer={(value) =>
          onAnswersChange((current) =>
            setFieldAnswer(
              current,
              field.id,
              page.index,
              typeof value === "function" ? value(readFieldAnswer(current, field.id, page.index)) : value,
            ),
          )
        }
        onGrantAnswer={(grantId, keys) =>
          onAnswersChange((current) => setGrantAnswer(current, field.id, page.index, grantId, keys))
        }
        entryLabel={entryLabel}
        embedded={embedded}
        onGoToPage={onGoToPage}
        answers={answers}
      />
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {groupPageFields(page).map((group) =>
        group.card ? (
          <BuilderCard
            key={`${page.key}-card-${group.card.id}`}
            headingId={`builder-${page.key.replace(/[^A-Za-z0-9_-]/g, "-")}-card-${group.card.id}`}
            title={group.card.title}
            subtitle={group.card.description}>
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field.id}
                  className={cn("min-w-0", !isHalfWidthField(field) && "md:col-span-2")}>
                  {renderField(field, true)}
                </div>
              ))}
            </div>
          </BuilderCard>
        ) : (
          renderField(group.fields[0], false)
        ),
      )}
    </div>
  );
}
