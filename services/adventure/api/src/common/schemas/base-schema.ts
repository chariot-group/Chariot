import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BaseSchema {
  @Prop({
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        // Validation UUID v4 (format Keycloak ID)
        return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      },
      message: (props: any) => `${props.value} is not a valid Keycloak ID !`
    }
  })
  createdBy: string;
}
