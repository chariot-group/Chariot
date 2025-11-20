import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MasteriesAbility {
    @Prop({ default: false })
    strength: boolean;

    @Prop({ default: false })
    dexterity: boolean;

    @Prop({ default: false })
    constitution: boolean;

    @Prop({ default: false })
    intelligence: boolean;

    @Prop({ default: false })
    wisdom: boolean;

    @Prop({ default: false })
    charisma: boolean;
}

export const MasteriesAbilitySchema = SchemaFactory.createForClass(MasteriesAbility);
