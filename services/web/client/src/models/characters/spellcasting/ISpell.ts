export default interface ISpell {
  name?: string;
  level?: number;
  school?: string;
  description?: string;
  components: string[];
  castingTime?: string;
  duration?: string;
  range?: string;
  effectType?: string;
  damage?: string;
  healing?: string;
}
