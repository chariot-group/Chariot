import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class History {
    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    @Prop({ required: true, type: Date })
    date: Date;

    @ApiProperty({ example: 'Summer Campaign' })
    @Prop({ required: true })
    campaignName: string;

    @ApiProperty({ example: 100 })
    @Prop({ required: true })
    value: number;
}

export const HistorySchema = SchemaFactory.createForClass(History);
