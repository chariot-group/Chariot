import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Masteries {

    @ApiProperty({ example: true })
    @Prop({ default: false })
    athletics: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    acrobatics: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    sleightHand: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    stealth: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    arcana: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    history: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    investigation: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    nature: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    religion: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    animalHandling: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    insight: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    medicine: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    perception: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    survival: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    deception: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    intimidation: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    performance: boolean;

    @ApiProperty({ example: true })
    @Prop({ default: false })
    persuasion: boolean;
}

export const MasteriesSchema = SchemaFactory.createForClass(Masteries);
