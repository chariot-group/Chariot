import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Masteries {
    @Prop({ default: false })
    athletics: boolean;

    @Prop({ default: false })
    acrobatics: boolean;

    @Prop({ default: false })
    sleightHand: boolean;

    @Prop({ default: false })
    stealth: boolean;

    @Prop({ default: false })
    arcana: boolean;

    @Prop({ default: false })
    history: boolean;

    @Prop({ default: false })
    investigation: boolean;

    @Prop({ default: false })
    nature: boolean;

    @Prop({ default: false })
    religion: boolean;

    @Prop({ default: false })
    animalHandling: boolean;

    @Prop({ default: false })
    insight: boolean;

    @Prop({ default: false })
    medicine: boolean;

    @Prop({ default: false })
    perception: boolean;

    @Prop({ default: false })
    survival: boolean;

    @Prop({ default: false })
    deception: boolean;

    @Prop({ default: false })
    intimidation: boolean;

    @Prop({ default: false })
    performance: boolean;

    @Prop({ default: false })
    persuasion: boolean;
}

export const MasteriesSchema = SchemaFactory.createForClass(Masteries);
