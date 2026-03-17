/* eslint-disable react-refresh/only-export-components */
import { amazonShippingLabelsToolDefinition } from '../definitions';
import {
  createShippingLabelClientAction,
  createShippingLabelHydrateFallback,
  createShippingLabelMeta,
  ShippingLabelRoute,
} from '../shared-route';

export const meta = createShippingLabelMeta(amazonShippingLabelsToolDefinition);

export const HydrateFallback = createShippingLabelHydrateFallback(
  amazonShippingLabelsToolDefinition.title,
);

export const clientAction = createShippingLabelClientAction('amazon');

export default function AmazonShippingLabelsRoute() {
  return (
    <ShippingLabelRoute
      brand="amazon"
      title={amazonShippingLabelsToolDefinition.title}
      description={amazonShippingLabelsToolDefinition.shortDescription}
    />
  );
}
