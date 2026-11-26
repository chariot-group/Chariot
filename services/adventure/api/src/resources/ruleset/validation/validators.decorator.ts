import { registerDecorator, ValidationOptions } from 'class-validator';
import {
  REQUIRED_LOCALE,
  SUPPORTED_LOCALES,
} from '@/resources/ruleset/constants/ruleset.constant';
import { analyzeJsonLogic } from '@/resources/ruleset/validation/json-logic.validator';

/** Returns the reasons a translated label is invalid (empty when valid). */
export function translatedLabelErrors(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return ['must be an object keyed by locale'];
  }
  const errors: string[] = [];
  const record = value as Record<string, unknown>;
  for (const [locale, text] of Object.entries(record)) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
      errors.push(
        `has unknown locale "${locale}" (allowed: ${SUPPORTED_LOCALES.join(', ')})`,
      );
    } else if (typeof text !== 'string' || text.trim() === '') {
      errors.push(`locale "${locale}" must be a non-empty string`);
    }
  }
  if (record[REQUIRED_LOCALE] === undefined) {
    errors.push(`must define the "${REQUIRED_LOCALE}" locale`);
  }
  return errors;
}

/** `{ en, fr?, es? }` — `en` required, unknown locales rejected. */
export function IsTranslatedLabel(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isTranslatedLabel',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => translatedLabelErrors(value).length === 0,
        defaultMessage: (args) =>
          `${args.property} ${translatedLabelErrors(args.value).join('; ')}`,
      },
    });
  };
}

/** Value must be a JSON Logic expression using standard operators only. */
export function IsJsonLogic(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isJsonLogic',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) =>
          analyzeJsonLogic(value).errors.length === 0,
        defaultMessage: (args) =>
          `${args.property} is not valid JSON Logic: ${analyzeJsonLogic(args.value).errors.join('; ')}`,
      },
    });
  };
}
